export interface Resource {
  name: string;
  path?: string;
}

export interface HairResource extends Resource {
  cut: string;
}

export interface ResourceGroup<T> {
  total: number;
  custom: T[];
}

export interface RaceGroup<T> {
  hm: T;
  hf: T;
  dm: T;
  df: T;
  em: T;
  ef: T;
}

export interface BeardRaceGroup<T> {
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

export interface ChargenData {
  heads: RaceGroup<ResourceGroup<Resource>>;
  hairs: RaceGroup<ResourceGroup<HairResource>>;
  beards: BeardRaceGroup<ResourceGroup<Resource>>;
  tints: TintGroup<ResourceGroup<Resource>>;
  textures: TextureGroup<ResourceGroup<Resource>>;
}
