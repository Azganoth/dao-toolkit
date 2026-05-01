use std::{
    env, fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

pub struct TestDir {
    path: PathBuf,
}

impl TestDir {
    pub fn new() -> Self {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after unix epoch")
            .as_nanos();
        let path = env::temp_dir().join(format!("dao-toolkit-test-{unique}"));
        fs::create_dir_all(&path).expect("test temp dir should be created");

        Self { path }
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn path_string(&self) -> String {
        self.path.to_string_lossy().into_owned()
    }

    pub fn write_file(&self, relative_path: &str) {
        let path = self.path.join(relative_path);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("test parent dir should be created");
        }
        fs::write(path, b"test").expect("test file should be written");
    }
}

impl Drop for TestDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}
