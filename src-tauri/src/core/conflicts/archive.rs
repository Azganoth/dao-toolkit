use std::{
    fs::File,
    io::{self, Read, Seek},
    path::Path,
};

use anyhow::{Context, Result};

#[derive(Debug)]
pub struct Archive {
    pub format: String,
    pub version: String,
    pub entries: Vec<ArchiveEntry>,
}

#[derive(Debug)]
pub struct ArchiveEntry {
    pub name: String,
    pub offset: u32,
    pub length: u32,
}

pub fn read_archive(path: &Path) -> Result<Option<Archive>> {
    let mut file =
        File::open(path).with_context(|| format!("Failed to open archive '{}'", path.display()))?;

    let Some((format, version)) = read_archive_header(&mut file)? else {
        return Ok(None);
    };

    let entries = read_entries(&mut file, &version)
        .with_context(|| format!("Failed to parse archive '{}'", path.display()))?;

    Ok(Some(Archive {
        format,
        version,
        entries,
    }))
}

fn read_archive_header<R: Read>(reader: &mut R) -> Result<Option<(String, String)>> {
    let mut header = [0u8; 16];
    match reader.read_exact(&mut header) {
        Ok(()) => {}
        Err(error) if error.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(error) => return Err(error.into()),
    }

    let format = decode_utf16le(&header[0..8])?;
    let version = decode_utf16le(&header[8..16])?;

    if format != "ERF " {
        return Ok(None);
    }

    match version.as_str() {
        "V2.0" | "V2.2" => Ok(Some((format, version))),
        _ => anyhow::bail!("Unsupported archive version: {version}"),
    }
}

fn read_entries<R: Read + Seek>(reader: &mut R, version: &str) -> Result<Vec<ArchiveEntry>> {
    let mut header = [0u8; 16];
    reader.read_exact(&mut header)?;

    let file_count = read_u32(&header[0..4]);
    let entry_size = if version == "V2.2" { 76 } else { 72 };
    let mut entries = Vec::with_capacity(file_count as usize);

    for index in 0..file_count {
        let mut entry_data = vec![0u8; entry_size];
        reader
            .read_exact(&mut entry_data)
            .with_context(|| format!("Failed to read archive entry {index}"))?;

        let name = decode_utf16le(&entry_data[0..64])?;
        if name.is_empty() {
            anyhow::bail!("Archive entry {index} has an empty resource name");
        }

        let offset = read_u32(&entry_data[64..68]);
        let packed_length = read_u32(&entry_data[68..72]);
        let length = if version == "V2.2" {
            read_u32(&entry_data[72..76])
        } else {
            packed_length
        };

        entries.push(ArchiveEntry {
            name,
            offset,
            length,
        });
    }

    Ok(entries)
}

fn decode_utf16le(bytes: &[u8]) -> Result<String> {
    if bytes.len() % 2 != 0 {
        anyhow::bail!("Invalid UTF-16LE byte length");
    }

    let chars = bytes
        .chunks_exact(2)
        .map(|chunk| u16::from_le_bytes([chunk[0], chunk[1]]))
        .collect::<Vec<_>>();

    Ok(String::from_utf16_lossy(&chars)
        .trim_end_matches('\0')
        .to_string())
}

fn read_u32(bytes: &[u8]) -> u32 {
    let mut buf = [0u8; 4];
    buf.copy_from_slice(bytes);
    u32::from_le_bytes(buf)
}

#[cfg(test)]
pub mod tests {
    use std::{fs, path::Path};

    fn push_utf16le(buffer: &mut Vec<u8>, value: &str, chars: usize) {
        let mut encoded = value.encode_utf16().collect::<Vec<_>>();
        encoded.resize(chars, 0);
        for value in encoded {
            buffer.extend_from_slice(&value.to_le_bytes());
        }
    }

    pub fn write_test_archive(path: &Path, entries: &[(&str, u32, u32)]) {
        let mut data = Vec::new();
        push_utf16le(&mut data, "ERF ", 4);
        push_utf16le(&mut data, "V2.0", 4);
        data.extend_from_slice(&(entries.len() as u32).to_le_bytes());
        data.extend_from_slice(&123u32.to_le_bytes());
        data.extend_from_slice(&45u32.to_le_bytes());
        data.extend_from_slice(&u32::MAX.to_le_bytes());

        for (name, offset, length) in entries {
            push_utf16le(&mut data, name, 32);
            data.extend_from_slice(&offset.to_le_bytes());
            data.extend_from_slice(&length.to_le_bytes());
        }

        fs::write(path, data).expect("test archive should be written");
    }

    #[test]
    fn reads_erf_v20_entries() {
        let temp = crate::test_utils::TestDir::new();
        let archive_path = temp.path().join("test.erf");
        write_test_archive(
            &archive_path,
            &[("shared.utc", 128, 16), ("other.gda", 144, 32)],
        );

        let archive = super::read_archive(&archive_path)
            .expect("archive should parse")
            .expect("archive should be detected");

        assert_eq!(archive.version, "V2.0");
        assert_eq!(archive.entries[0].name, "shared.utc");
        assert_eq!(archive.entries[0].offset, 128);
        assert_eq!(archive.entries[0].length, 16);
    }

    #[test]
    fn ignores_non_archives() {
        let temp = crate::test_utils::TestDir::new();
        temp.write_file("plain.txt");

        let archive =
            super::read_archive(&temp.path().join("plain.txt")).expect("plain file should read");

        assert!(archive.is_none());
    }
}
