use std::path::PathBuf;

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictScanResult {
    pub id: String,
    pub path: PathBuf,
    pub resources: Vec<IndexedResource>,
    pub conflict_groups: Vec<ResourceConflictGroup>,
    pub warnings: Vec<ConflictWarning>,
    pub stats: ConflictStats,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexedResource {
    pub id: String,
    pub identity_key: String,
    pub name: String,
    pub extension: String,
    pub source_kind: ResourceSourceKind,
    pub path: PathBuf,
    pub relative_path: String,
    pub fingerprint: String,
    pub source_name: String,
    pub size: Option<u64>,
    pub modified_at: Option<u64>,
    pub archive: Option<ArchiveResourceSource>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveResourceSource {
    pub path: PathBuf,
    pub relative_path: String,
    pub format: String,
    pub version: String,
    pub offset: u32,
    pub length: u32,
}

#[derive(Debug, Clone, Copy, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ResourceSourceKind {
    Loose,
    Archive,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceConflictGroup {
    pub id: String,
    pub identity_key: String,
    pub name: String,
    pub extension: String,
    pub conflict_type: ConflictType,
    pub sources: Vec<IndexedResource>,
    pub winner_fingerprint: String,
}

#[derive(Debug, Clone, Copy, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ConflictType {
    LooseVsLoose,
    LooseVsArchive,
    ArchiveVsArchive,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictWarning {
    pub path: PathBuf,
    pub message: String,
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictStats {
    pub indexed_resources: usize,
    pub conflict_groups: usize,
    pub loose_resources: usize,
    pub archive_resources: usize,
    pub warnings: usize,
}
