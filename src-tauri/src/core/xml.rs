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
