use std::{
    fs,
    io::{BufWriter, Write},
    path::Path,
};

use anyhow::{Context, Result};
use quick_xml::Writer;
use walkdir::WalkDir;

use super::{consts::VANILLA_CHARGEN, models::*};
use crate::core::xml::{write_declaration, write_leaf, write_list, write_tag};

/* Scan */

pub fn scan_from_path(path: &Path) -> Result<(Chargen, ChargenData)> {
    let metadata = fs::metadata(path)
        .with_context(|| format!("Failed to read override directory '{}'", path.display()))?;
    if !metadata.is_dir() {
        anyhow::bail!("Override path is not a directory: {}", path.display());
    }

    let mut custom_chargen = Chargen::default();
    scan_directory(&mut custom_chargen, path)?;

    let mut total_chargen = VANILLA_CHARGEN.clone();
    total_chargen.merge(&custom_chargen);

    let data = ChargenData::from_chargens(&VANILLA_CHARGEN, &custom_chargen);

    Ok((total_chargen, data))
}

fn scan_directory(chargen: &mut Chargen, override_dir: &Path) -> Result<()> {
    for entry in WalkDir::new(override_dir)
        .into_iter()
        .filter_entry(|entry| !is_ignored_chargen_path(entry.path()))
    {
        let entry = entry
            .with_context(|| format!("Failed to read path under '{}'", override_dir.display()))?;
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        let Some(resource) = path.file_name().and_then(|s| s.to_str()) else {
            continue;
        };

        process_resource(chargen, resource, path);
    }

    Ok(())
}

fn is_ignored_chargen_path(path: &Path) -> bool {
    path.to_string_lossy().contains("#ignorechargen")
}

fn process_resource(chargen: &mut Chargen, resource: &str, path: &Path) {
    let (name, extension) = match resource.rsplit_once('.') {
        Some((stem, ext)) if !stem.is_empty() && !ext.is_empty() => (stem, ext),
        _ => return,
    };

    let mut parts = name.split('_');

    let mk_res = |name: &str| Resource {
        name: name.to_string(),
        path: Some(path.to_string_lossy().into_owned()),
    };

    let mk_hair = |name: &str, cut: &str| HairResource {
        name: name.to_string(),
        cut: cut.to_string(),
        path: Some(path.to_string_lossy().into_owned()),
    };

    match extension {
        "mop" => {
            if let Some(prefix) = parts.next() {
                let set = match prefix {
                    "hm" => &mut chargen.heads.hm,
                    "hf" => &mut chargen.heads.hf,
                    "dm" => &mut chargen.heads.dm,
                    "df" => &mut chargen.heads.df,
                    "em" => &mut chargen.heads.em,
                    "ef" => &mut chargen.heads.ef,
                    _ => return,
                };
                set.insert(mk_res(&format!("{name}.{extension}")));
            }
        }
        "mmh" => match (parts.next(), parts.next()) {
            (Some(prefix), Some("har")) => {
                if !name.ends_with('0') {
                    return;
                }

                let set = match prefix {
                    "hm" => &mut chargen.hairs.hm,
                    "hf" => &mut chargen.hairs.hf,
                    "dm" => &mut chargen.hairs.dm,
                    "df" => &mut chargen.hairs.df,
                    "em" => &mut chargen.hairs.em,
                    "ef" => &mut chargen.hairs.ef,
                    _ => return,
                };
                set.insert(mk_hair(name, "1"));
            }
            (Some(prefix), Some("brd")) => {
                if !name.ends_with('0') {
                    return;
                }

                let set = match prefix {
                    "hm" => &mut chargen.beards.hm,
                    "dm" => &mut chargen.beards.dm,
                    _ => return,
                };
                set.insert(mk_res(name));
            }
            _ => (),
        },
        "tnt" => {
            if let Some(category) = parts.nth(1) {
                // Skip prefix, get category
                let set = match category {
                    "har" => &mut chargen.tints.hair,
                    "skn" => &mut chargen.tints.skin,
                    "eye" => &mut chargen.tints.eye,
                    "mue" => &mut chargen.tints.eye_makeup,
                    "mub" => &mut chargen.tints.blush_makeup,
                    "mul" => &mut chargen.tints.lip_makeup,
                    "stb" => &mut chargen.tints.brow,
                    "tat" => &mut chargen.tints.tattoo,
                    _ => return,
                };
                set.insert(mk_res(name));
            }
        }
        "dds" => {
            // TODO: remove redundancy
            let mut parts = name.split('_');
            if let (Some("uh"), Some(category)) = (parts.next(), parts.next()) {
                if let Some(suffix) = name.split('_').last() {
                    let set = match (category, suffix) {
                        ("tat", "0t") => &mut chargen.textures.tattoo,
                        ("hed", "0d") => &mut chargen.textures.skin,
                        _ => return,
                    };
                    set.insert(mk_res(name));
                }
            }
        }
        _ => (),
    }
}

/* Cleanup */

pub fn delete_config_files(path: &Path) -> Result<usize> {
    let mut count = 0;
    for entry in WalkDir::new(path).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() && entry.file_name() == "chargenmorphcfg.xml" {
            fs::remove_file(entry.path())
                .with_context(|| format!("Failed to remove file: {}", entry.path().display()))?;
            count += 1;
        }
    }

    Ok(count)
}

/* Save */

pub fn save_config_file(chargen: &Chargen, output_path: &Path) -> Result<()> {
    let file_path = output_path.join("chargenmorphcfg.xml");
    let file = fs::File::create(&file_path)
        .with_context(|| format!("Failed to create file '{}'", file_path.display()))?;
    let writer = BufWriter::new(file);

    let mut writer = Writer::new_with_indent(writer, b'\t', 1);

    write_declaration(&mut writer, "1.0", Some("utf-8"), None)?;
    write_tag(&mut writer, "morph_config", |w| {
        write_tag(w, "heads", |w| {
            for (tag, items) in chargen.heads.iter_with_tags() {
                write_list(w, tag, items, write_resource)?;
            }

            Ok(())
        })?;
        write_tag(w, "hairs", |w| {
            for (tag, items) in chargen.hairs.iter_with_tags() {
                write_list(w, tag, items, write_hair_resource)?;
            }

            Ok(())
        })?;
        write_tag(w, "beards", |w| {
            for (tag, items) in chargen.beards.iter_with_tags() {
                write_list(w, tag, items, write_resource)?;
            }

            Ok(())
        })?;

        for (tag, items) in chargen.tints.iter_with_tags() {
            write_list(w, tag, items, write_resource)?;
        }

        for (tag, items) in chargen.textures.iter_with_tags() {
            write_list(w, tag, items, write_resource)?;
        }

        Ok(())
    })
}

fn write_resource<W: Write>(writer: &mut Writer<W>, res: &Resource) -> Result<()> {
    write_leaf(writer, "resource", &[("name", &res.name)])
}

fn write_hair_resource<W: Write>(writer: &mut Writer<W>, res: &HairResource) -> Result<()> {
    write_leaf(
        writer,
        "resource",
        &[("name", &res.name), ("cut", &res.cut)],
    )
}
