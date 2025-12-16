export interface Resource {
  name: string;
  path?: string;
}

export interface HairResource {
  name: string;
  cut: string;
  path?: string;
}

export interface RaceGroup<T> {
  hm: T;
  hf: T;
  dm: T;
  df: T;
  em: T;
  ef: T;
}

export interface GenderGroup<T> {
  hm: T;
  dm: T;
}

export interface TintGroup<T> {
  hair: T;
  skin: T;
  eye: T;
  eye_makeup: T;
  blush_makeup: T;
  lip_makeup: T;
  brow: T;
  tattoo: T;
}

export interface TextureGroup<T> {
  skin: T;
  tattoo: T;
}

export interface ChargenStats {
  heads: RaceGroup<number>;
  hairs: RaceGroup<number>;
  beards: GenderGroup<number>;
  tints: TintGroup<number>;
  textures: TextureGroup<number>;
}

export interface ChargenManifest {
  heads: RaceGroup<Resource[]>;
  hairs: RaceGroup<HairResource[]>;
  beards: GenderGroup<Resource[]>;
  tints: TintGroup<Resource[]>;
  textures: TextureGroup<Resource[]>;
}
