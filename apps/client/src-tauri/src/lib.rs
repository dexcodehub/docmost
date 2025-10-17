use tauri::Builder;
use tauri_plugin_log::{Builder as LogBuilder};
use log::{LevelFilter, info};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    Builder::default()
        .plugin(
            LogBuilder::new()
                .level(LevelFilter::Debug)
                .build(),
        )
        .setup(|_app| {
            info!("[startup] tauri setup initialized");
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}