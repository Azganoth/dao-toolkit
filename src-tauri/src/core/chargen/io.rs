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
    let metadata = fs::metadata(path)
        .with_context(|| format!("Failed to read override directory '{}'", path.display()))?;
    if !metadata.is_dir() {
        anyhow::bail!("Override path is not a directory: {}", path.display());
    }

    let mut count = 0;
    for entry in WalkDir::new(path) {
        let entry =
            entry.with_context(|| format!("Failed to read path under '{}'", path.display()))?;
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

#[cfg(test)]
mod tests {
    use std::{collections::HashSet, fs};

    use super::*;
    use crate::{
        core::chargen::models::{Filterable, HairResource, Resource},
        test_utils::{collect_xml_resource_paths, TestDir},
    };

    #[test]
    fn scan_from_path_rejects_missing_paths() {
        let temp = TestDir::new();
        let missing = temp.path().join("missing");

        let err = scan_from_path(&missing).expect_err("missing path should fail");

        assert!(
            err.to_string()
                .contains("Failed to read override directory"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn scan_from_path_rejects_files() {
        let temp = TestDir::new();
        temp.write_file("not-a-directory.txt");

        let err = scan_from_path(&temp.path().join("not-a-directory.txt"))
            .expect_err("file path should fail");

        assert!(
            err.to_string().contains("Override path is not a directory"),
            "unexpected error: {err}"
        );
    }

    #[test]
    fn scan_from_path_classifies_custom_resources_and_ignores_marked_paths() {
        let temp = TestDir::new();
        temp.write_file("Mod/hm_cps_custom.mop");
        temp.write_file("Mod/hf_har_custom_0.mmh");
        temp.write_file("Mod/hf_har_custom_1.mmh");
        temp.write_file("Mod/dm_brd_custom_0.mmh");
        temp.write_file("Mod/t3_har_fire.tnt");
        temp.write_file("Mod/uh_hed_custom_0d.dds");
        temp.write_file("Mod/uh_tat_custom_0t.dds");
        temp.write_file("Ignored #ignorechargen/hm_cps_ignored.mop");

        let (_chargen, data) = scan_from_path(temp.path()).expect("scan should succeed");

        assert_eq!(data.heads.hm.custom.len(), 1);
        assert_eq!(data.heads.hm.custom[0].name, "hm_cps_custom.mop");
        assert!(data.heads.hm.custom[0]
            .path
            .as_deref()
            .is_some_and(|path| path.ends_with("hm_cps_custom.mop")));
        assert_eq!(data.hairs.hf.custom.len(), 1);
        assert_eq!(data.hairs.hf.custom[0].name, "hf_har_custom_0");
        assert_eq!(data.hairs.hf.custom[0].cut, "1");
        assert!(data.hairs.hf.custom[0]
            .path
            .as_deref()
            .is_some_and(|path| path.ends_with("hf_har_custom_0.mmh")));
        assert_eq!(data.beards.dm.custom.len(), 1);
        assert_eq!(data.beards.dm.custom[0].name, "dm_brd_custom_0");
        assert_eq!(data.tints.hair.custom.len(), 1);
        assert_eq!(data.tints.hair.custom[0].name, "t3_har_fire");
        assert_eq!(data.textures.skin.custom.len(), 1);
        assert_eq!(data.textures.skin.custom[0].name, "uh_hed_custom_0d");
        assert_eq!(data.textures.tattoo.custom.len(), 1);
        assert_eq!(data.textures.tattoo.custom[0].name, "uh_tat_custom_0t");
    }

    #[test]
    fn scan_from_path_classifies_all_tint_categories() {
        let temp = TestDir::new();
        temp.write_file("Mod/t3_har_fire.tnt");
        temp.write_file("Mod/t3_skn_pale.tnt");
        temp.write_file("Mod/t3_eye_green.tnt");
        temp.write_file("Mod/t3_mue_shadow.tnt");
        temp.write_file("Mod/t3_mub_blush.tnt");
        temp.write_file("Mod/t3_mul_lip.tnt");
        temp.write_file("Mod/t3_stb_brow.tnt");
        temp.write_file("Mod/t3_tat_mark.tnt");
        temp.write_file("Mod/t3_unknown_skip.tnt");

        let (_chargen, data) = scan_from_path(temp.path()).expect("scan should succeed");

        assert_eq!(data.tints.hair.custom[0].name, "t3_har_fire");
        assert_eq!(data.tints.skin.custom[0].name, "t3_skn_pale");
        assert_eq!(data.tints.eye.custom[0].name, "t3_eye_green");
        assert_eq!(data.tints.eye_makeup.custom[0].name, "t3_mue_shadow");
        assert_eq!(data.tints.blush_makeup.custom[0].name, "t3_mub_blush");
        assert_eq!(data.tints.lip_makeup.custom[0].name, "t3_mul_lip");
        assert_eq!(data.tints.brow.custom[0].name, "t3_stb_brow");
        assert_eq!(data.tints.tattoo.custom[0].name, "t3_tat_mark");
    }

    #[test]
    fn filter_removes_resources_by_name_across_chargen_groups() {
        let mut chargen = Chargen::default();
        let disabled_head = "hm_cps_disabled.mop".to_string();
        let disabled_hair = "hf_har_disabled_0".to_string();
        let disabled = HashSet::from([&disabled_head, &disabled_hair]);

        chargen
            .heads
            .hm
            .insert(Resource::from("hm_cps_enabled.mop"));
        chargen
            .heads
            .hm
            .insert(Resource::from(disabled_head.clone()));
        chargen.hairs.hf.insert(HairResource {
            name: "hf_har_enabled_0".to_string(),
            cut: "1".to_string(),
            path: None,
        });
        chargen.hairs.hf.insert(HairResource {
            name: disabled_hair.clone(),
            cut: "1".to_string(),
            path: None,
        });

        chargen.filter(&disabled);

        assert!(chargen
            .heads
            .hm
            .iter()
            .any(|r| r.name == "hm_cps_enabled.mop"));
        assert!(!chargen.heads.hm.iter().any(|r| r.name == disabled_head));
        assert!(chargen
            .hairs
            .hf
            .iter()
            .any(|r| r.name == "hf_har_enabled_0"));
        assert!(!chargen.hairs.hf.iter().any(|r| r.name == disabled_hair));
    }

    #[test]
    fn save_config_file_writes_declaration_and_root() {
        let temp = TestDir::new();
        let mut chargen = Chargen::default();
        chargen.heads.hm.insert(Resource::from("hm_cps_custom.mop"));
        chargen.hairs.hf.insert(HairResource {
            name: "hf_har_custom_0".to_string(),
            cut: "1".to_string(),
            path: None,
        });

        save_config_file(&chargen, temp.path()).expect("save should succeed");

        let xml = fs::read_to_string(temp.path().join("chargenmorphcfg.xml"))
            .expect("generated config should be readable");

        assert!(xml.starts_with(r#"<?xml version="1.0" encoding="utf-8"?>"#));
        assert!(xml.contains("<morph_config>"));
    }

    #[test]
    fn save_config_file_writes_expected_xml_structure() {
        let temp = TestDir::new();
        let mut chargen = Chargen::default();
        chargen.heads.hm.insert(Resource::from("hm_cps_custom.mop"));
        chargen.hairs.hf.insert(HairResource {
            name: "hf_har_custom_0".to_string(),
            cut: "1".to_string(),
            path: None,
        });
        chargen.tints.hair.insert(Resource::from("t3_har_fire"));
        chargen
            .textures
            .skin
            .insert(Resource::from("uh_hed_custom_0d"));

        save_config_file(&chargen, temp.path()).expect("save should succeed");

        let xml = fs::read_to_string(temp.path().join("chargenmorphcfg.xml"))
            .expect("generated config should be readable");
        let resources = collect_xml_resource_paths(&xml);

        assert!(resources.contains(&"morph_config/heads/human_male:hm_cps_custom.mop".to_string()));
        assert!(resources
            .contains(&"morph_config/hairs/human_female:hf_har_custom_0:cut=1".to_string()));
        assert!(resources.contains(&"morph_config/hair_colors:t3_har_fire".to_string()));
        assert!(resources.contains(&"morph_config/skins:uh_hed_custom_0d".to_string()));
    }

    #[test]
    fn delete_config_files_recursively_removes_only_chargen_configs() {
        let temp = TestDir::new();
        temp.write_file("chargenmorphcfg.xml");
        temp.write_file("Nested/chargenmorphcfg.xml");
        temp.write_file("Nested/keep.xml");
        temp.write_file("Nested/chargenmorphcfg.backup.xml");

        let count = delete_config_files(temp.path()).expect("delete should succeed");

        assert_eq!(count, 2);
        assert!(!temp.path().join("chargenmorphcfg.xml").exists());
        assert!(!temp.path().join("Nested/chargenmorphcfg.xml").exists());
        assert!(temp.path().join("Nested/keep.xml").exists());
        assert!(temp
            .path()
            .join("Nested/chargenmorphcfg.backup.xml")
            .exists());
    }

    #[test]
    fn delete_config_files_rejects_invalid_cleanup_roots() {
        let temp = TestDir::new();
        temp.write_file("not-a-directory.txt");

        let missing = temp.path().join("missing");
        let missing_err =
            delete_config_files(&missing).expect_err("missing cleanup root should fail");
        assert!(
            missing_err
                .to_string()
                .contains("Failed to read override directory"),
            "unexpected error: {missing_err}"
        );

        let file_err = delete_config_files(&temp.path().join("not-a-directory.txt"))
            .expect_err("file cleanup root should fail");
        assert!(
            file_err
                .to_string()
                .contains("Override path is not a directory"),
            "unexpected error: {file_err}"
        );
    }
}
