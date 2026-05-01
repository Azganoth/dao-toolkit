use std::{
    fs,
    path::{Path, PathBuf},
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};

use anyhow::{Context, Error};
use serde::{Deserialize, Serialize};

use super::{Chargen, ChargenData, Filterable};

static SCAN_ID_COUNTER: AtomicU64 = AtomicU64::new(0);

#[derive(Debug, Deserialize, Serialize)]
pub struct ChargenScanResult {
    pub id: String,
    pub path: PathBuf,
    pub data: ChargenData,
}

#[derive(Default)]
pub struct ChargenSession {
    id: Option<String>,
    data: Option<Chargen>,
    path: Option<PathBuf>,
}

fn format_err(e: Error) -> String {
    e.chain()
        .map(|c| c.to_string())
        .collect::<Vec<_>>()
        .join(": ")
}

fn resolve_path(path: &str) -> Result<PathBuf, String> {
    fs::canonicalize(Path::new(path))
        .with_context(|| format!("Failed to resolve path '{}'", path))
        .map_err(format_err)
}

fn create_scan_id() -> String {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos().to_string())
        .unwrap_or_else(|_| "0".to_string());
    let counter = SCAN_ID_COUNTER.fetch_add(1, Ordering::Relaxed);

    format!("{timestamp}-{counter}")
}

impl ChargenSession {
    pub fn scan(&mut self, path: &str) -> Result<ChargenScanResult, String> {
        let path_buf = resolve_path(path)?;
        let (chargen, data) = Chargen::scan_from_path(&path_buf).map_err(format_err)?;
        let id = create_scan_id();

        self.id = Some(id.clone());
        self.data = Some(chargen);
        self.path = Some(path_buf.clone());

        Ok(ChargenScanResult {
            id,
            path: path_buf,
            data,
        })
    }

    pub fn clear(&mut self, scan_id: &str) -> Result<(), String> {
        let current_id = self
            .id
            .as_ref()
            .ok_or_else(|| "No chargen scan found.".to_string())?;

        if current_id != scan_id {
            return Err("Chargen scan changed. Please refresh the current scan.".to_string());
        }

        self.id = None;
        self.data = None;
        self.path = None;

        Ok(())
    }

    pub fn generate(&self, scan_id: &str, path: &str, disabled: Vec<String>) -> Result<(), String> {
        let requested_path = resolve_path(path)?;

        let mut chargen = self
            .data
            .as_ref()
            .ok_or_else(|| "No chargen data found. Please scan first.".to_string())?
            .clone();

        let id = self
            .id
            .as_ref()
            .ok_or_else(|| "No scan id found. Please scan first.".to_string())?;

        if id != scan_id {
            return Err("Chargen scan changed. Please scan again.".to_string());
        }

        let path = self
            .path
            .as_ref()
            .ok_or_else(|| "No scan path found.".to_string())?;

        if path != &requested_path {
            return Err(
                "Override path changed after the last scan. Please scan again.".to_string(),
            );
        }

        chargen.filter(&disabled.iter().collect());
        chargen.save_config_file(path).map_err(format_err)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_utils::TestDir;

    #[test]
    fn scan_stores_canonical_snapshot_context() {
        let temp = TestDir::new();
        temp.write_file("Mod/hm_cps_custom.mop");
        let mut session = ChargenSession::default();

        let result = session
            .scan(&temp.path_string())
            .expect("scan should succeed");
        let expected_path = fs::canonicalize(temp.path()).expect("test path should canonicalize");

        assert_eq!(result.path, expected_path);
        assert_eq!(session.id.as_ref(), Some(&result.id));
        assert_eq!(session.path.as_ref(), Some(&expected_path));
        assert!(session.data.is_some());
        assert_eq!(result.data.heads.hm.custom[0].name, "hm_cps_custom.mop");
    }

    #[test]
    fn generate_requires_existing_scan() {
        let temp = TestDir::new();
        let session = ChargenSession::default();

        let err = session
            .generate("missing-scan", &temp.path_string(), vec![])
            .expect_err("generate should fail without a scan");

        assert!(
            err.contains("No chargen data found"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn generate_rejects_stale_scan_ids() {
        let temp = TestDir::new();
        temp.write_file("Mod/hm_cps_custom.mop");
        let mut session = ChargenSession::default();
        session
            .scan(&temp.path_string())
            .expect("scan should succeed");

        let err = session
            .generate("stale-scan", &temp.path_string(), vec![])
            .expect_err("generate should reject stale scan id");

        assert!(
            err.contains("Chargen scan changed"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn generate_rejects_previous_scan_id_after_rescan() {
        let first = TestDir::new();
        first.write_file("Mod/hm_cps_first.mop");
        let second = TestDir::new();
        second.write_file("Mod/hm_cps_second.mop");
        let mut session = ChargenSession::default();
        let first_result = session
            .scan(&first.path_string())
            .expect("scan should work");
        let second_result = session
            .scan(&second.path_string())
            .expect("rescan should work");

        assert_ne!(first_result.id, second_result.id);

        let err = session
            .generate(&first_result.id, &first.path_string(), vec![])
            .expect_err("generate should reject the previous scan id");

        assert!(
            err.contains("Chargen scan changed"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn generate_rejects_paths_that_do_not_match_scan_snapshot() {
        let scanned = TestDir::new();
        scanned.write_file("Mod/hm_cps_custom.mop");
        let other = TestDir::new();
        let mut session = ChargenSession::default();
        let result = session
            .scan(&scanned.path_string())
            .expect("scan should work");

        let err = session
            .generate(&result.id, &other.path_string(), vec![])
            .expect_err("generate should reject a different canonical path");

        assert!(
            err.contains("Override path changed"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn generate_writes_from_scan_snapshot_with_disabled_resources_filtered() {
        let temp = TestDir::new();
        temp.write_file("Mod/hm_cps_enabled.mop");
        temp.write_file("Mod/hf_cps_disabled.mop");
        let mut session = ChargenSession::default();
        let result = session.scan(&temp.path_string()).expect("scan should work");

        session
            .generate(
                &result.id,
                &temp.path_string(),
                vec!["hf_cps_disabled.mop".to_string()],
            )
            .expect("generate should succeed");

        let xml = fs::read_to_string(temp.path().join("chargenmorphcfg.xml"))
            .expect("generated xml should be readable");

        assert!(xml.contains("hm_cps_enabled.mop"));
        assert!(!xml.contains("hf_cps_disabled.mop"));
    }

    #[test]
    fn clear_rejects_stale_scan_ids() {
        let temp = TestDir::new();
        temp.write_file("Mod/hm_cps_custom.mop");
        let mut session = ChargenSession::default();
        session.scan(&temp.path_string()).expect("scan should work");

        let err = session
            .clear("stale-scan")
            .expect_err("clear should reject stale scan id");
        assert!(
            err.contains("Chargen scan changed"),
            "unexpected error: {err}"
        );
        assert!(session.id.is_some());
        assert!(session.data.is_some());
        assert!(session.path.is_some());
    }

    #[test]
    fn clear_removes_current_scan_snapshot() {
        let temp = TestDir::new();
        temp.write_file("Mod/hm_cps_custom.mop");
        let mut session = ChargenSession::default();
        let result = session.scan(&temp.path_string()).expect("scan should work");

        session.clear(&result.id).expect("clear should succeed");

        assert!(session.id.is_none());
        assert!(session.data.is_none());
        assert!(session.path.is_none());
    }
}
