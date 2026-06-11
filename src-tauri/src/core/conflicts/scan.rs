use std::{
    collections::BTreeMap,
    fs,
    path::Path,
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};

use anyhow::{Context, Error, Result};
use walkdir::{DirEntry, WalkDir};

use super::{
    archive::read_archive,
    models::{
        ArchiveResourceSource, ConflictScanResult, ConflictStats, ConflictType, ConflictWarning,
        IndexedResource, ResourceConflictGroup, ResourceSourceKind,
    },
    paths::{infer_source_name, normalized_path_key, relative_path},
};

static SCAN_ID_COUNTER: AtomicU64 = AtomicU64::new(0);

const IGNORED_RESOURCE_NAMES: &[&str] = &["manifest.xml", "credits.txt", "readme.txt"];
const OVERRIDE_RELATIVE_PATH: &[&str] = &["packages", "core", "override"];

pub fn scan_for_conflicts(path: &str) -> Result<ConflictScanResult, String> {
    scan_for_conflicts_inner(path).map_err(format_err)
}

fn scan_for_conflicts_inner(path: &str) -> Result<ConflictScanResult> {
    let root = fs::canonicalize(Path::new(path))
        .with_context(|| format!("Failed to resolve conflicts path '{path}'"))?;
    let metadata = fs::metadata(&root)
        .with_context(|| format!("Failed to read conflicts path '{}'", root.display()))?;
    if !metadata.is_dir() {
        anyhow::bail!("Conflicts path is not a directory: {}", root.display());
    }

    let override_dir = OVERRIDE_RELATIVE_PATH
        .iter()
        .fold(root.clone(), |path, segment| path.join(segment));
    let mut warnings = Vec::new();
    let mut resources = Vec::new();

    for entry in collect_entries(&root, &mut warnings) {
        process_file(&root, &override_dir, &entry, &mut resources, &mut warnings);
    }

    let conflict_groups = build_conflict_groups(&resources);
    let stats = ConflictStats {
        indexed_resources: resources.len(),
        conflict_groups: conflict_groups.len(),
        loose_resources: resources
            .iter()
            .filter(|resource| resource.source_kind == ResourceSourceKind::Loose)
            .count(),
        archive_resources: resources
            .iter()
            .filter(|resource| resource.source_kind == ResourceSourceKind::Archive)
            .count(),
        warnings: warnings.len(),
    };

    Ok(ConflictScanResult {
        id: create_scan_id(),
        path: root,
        resources,
        conflict_groups,
        warnings,
        stats,
    })
}

fn collect_entries(root: &Path, warnings: &mut Vec<ConflictWarning>) -> Vec<DirEntry> {
    let mut entries = WalkDir::new(root)
        .into_iter()
        .filter_map(|entry| match entry {
            Ok(entry) if entry.file_type().is_file() => Some(entry),
            Ok(_) => None,
            Err(error) => {
                warnings.push(ConflictWarning {
                    path: error
                        .path()
                        .map(Path::to_path_buf)
                        .unwrap_or_else(|| root.to_path_buf()),
                    message: error.to_string(),
                });
                None
            }
        })
        .collect::<Vec<_>>();

    entries.sort_by(|a, b| normalized_path_key(a.path()).cmp(&normalized_path_key(b.path())));
    entries
}

