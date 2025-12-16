use std::{path::PathBuf, sync::Mutex};

use tauri::Manager;
use tauri_plugin_decorum::WebviewWindowExt;
use tauri_plugin_window_state::StateFlags;

use crate::core::chargen::Chargen;

mod commands;
mod core;

#[derive(Default)]
pub struct ChargenContext {
    pub data: Option<Chargen>,
    pub path: Option<PathBuf>,
}

pub struct ChargenState(pub Mutex<ChargenContext>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ChargenState(Mutex::new(ChargenContext::default())))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(
            tauri_plugin_window_state::Builder::new()
                // Prevent auto showing the window
                .with_state_flags(StateFlags::all() ^ StateFlags::VISIBLE)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_decorum::init())
        .plugin(tauri_plugin_zustand::init())
        .setup(|app| {
            // Create custom title bar
            let main_window = app.get_webview_window("main").unwrap();
            main_window.create_overlay_titlebar().unwrap();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::scan_for_chargen_assets,
            commands::generate_chargen_file,
            commands::delete_all_chargen_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
