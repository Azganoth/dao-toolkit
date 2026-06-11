use std::path::Path;

use tauri::State;

use crate::{
    core::{
        chargen::{Chargen, ChargenScanResult},
        conflicts::{scan_for_conflicts, ConflictScanResult},
    },
    ChargenState,
};

fn format_err(error: anyhow::Error) -> String {
    error
        .chain()
        .map(|cause| cause.to_string())
        .collect::<Vec<_>>()
        .join(": ")
}

#[tauri::command]
pub async fn delete_all_chargen_files(path: String) -> Result<usize, String> {
    Chargen::delete_config_files(Path::new(&path)).map_err(format_err)
}

#[tauri::command]
pub async fn scan_for_chargen_assets(
    path: String,
    state: State<'_, ChargenState>,
) -> Result<ChargenScanResult, String> {
    let mut context = state.0.lock().unwrap();
    context.scan(&path)
}

#[tauri::command]
pub async fn clear_chargen_scan(
    state: State<'_, ChargenState>,
    scan_id: String,
) -> Result<(), String> {
    let mut context = state.0.lock().unwrap();
    context.clear(&scan_id)
}

#[tauri::command]
pub async fn generate_chargen_file(
    state: State<'_, ChargenState>,
    scan_id: String,
    path: String,
    disabled: Vec<String>,
) -> Result<(), String> {
    let context = state.0.lock().unwrap();
    context.generate(&scan_id, &path, disabled)
}

#[tauri::command]
pub async fn scan_for_resource_conflicts(path: String) -> Result<ConflictScanResult, String> {
    scan_for_conflicts(&path)
}
