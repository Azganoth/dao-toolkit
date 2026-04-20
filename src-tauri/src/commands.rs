use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use anyhow::{Context, Error};
use serde::Serialize;
use tauri::State;

use crate::{
    core::chargen::{Chargen, ChargenData, Filterable},
    ChargenState,
};

#[derive(Serialize)]
pub struct ChargenScanResult {
    id: String,
    path: PathBuf,
    data: ChargenData,
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
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

#[tauri::command]
pub async fn delete_all_chargen_files(path: String) -> Result<usize, String> {
    let path_buf = Path::new(&path).to_path_buf();
    Chargen::delete_config_files(&path_buf).map_err(format_err)
}

#[tauri::command]
pub async fn scan_for_chargen_assets(
    path: String,
    state: State<'_, ChargenState>,
) -> Result<ChargenScanResult, String> {
    let path_buf = resolve_path(&path)?;
    let (chargen, data) = Chargen::scan_from_path(&path_buf).map_err(format_err)?;
    let id = create_scan_id();

    let mut context = state.0.lock().unwrap();
    context.id = Some(id.clone());
    context.data = Some(chargen);
    context.path = Some(path_buf.clone());

    Ok(ChargenScanResult {
        id,
        path: path_buf,
        data,
    })
}

#[tauri::command]
pub async fn clear_chargen_scan(
    state: State<'_, ChargenState>,
    scan_id: String,
) -> Result<(), String> {
    let mut context = state.0.lock().unwrap();
    let current_id = context
        .id
        .as_ref()
        .ok_or_else(|| "No chargen scan found.".to_string())?;

    if current_id != &scan_id {
        return Err("Chargen scan changed. Please refresh the current scan.".to_string());
    }

    context.id = None;
    context.data = None;
    context.path = None;

    Ok(())
}

#[tauri::command]
pub async fn generate_chargen_file(
    state: State<'_, ChargenState>,
    scan_id: String,
    path: String,
    disabled: Vec<String>,
) -> Result<(), String> {
    let requested_path = resolve_path(&path)?;
    let context = state.0.lock().unwrap();

    let mut chargen = context
        .data
        .as_ref()
        .ok_or_else(|| "No chargen data found. Please scan first.".to_string())?
        .clone();

    let id = context
        .id
        .as_ref()
        .ok_or_else(|| "No scan id found. Please scan first.".to_string())?;

    if id != &scan_id {
        return Err("Chargen scan changed. Please scan again.".to_string());
    }

    let path = context
        .path
        .as_ref()
        .ok_or_else(|| "No scan path found.".to_string())?;

    if path != &requested_path {
        return Err("Override path changed after the last scan. Please scan again.".to_string());
    }

    chargen.filter(&disabled.iter().collect());
    chargen.save_config_file(path).map_err(format_err)
}
