import type {
  BeardRaceGroup,
  ChargenData,
  ChargenScanResult,
  HairResource,
  RaceGroup,
  Resource,
  ResourceGroup,
  TextureGroup,
  TintGroup,
} from "@/types/chargen";
import { useChargenStore } from "@/features/chargen/stores/chargen";
import { TEST_OVERRIDE_PATH, TEST_SCAN_ID } from "./constants";

type RaceResourceNames = Partial<Record<keyof RaceGroup<unknown>, string[]>>;
type BeardResourceNames = Partial<
  Record<keyof BeardRaceGroup<unknown>, string[]>
>;
type TintResourceNames = Partial<Record<keyof TintGroup<unknown>, string[]>>;
type TextureResourceNames = Partial<
  Record<keyof TextureGroup<unknown>, string[]>
>;

interface CreateChargenDataOptions {
  heads?: RaceResourceNames;
  hairs?: RaceResourceNames;
  beards?: BeardResourceNames;
  tints?: TintResourceNames;
  textures?: TextureResourceNames;
}

export function composeResourceGroup(
  names: string[] = [],
): ResourceGroup<Resource> {
  return {
    custom: names.map((name) => ({ name })),
    total: names.length,
  };
}

export function composeHairResourceGroup(
  names: string[] = [],
): ResourceGroup<HairResource> {
  return {
    custom: names.map((name) => ({ cut: "1", name })),
    total: names.length,
  };
}

function createRaceResourceGroups(
  names: RaceResourceNames = {},
): RaceGroup<ResourceGroup<Resource>> {
  return {
    hm: composeResourceGroup(names.hm),
    hf: composeResourceGroup(names.hf),
    dm: composeResourceGroup(names.dm),
    df: composeResourceGroup(names.df),
    em: composeResourceGroup(names.em),
    ef: composeResourceGroup(names.ef),
  };
}

function createHairRaceGroups(
  names: RaceResourceNames = {},
): RaceGroup<ResourceGroup<HairResource>> {
  return {
    hm: composeHairResourceGroup(names.hm),
    hf: composeHairResourceGroup(names.hf),
    dm: composeHairResourceGroup(names.dm),
    df: composeHairResourceGroup(names.df),
    em: composeHairResourceGroup(names.em),
    ef: composeHairResourceGroup(names.ef),
  };
}

function createBeardResourceGroups(
  names: BeardResourceNames = {},
): BeardRaceGroup<ResourceGroup<Resource>> {
  return {
    hm: composeResourceGroup(names.hm),
    dm: composeResourceGroup(names.dm),
  };
}

function createTintResourceGroups(
  names: TintResourceNames = {},
): TintGroup<ResourceGroup<Resource>> {
  return {
    hair: composeResourceGroup(names.hair),
    skin: composeResourceGroup(names.skin),
    eye: composeResourceGroup(names.eye),
    eye_makeup: composeResourceGroup(names.eye_makeup),
    blush_makeup: composeResourceGroup(names.blush_makeup),
    lip_makeup: composeResourceGroup(names.lip_makeup),
    brow: composeResourceGroup(names.brow),
    tattoo: composeResourceGroup(names.tattoo),
  };
}

function createTextureResourceGroups(
  names: TextureResourceNames = {},
): TextureGroup<ResourceGroup<Resource>> {
  return {
    skin: composeResourceGroup(names.skin),
    tattoo: composeResourceGroup(names.tattoo),
  };
}

export function createChargenData({
  heads,
  hairs,
  beards,
  tints,
  textures,
}: CreateChargenDataOptions = {}): ChargenData {
  return {
    heads: createRaceResourceGroups(heads),
    hairs: createHairRaceGroups(hairs),
    beards: createBeardResourceGroups(beards),
    tints: createTintResourceGroups(tints),
    textures: createTextureResourceGroups(textures),
  };
}

interface CreateChargenScanResultOptions {
  data?: ChargenData;
  id?: string;
  path?: string;
}

export function createChargenScanResult({
  data = createChargenData(),
  id = TEST_SCAN_ID,
  path = TEST_OVERRIDE_PATH,
}: CreateChargenScanResultOptions = {}): ChargenScanResult {
  return { data, id, path };
}

export function setActiveChargenScan(
  options: CreateChargenScanResultOptions & {
    requestedPath?: string;
  } = {},
) {
  const {
    requestedPath = options.path ?? TEST_OVERRIDE_PATH,
    ...resultOptions
  } = options;

  useChargenStore
    .getState()
    .setScan(createChargenScanResult(resultOptions), requestedPath);
}