fn process_file(
    root: &Path,
    override_dir: &Path,
    entry: &DirEntry,
    resources: &mut Vec<IndexedResource>,
    warnings: &mut Vec<ConflictWarning>,
) {
    let path = entry.path();

    match read_archive(path) {
        Ok(Some(archive)) => {
            let archive_relative_path = relative_path(root, path);
            for archive_entry in archive.entries {
                if should_ignore_resource(&archive_entry.name) {
                    continue;
                }

                let (identity_key, extension) = resource_identity(&archive_entry.name);
                let fingerprint = format!(
                    "archive:{}::{}@{}:{}",
                    normalized_path_key(path),
                    archive_entry.name.to_ascii_lowercase(),
                    archive_entry.offset,
                    archive_entry.length
                );

                resources.push(IndexedResource {
                    id: fingerprint.clone(),
                    identity_key,
                    name: archive_entry.name.clone(),
                    extension,
                    source_kind: ResourceSourceKind::Archive,
                    path: path.to_path_buf(),
                    relative_path: archive_relative_path.clone(),
                    fingerprint,
                    source_name: infer_source_name(root, path),
                    size: None,
                    modified_at: None,
                    archive: Some(ArchiveResourceSource {
                        path: path.to_path_buf(),
                        relative_path: archive_relative_path.clone(),
                        format: archive.format.clone(),
                        version: archive.version.clone(),
                        offset: archive_entry.offset,
                        length: archive_entry.length,
                    }),
                });
            }
        }
        Ok(None) if path.starts_with(override_dir) => {
            let Some(file_name) = path.file_name().and_then(|name| name.to_str()) else {
                return;
            };
            if should_ignore_resource(file_name) {
                return;
            }

            let metadata = match entry.metadata() {
                Ok(metadata) => metadata,
                Err(error) => {
                    warnings.push(ConflictWarning {
                        path: path.to_path_buf(),
                        message: error.to_string(),
                    });
                    return;
                }
            };
            let (identity_key, extension) = resource_identity(file_name);
            let fingerprint = format!("loose:{}", normalized_path_key(path));

            resources.push(IndexedResource {
                id: fingerprint.clone(),
                identity_key,
                name: file_name.to_string(),
                extension,
                source_kind: ResourceSourceKind::Loose,
                path: path.to_path_buf(),
                relative_path: relative_path(root, path),
                fingerprint,
                source_name: infer_source_name(root, path),
                size: Some(metadata.len()),
                modified_at: metadata.modified().ok().and_then(system_time_millis),
                archive: None,
            });
        }
        Ok(None) => {}
        Err(error) => {
            warnings.push(ConflictWarning {
                path: path.to_path_buf(),
                message: format_err(error),
            });
        }
    }
}

fn build_conflict_groups(resources: &[IndexedResource]) -> Vec<ResourceConflictGroup> {
    let mut by_identity: BTreeMap<String, Vec<IndexedResource>> = BTreeMap::new();

    for resource in resources {
        by_identity
            .entry(resource.identity_key.clone())
            .or_default()
            .push(resource.clone());
    }

    by_identity
        .into_iter()
        .filter_map(|(identity_key, mut sources)| {
            if sources.len() < 2 {
                return None;
            }

            sources.sort_by(|a, b| a.fingerprint.cmp(&b.fingerprint));
            let winner_fingerprint = sources
                .last()
                .map(|source| source.fingerprint.clone())
                .unwrap_or_default();
            let loose_count = sources
                .iter()
                .filter(|source| source.source_kind == ResourceSourceKind::Loose)
                .count();
            let archive_count = sources.len() - loose_count;
            let conflict_type = match (loose_count > 0, archive_count > 0) {
                (true, true) => ConflictType::LooseVsArchive,
                (true, false) => ConflictType::LooseVsLoose,
                (false, true) => ConflictType::ArchiveVsArchive,
                (false, false) => return None,
            };
            let name = sources
                .first()
                .map(|source| source.name.clone())
                .unwrap_or_else(|| identity_key.clone());
            let extension = sources
                .first()
                .map(|source| source.extension.clone())
                .unwrap_or_default();

            Some(ResourceConflictGroup {
                id: identity_key.clone(),
                identity_key,
                name,
                extension,
                conflict_type,
                sources,
                winner_fingerprint,
            })
        })
        .collect()
}

fn resource_identity(name: &str) -> (String, String) {
    let extension = name
        .rsplit_once('.')
        .map(|(_, extension)| extension.to_ascii_lowercase())
        .unwrap_or_default();
    let key = name.to_ascii_lowercase();

    (key, extension)
}

fn should_ignore_resource(name: &str) -> bool {
    let name = name.to_ascii_lowercase();
    IGNORED_RESOURCE_NAMES
        .iter()
        .any(|ignored| *ignored == name)
}

fn system_time_millis(time: SystemTime) -> Option<u64> {
    time.duration_since(UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_millis() as u64)
}

fn format_err(e: Error) -> String {
    e.chain()
        .map(|c| c.to_string())
        .collect::<Vec<_>>()
        .join(": ")
}

