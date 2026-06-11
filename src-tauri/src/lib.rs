use std::sync::Mutex;

use tauri::Manager;
use tauri_plugin_frame::FramePluginBuilder;
use tauri_plugin_window_state::StateFlags;

use crate::core::chargen::ChargenSession;

mod commands;
mod core;

#[cfg(test)]
mod test_utils;

pub struct ChargenState(pub Mutex<ChargenSession>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ChargenState(Mutex::new(ChargenSession::default())))
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
        .plugin(
            FramePluginBuilder::new()
                .titlebar_height(32)
                .button_width(52)
                .auto_titlebar(true)
                .button_hover_bg("color-mix(in srgb, currentColor 12%, transparent)")
                .build(),
        )
        .plugin(tauri_plugin_zustand::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan_for_chargen_assets,
            commands::generate_chargen_file,
            commands::clear_chargen_scan,
            commands::delete_all_chargen_files,
            commands::scan_for_resource_conflicts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
