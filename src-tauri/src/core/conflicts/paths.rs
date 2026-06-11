use std::path::Path;

pub(super) fn relative_path(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}

pub(super) fn normalized_path_key(path: &Path) -> String {
    path.to_string_lossy()
        .replace('\\', "/")
        .to_ascii_lowercase()
}

pub(super) fn infer_source_name(root: &Path, path: &Path) -> String {
    let relative = path.strip_prefix(root).unwrap_or(path);
    let parts = relative
        .components()
        .filter_map(|component| component.as_os_str().to_str())
        .collect::<Vec<_>>();

    match parts.as_slice() {
        ["AddIns", source, ..] | ["addins", source, ..] => (*source).to_string(),
        ["packages", "core", "override", source, ..] => (*source).to_string(),
        ["Packages", "core", "override", source, ..] => (*source).to_string(),
        _ => "Dragon Age Documents".to_string(),
    }
}
