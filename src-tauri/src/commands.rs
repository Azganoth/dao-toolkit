use std::path::Path;

use anyhow::Error;
use tauri::State;

use crate::{
    core::chargen::{Chargen, ChargenManifest, ChargenStats, Filterable},
    ChargenState,
};

fn format_err(e: Error) -> String {
    e.chain()
        .map(|c| c.to_string())
        .collect::<Vec<_>>()
        .join(": ")
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
) -> Result<(ChargenStats, ChargenManifest), String> {
    let path_buf = Path::new(&path).to_path_buf();
    let (chargen, stats, manifest) = Chargen::scan_from_path(&path_buf).map_err(format_err)?;

    let mut context = state.0.lock().unwrap();
    context.data = Some(chargen);
    context.path = Some(path_buf);

    Ok((stats, manifest))
}

#[tauri::command]
pub async fn generate_chargen_file(
    state: State<'_, ChargenState>,
    disabled: Vec<String>,
) -> Result<(), String> {
    let context = state.0.lock().unwrap();

    let mut chargen = context
        .data
        .as_ref()
        .ok_or_else(|| "No chargen data found. Please scan first.".to_string())?
        .clone();

    let path = context
        .path
        .as_ref()
        .ok_or_else(|| "No scan path found.".to_string())?;

    chargen.filter(&disabled.iter().collect());
    chargen.save_config_file(path).map_err(format_err)
}