fn create_scan_id() -> String {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos().to_string())
        .unwrap_or_else(|_| "0".to_string());
    let counter = SCAN_ID_COUNTER.fetch_add(1, Ordering::Relaxed);

    format!("{timestamp}-{counter}")
}

#[cfg(test)]
mod tests {
    use std::fs;

    use super::*;
    use crate::{core::conflicts::archive::tests::write_test_archive, test_utils::TestDir};

    #[test]
    fn scan_rejects_missing_roots() {
        let temp = TestDir::new();
        let err = scan_for_conflicts_inner(&temp.path().join("missing").to_string_lossy())
            .expect_err("missing root should fail");

        assert!(
            format_err(err).contains("Failed to resolve conflicts path"),
            "unexpected error"
        );
    }

    #[test]
    fn scan_rejects_files_as_roots() {
        let temp = TestDir::new();
        temp.write_file("root.txt");

        let err = scan_for_conflicts_inner(&temp.path().join("root.txt").to_string_lossy())
            .expect_err("file root should fail");

        assert!(
            format_err(err).contains("Conflicts path is not a directory"),
            "unexpected error"
        );
    }

    #[test]
    fn scan_indexes_loose_override_duplicates() {
        let temp = TestDir::new();
        temp.write_file("packages/core/override/ModA/shared.utc");
        temp.write_file("packages/core/override/ModB/SHARED.UTC");
        temp.write_file("packages/core/override/ModB/readme.txt");
        temp.write_file("AddIns/Example/core/data/shared.utc");

        let result = scan_for_conflicts_inner(&temp.path_string()).expect("scan should succeed");

        assert_eq!(result.stats.indexed_resources, 2);
        assert_eq!(result.conflict_groups.len(), 1);
        assert_eq!(result.conflict_groups[0].identity_key, "shared.utc");
        assert_eq!(
            result.conflict_groups[0].conflict_type,
            ConflictType::LooseVsLoose
        );
        assert_eq!(result.conflict_groups[0].sources.len(), 2);
    }

    #[test]
    fn scan_indexes_archive_entries_by_header() {
        let temp = TestDir::new();
        temp.write_file("packages/core/override/Loose/shared.utc");
        let archive_path = temp.path().join("AddIns/Test/core/data/test.rim");
        fs::create_dir_all(archive_path.parent().expect("archive should have parent"))
            .expect("archive parent should be created");
        write_test_archive(&archive_path, &[("shared.utc", 128, 16)]);

        let result = scan_for_conflicts_inner(&temp.path_string()).expect("scan should succeed");

        assert_eq!(result.stats.archive_resources, 1);
        assert_eq!(result.conflict_groups.len(), 1);
        assert_eq!(
            result.conflict_groups[0].conflict_type,
            ConflictType::LooseVsArchive
        );
        assert!(result.conflict_groups[0].sources.iter().any(|source| {
            source.source_kind == ResourceSourceKind::Archive && source.archive.is_some()
        }));
    }

    #[test]
    fn scan_collects_archive_parse_warnings() {
        let temp = TestDir::new();
        fs::create_dir_all(temp.path().join("AddIns/Test/core/data"))
            .expect("test dir should be created");
        fs::write(
            temp.path().join("AddIns/Test/core/data/broken.erf"),
            b"E\0R\0F\0 \0V\000\0.\0009\0",
        )
        .expect("broken archive should be written");

        let result = scan_for_conflicts_inner(&temp.path_string()).expect("scan should succeed");

        assert_eq!(result.warnings.len(), 1);
        assert!(result.warnings[0]
            .message
            .contains("Unsupported archive version"));
    }

    #[test]
    fn conflict_groups_mark_last_sorted_source_as_winner() {
        let temp = TestDir::new();
        temp.write_file("packages/core/override/A/shared.utc");
        temp.write_file("packages/core/override/Z/shared.utc");

        let result = scan_for_conflicts_inner(&temp.path_string()).expect("scan should succeed");
        let group = &result.conflict_groups[0];

        assert_eq!(
            group.winner_fingerprint,
            group
                .sources
                .last()
                .expect("group should have sources")
                .fingerprint
        );
    }
}
