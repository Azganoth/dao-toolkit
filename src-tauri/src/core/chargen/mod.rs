pub mod consts;
pub mod io;
pub mod models;
pub mod session;

use std::path::Path;

use anyhow::Result;
pub use models::*;
pub use session::*;

impl Chargen {
    pub fn vanilla() -> Self {
        consts::VANILLA_CHARGEN.clone()
    }

    pub fn empty() -> Self {
        Self::default()
    }

    pub fn scan_from_path(path: &Path) -> Result<(Self, ChargenData)> {
        io::scan_from_path(path)
    }

    pub fn save_config_file(&self, output_path: &Path) -> Result<()> {
        io::save_config_file(self, output_path)
    }

    pub fn delete_config_files(path: &Path) -> Result<usize> {
        io::delete_config_files(path)
    }
}
