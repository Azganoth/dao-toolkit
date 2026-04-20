import {
  ChargenFaceResultCard,
  ChargenResultCard,
} from "@/features/chargen/components/ChargenResultCard";
import { ChargenSummaryRow } from "@/features/chargen/components/ChargenSummaryRow";
import { type ChargenData, type Resource } from "@/types/chargen";
import { useState } from "react";
import { ChargenInspector, type InspectorData } from "./ChargenInspector";

interface ChargenResultsProps {
  data: ChargenData;
}

function ChargenResults({ data }: ChargenResultsProps) {
  const [inspector, setInspector] = useState<InspectorData | null>(null);

  const handleInspect = (title: string, resources: Resource[]) => {
    setInspector({ title, resources });
  };

  return (
    <div className="flex flex-col gap-4">
      <ChargenInspector data={inspector} onClose={() => setInspector(null)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChargenFaceResultCard
          title="Human Male"
          data={{
            heads: data.heads.hm,
            hairs: data.hairs.hm,
            beards: data.beards.hm,
          }}
          onInspect={handleInspect}
        />
        <ChargenFaceResultCard
          title="Human Female"
          data={{ heads: data.heads.hf, hairs: data.hairs.hf }}
          onInspect={handleInspect}
        />
        <ChargenFaceResultCard
          title="Elf Male"
          data={{ heads: data.heads.em, hairs: data.hairs.em }}
          onInspect={handleInspect}
        />
        <ChargenFaceResultCard
          title="Elf Female"
          data={{ heads: data.heads.ef, hairs: data.hairs.ef }}
          onInspect={handleInspect}
        />
        <ChargenFaceResultCard
          title="Dwarf Male"
          data={{
            heads: data.heads.dm,
            hairs: data.hairs.dm,
            beards: data.beards.dm,
          }}
          onInspect={handleInspect}
        />
        <ChargenFaceResultCard
          title="Dwarf Female"
          data={{ heads: data.heads.df, hairs: data.hairs.df }}
          onInspect={handleInspect}
        />
      </div>

      <ChargenResultCard title="Shared Resources">
        <div className="grid gap-x-12 gap-y-3 md:grid-cols-2">
          <ChargenSummaryRow
            label="Hair Colors"
            data={data.tints.hair}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            label="Skin Tones"
            data={data.tints.skin}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            label="Eye Colors"
            data={data.tints.eye}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            label="Eye Makeup"
            data={data.tints.eye_makeup}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            label="Blush Makeup"
            data={data.tints.blush_makeup}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            label="Lip Makeup"
            data={data.tints.lip_makeup}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            label="Brow/Stubble"
            data={data.tints.brow}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            label="Tattoo Colors"
            data={data.tints.tattoo}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            label="Skin Complexions"
            data={data.textures.skin}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            label="Tattoos"
            data={data.textures.tattoo}
            onInspect={handleInspect}
          />
        </div>
      </ChargenResultCard>
    </div>
  );
}

export { ChargenResults };
