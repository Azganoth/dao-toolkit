use std::{
    collections::HashSet,
    hash::{Hash, Hasher},
};

use indexmap::IndexSet;
use serde::{Deserialize, Serialize};

/* Resource Structures */

#[derive(Clone, Debug, Serialize, Deserialize, Eq)]
pub struct Resource {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

impl PartialEq for Resource {
    fn eq(&self, other: &Self) -> bool {
        self.name == other.name
    }
}

impl Hash for Resource {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.name.hash(state);
    }
}

impl From<&str> for Resource {
    fn from(name: &str) -> Self {
        Self {
            name: name.to_string(),
            path: None,
        }
    }
}

impl From<String> for Resource {
    fn from(name: String) -> Self {
        Self { name, path: None }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Eq)]
pub struct HairResource {
    pub name: String,
    pub cut: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

impl PartialEq for HairResource {
    fn eq(&self, other: &Self) -> bool {
        self.name == other.name && self.cut == other.cut
    }
}

impl Hash for HairResource {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.name.hash(state);
        self.cut.hash(state);
    }
}

/* Group Structures */

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct RaceGroup<T> {
    pub hm: T,
    pub hf: T,
    pub dm: T,
    pub df: T,
    pub em: T,
    pub ef: T,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Race2Group<T> {
    pub hm: T,
    pub dm: T,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct TintGroup<T> {
    pub hair: T,
    pub skin: T,
    pub eye: T,
    pub eye_makeup: T,
    pub blush_makeup: T,
    pub lip_makeup: T,
    pub brow: T,
    pub tattoo: T,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct TextureGroup<T> {
    pub skin: T,
    pub tattoo: T,
}

impl<T> RaceGroup<T> {
    pub fn map<U, F>(self, f: F) -> RaceGroup<U>
    where
        F: Fn(T) -> U + Copy,
    {
        RaceGroup {
            hm: f(self.hm),
            hf: f(self.hf),
            dm: f(self.dm),
            df: f(self.df),
            em: f(self.em),
            ef: f(self.ef),
        }
    }

    pub fn as_ref(&self) -> RaceGroup<&T> {
        RaceGroup {
            hm: &self.hm,
            hf: &self.hf,
            dm: &self.dm,
            df: &self.df,
            em: &self.em,
            ef: &self.ef,
        }
    }

    pub fn iter_with_tags(&self) -> impl Iterator<Item = (&'static str, &T)> {
        [
            ("human_male", &self.hm),
            ("human_female", &self.hf),
            ("dwarf_male", &self.dm),
            ("dwarf_female", &self.df),
            ("elf_male", &self.em),
            ("elf_female", &self.ef),
        ]
        .into_iter()
    }
}

impl<T> Race2Group<T> {
    pub fn map<U, F>(self, f: F) -> Race2Group<U>
    where
        F: Fn(T) -> U + Copy,
    {
        Race2Group {
            hm: f(self.hm),
            dm: f(self.dm),
        }
    }

    pub fn as_ref(&self) -> Race2Group<&T> {
        Race2Group {
            hm: &self.hm,
            dm: &self.dm,
        }
    }

    pub fn iter_with_tags(&self) -> impl Iterator<Item = (&'static str, &T)> {
        [("human_male", &self.hm), ("dwarf_male", &self.dm)].into_iter()
    }
}

impl<T> TintGroup<T> {
    pub fn map<U, F>(self, f: F) -> TintGroup<U>
    where
        F: Fn(T) -> U + Copy,
    {
        TintGroup {
            hair: f(self.hair),
            skin: f(self.skin),
            eye: f(self.eye),
            eye_makeup: f(self.eye_makeup),
            blush_makeup: f(self.blush_makeup),
            lip_makeup: f(self.lip_makeup),
            brow: f(self.brow),
            tattoo: f(self.tattoo),
        }
    }

    pub fn as_ref(&self) -> TintGroup<&T> {
        TintGroup {
            hair: &self.hair,
            skin: &self.skin,
            eye: &self.eye,
            eye_makeup: &self.eye_makeup,
            blush_makeup: &self.blush_makeup,
            lip_makeup: &self.lip_makeup,
            brow: &self.brow,
            tattoo: &self.tattoo,
        }
    }

    pub fn iter_with_tags(&self) -> impl Iterator<Item = (&'static str, &T)> {
        [
            ("hair_colors", &self.hair),
            ("skin_colors", &self.skin),
            ("eyes_colors", &self.eye),
            ("eyes_makeup_colors", &self.eye_makeup),
            ("blush_makeup_colors", &self.blush_makeup),
            ("lip_makeup_colors", &self.lip_makeup),
            ("brow_stubble_colors", &self.brow),
            ("crew_cut_colors", &self.brow),
            ("tattoo_colors", &self.tattoo),
        ]
        .into_iter()
    }
}

impl<T> TextureGroup<T> {
    pub fn map<U, F>(self, f: F) -> TextureGroup<U>
    where
        F: Fn(T) -> U + Copy,
    {
        TextureGroup {
            skin: f(self.skin),
            tattoo: f(self.tattoo),
        }
    }

    pub fn as_ref(&self) -> TextureGroup<&T> {
        TextureGroup {
            skin: &self.skin,
            tattoo: &self.tattoo,
        }
    }

    pub fn iter_with_tags(&self) -> impl Iterator<Item = (&'static str, &T)> {
        [("tattoos", &self.tattoo), ("skins", &self.skin)].into_iter()
    }
}

/* Chargen */

#[derive(Clone, Debug, Default)]
pub struct Chargen {
    pub heads: RaceGroup<IndexSet<Resource>>,
    pub hairs: RaceGroup<IndexSet<HairResource>>,
    pub beards: Race2Group<IndexSet<Resource>>,
    pub tints: TintGroup<IndexSet<Resource>>,
    pub textures: TextureGroup<IndexSet<Resource>>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ChargenManifest {
    pub heads: RaceGroup<Vec<Resource>>,
    pub hairs: RaceGroup<Vec<HairResource>>,
    pub beards: Race2Group<Vec<Resource>>,
    pub tints: TintGroup<Vec<Resource>>,
    pub textures: TextureGroup<Vec<Resource>>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ChargenStats {
    pub heads: RaceGroup<usize>,
    pub hairs: RaceGroup<usize>,
    pub beards: Race2Group<usize>,
    pub tints: TintGroup<usize>,
    pub textures: TextureGroup<usize>,
}

impl ChargenManifest {
    pub fn from_chargen(chargen: &Chargen) -> Self {
        fn to_vec<T: Clone>(set: &IndexSet<T>) -> Vec<T> {
            set.iter().cloned().collect()
        }

        Self {
            heads: chargen.heads.as_ref().map(to_vec),
            hairs: chargen.hairs.as_ref().map(to_vec),
            beards: chargen.beards.as_ref().map(to_vec),
            tints: chargen.tints.as_ref().map(to_vec),
            textures: chargen.textures.as_ref().map(to_vec),
        }
    }
}

impl ChargenStats {
    pub fn from_chargen(chargen: &Chargen) -> Self {
        fn get_len<T>(set: &IndexSet<T>) -> usize {
            set.len()
        }

        Self {
            heads: chargen.heads.as_ref().map(get_len),
            hairs: chargen.hairs.as_ref().map(get_len),
            beards: chargen.beards.as_ref().map(get_len),
            tints: chargen.tints.as_ref().map(get_len),
            textures: chargen.textures.as_ref().map(get_len),
        }
    }
}

/* Traits */

// Filterable

pub trait Filterable {
    fn filter(&mut self, disabled: &HashSet<&String>);
}

impl Filterable for IndexSet<Resource> {
    fn filter(&mut self, disabled: &HashSet<&String>) {
        self.retain(|r| !disabled.contains(&r.name));
    }
}

impl Filterable for IndexSet<HairResource> {
    fn filter(&mut self, disabled: &HashSet<&String>) {
        self.retain(|r| !disabled.contains(&r.name));
    }
}

impl<T: Filterable> Filterable for RaceGroup<T> {
    fn filter(&mut self, disabled: &HashSet<&String>) {
        self.hm.filter(disabled);
        self.hf.filter(disabled);
        self.dm.filter(disabled);
        self.df.filter(disabled);
        self.em.filter(disabled);
        self.ef.filter(disabled);
    }
}

impl<T: Filterable> Filterable for Race2Group<T> {
    fn filter(&mut self, disabled: &HashSet<&String>) {
        self.hm.filter(disabled);
        self.dm.filter(disabled);
    }
}

impl<T: Filterable> Filterable for TintGroup<T> {
    fn filter(&mut self, disabled: &HashSet<&String>) {
        self.hair.filter(disabled);
        self.skin.filter(disabled);
        self.eye.filter(disabled);
        self.eye_makeup.filter(disabled);
        self.blush_makeup.filter(disabled);
        self.lip_makeup.filter(disabled);
        self.brow.filter(disabled);
        self.tattoo.filter(disabled);
    }
}

impl<T: Filterable> Filterable for TextureGroup<T> {
    fn filter(&mut self, disabled: &HashSet<&String>) {
        self.skin.filter(disabled);
        self.tattoo.filter(disabled);
    }
}

// We can filter using a list of string because each resource name must be unique no matter the type
impl Filterable for Chargen {
    fn filter(&mut self, disabled: &HashSet<&String>) {
        self.heads.filter(disabled);
        self.hairs.filter(disabled);
        self.beards.filter(disabled);
        self.tints.filter(disabled);
        self.textures.filter(disabled);
    }
}

// Mergeable

pub trait Mergeable {
    fn merge(&mut self, other: &Self);
}

impl<T: Eq + Hash + Clone> Mergeable for IndexSet<T> {
    fn merge(&mut self, other: &Self) {
        self.extend(other.iter().cloned());
    }
}

impl<T: Mergeable> Mergeable for RaceGroup<T> {
    fn merge(&mut self, other: &Self) {
        self.hm.merge(&other.hm);
        self.hf.merge(&other.hf);
        self.dm.merge(&other.dm);
        self.df.merge(&other.df);
        self.em.merge(&other.em);
        self.ef.merge(&other.ef);
    }
}

impl<T: Mergeable> Mergeable for Race2Group<T> {
    fn merge(&mut self, other: &Self) {
        self.hm.merge(&other.hm);
        self.dm.merge(&other.dm);
    }
}

impl<T: Mergeable> Mergeable for TintGroup<T> {
    fn merge(&mut self, other: &Self) {
        self.hair.merge(&other.hair);
        self.skin.merge(&other.skin);
        self.eye.merge(&other.eye);
        self.eye_makeup.merge(&other.eye_makeup);
        self.blush_makeup.merge(&other.blush_makeup);
        self.lip_makeup.merge(&other.lip_makeup);
        self.brow.merge(&other.brow);
        self.tattoo.merge(&other.tattoo);
    }
}

impl<T: Mergeable> Mergeable for TextureGroup<T> {
    fn merge(&mut self, other: &Self) {
        self.skin.merge(&other.skin);
        self.tattoo.merge(&other.tattoo);
    }
}

impl Mergeable for Chargen {
    fn merge(&mut self, other: &Self) {
        self.heads.merge(&other.heads);
        self.hairs.merge(&other.hairs);
        self.beards.merge(&other.beards);
        self.tints.merge(&other.tints);
        self.textures.merge(&other.textures);
    }
}
