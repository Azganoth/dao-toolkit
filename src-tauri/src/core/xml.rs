use std::io::Write;

use anyhow::{Context, Result};
use quick_xml::{
    events::{BytesDecl, BytesEnd, BytesStart, Event},
    Writer,
};

pub fn write_declaration<W: Write>(
    writer: &mut Writer<W>,
    version: impl AsRef<str>,
    encoding: Option<&str>,
    standalone: Option<bool>,
) -> Result<()> {
    writer
        .write_event(Event::Decl(BytesDecl::new(
            version.as_ref(),
            encoding,
            standalone.map(|val| if val { "yes" } else { "no" }),
        )))
        .context("Failed to write XML declaration")?;

    Ok(())
}

pub fn write_tag<W, F>(writer: &mut Writer<W>, tag: &str, inner: F) -> Result<()>
where
    W: Write,
    F: FnOnce(&mut Writer<W>) -> Result<()>,
{
    writer
        .write_event(Event::Start(BytesStart::new(tag)))
        .with_context(|| format!("Failed to start tag {}", tag))?;
    inner(writer)?;
    writer
        .write_event(Event::End(BytesEnd::new(tag)))
        .with_context(|| format!("Failed to end tag {}", tag))?;

    Ok(())
}

pub fn write_leaf<W>(writer: &mut Writer<W>, tag: &str, attrs: &[(&str, &str)]) -> Result<()>
where
    W: Write,
{
    let mut elem = BytesStart::new(tag);
    for (key, val) in attrs {
        elem.push_attribute((*key, *val));
    }

    writer
        .write_event(Event::Empty(elem))
        .with_context(|| format!("Failed to write leaf tag {}", tag))?;

    Ok(())
}

pub fn write_list<T, F, W>(
    writer: &mut Writer<W>,
    tag: &str,
    items: impl IntoIterator<Item = T>,
    item_writer: F,
) -> Result<()>
where
    W: Write,
    F: Fn(&mut Writer<W>, T) -> Result<()>,
{
    write_tag(writer, tag, |w| {
        for item in items {
            item_writer(w, item)?;
        }

        Ok(())
    })
}

#[cfg(test)]
mod tests {
    use std::io::{self, Write};

    use quick_xml::events::{BytesText, Event};

    use super::*;
    use crate::test_utils::{collect_xml_resource_names, collect_xml_text};

    #[test]
    fn write_declaration_includes_optional_encoding_and_standalone() {
        let mut output = Vec::new();
        let mut writer = Writer::new(&mut output);

        write_declaration(&mut writer, "1.0", Some("utf-8"), Some(true))
            .expect("declaration should write");

        assert_eq!(
            String::from_utf8(output).expect("xml should be utf-8"),
            r#"<?xml version="1.0" encoding="utf-8" standalone="yes"?>"#
        );
    }

    #[test]
    fn write_tag_wraps_inner_xml_and_write_leaf_escapes_attributes() {
        let mut output = Vec::new();
        let mut writer = Writer::new(&mut output);

        write_tag(&mut writer, "root", |writer| {
            writer.write_event(Event::Text(BytesText::new("DAO mods")))?;
            write_leaf(
                writer,
                "resource",
                &[("name", "hm_cps_custom & \"quoted\".mop")],
            )
        })
        .expect("tag should write");

        let xml = String::from_utf8(output).expect("xml should be utf-8");

        assert_eq!(collect_xml_text(&xml), "DAO mods");
        assert_eq!(
            collect_xml_resource_names(&xml),
            vec!["hm_cps_custom & \"quoted\".mop"]
        );
    }

    #[test]
    fn write_list_preserves_order_and_uses_the_item_writer() {
        let mut output = Vec::new();
        let mut writer = Writer::new(&mut output);

        write_list(
            &mut writer,
            "resources",
            ["first", "second"],
            |writer, name| write_leaf(writer, "resource", &[("name", name)]),
        )
        .expect("list should write");

        let xml = String::from_utf8(output).expect("xml should be utf-8");

        assert_eq!(collect_xml_resource_names(&xml), vec!["first", "second"]);
    }

    #[test]
    fn write_list_still_writes_the_container_when_empty() {
        let mut output = Vec::new();
        let mut writer = Writer::new(&mut output);

        write_list(
            &mut writer,
            "resources",
            Vec::<&str>::new(),
            |writer, name| write_leaf(writer, "resource", &[("name", name)]),
        )
        .expect("empty list should write");

        assert_eq!(
            String::from_utf8(output).expect("xml should be utf-8"),
            "<resources></resources>"
        );
    }

    #[test]
    fn write_failures_include_helper_context() {
        let mut writer = Writer::new(FailingWriter);

        let err = write_declaration(&mut writer, "1.0", None, None)
            .expect_err("failing declaration should return an error");
        assert!(
            err.to_string().contains("Failed to write XML declaration"),
            "unexpected error: {err}"
        );

        let mut writer = Writer::new(FailingWriter);
        let err = write_leaf(&mut writer, "resource", &[("name", "custom")])
            .expect_err("failing leaf should return an error");
        assert!(
            err.to_string()
                .contains("Failed to write leaf tag resource"),
            "unexpected error: {err}"
        );

        let mut writer = Writer::new(FailingWriter);
        let err = write_tag(&mut writer, "root", |_| Ok(()))
            .expect_err("failing tag should return an error");
        assert!(
            err.to_string().contains("Failed to start tag root"),
            "unexpected error: {err}"
        );
    }

    struct FailingWriter;

    impl Write for FailingWriter {
        fn write(&mut self, _buf: &[u8]) -> io::Result<usize> {
            Err(io::Error::other("intentional write failure"))
        }

        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }
}
