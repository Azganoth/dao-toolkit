use std::{
    env, fs,
    path::{Path, PathBuf},
    process,
    sync::atomic::{AtomicU64, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};

use quick_xml::{events::Event, Reader};

static TEST_DIR_COUNTER: AtomicU64 = AtomicU64::new(0);

pub struct TestDir {
    path: PathBuf,
}

impl TestDir {
    pub fn new() -> Self {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after unix epoch")
            .as_nanos();
        let counter = TEST_DIR_COUNTER.fetch_add(1, Ordering::Relaxed);
        let path = env::temp_dir().join(format!(
            "dao-toolkit-test-{}-{unique}-{counter}",
            process::id()
        ));
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

pub fn collect_xml_text(xml: &str) -> String {
    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);
    let mut text = String::new();

    loop {
        match reader.read_event().expect("xml event should be readable") {
            Event::Text(event) => {
                text.push_str(&event.decode().expect("text should decode").into_owned());
            }
            Event::Eof => break,
            _ => {}
        }
    }

    text
}

pub fn collect_xml_resource_names(xml: &str) -> Vec<String> {
    let mut reader = Reader::from_str(xml);
    let mut names = Vec::new();

    loop {
        match reader.read_event().expect("xml event should be readable") {
            Event::Empty(event) if event.name().as_ref() == b"resource" => {
                for attr in event.attributes() {
                    let attr = attr.expect("attribute should be readable");
                    if attr.key.as_ref() == b"name" {
                        names.push(
                            attr.decode_and_unescape_value(reader.decoder())
                                .expect("attribute value should decode")
                                .into_owned(),
                        );
                    }
                }
            }
            Event::Eof => break,
            _ => {}
        }
    }

    names
}

pub fn collect_xml_resource_paths(xml: &str) -> Vec<String> {
    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);
    let mut stack = Vec::new();
    let mut resources = Vec::new();

    loop {
        match reader.read_event().expect("xml event should be readable") {
            Event::Start(event) => {
                stack.push(String::from_utf8_lossy(event.name().as_ref()).into_owned());
            }
            Event::Empty(event) if event.name().as_ref() == b"resource" => {
                let mut name = None;
                let mut cut = None;

                for attr in event.attributes() {
                    let attr = attr.expect("resource attribute should be readable");
                    let key = attr.key.as_ref();
                    let value = attr
                        .decode_and_unescape_value(reader.decoder())
                        .expect("resource attribute value should decode")
                        .into_owned();

                    match key {
                        b"name" => name = Some(value),
                        b"cut" => cut = Some(value),
                        _ => {}
                    }
                }

                let name = name.expect("resource should have a name");
                let path = stack.join("/");
                resources.push(match cut {
                    Some(cut) => format!("{path}:{name}:cut={cut}"),
                    None => format!("{path}:{name}"),
                });
            }
            Event::End(_) => {
                stack.pop();
            }
            Event::Eof => break,
            _ => {}
        }
    }

    resources
}
