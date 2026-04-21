import {
  ChargenFaceSummaryCard,
  ChargenSummaryCard,
} from "@/features/chargen/components/ChargenSummaryCard";
import { ChargenSummaryRow } from "@/features/chargen/components/ChargenSummaryRow";
import { type ChargenData } from "@/types/chargen";
import { useState } from "react";
import {
  ChargenInspector,
  type ChargenInspectorTarget,
} from "./ChargenInspector";

interface ChargenSummaryProps {
  data: ChargenData;
}

function ChargenSummary({ data }: ChargenSummaryProps) {
  const [inspector, setInspector] = useState<ChargenInspectorTarget | null>(
    null,
  );

  const handleInspect = (target: ChargenInspectorTarget) => {
    setInspector(target);
  };

  return (
    <div className="flex flex-col gap-4">
      <ChargenInspector target={inspector} onClose={() => setInspector(null)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChargenFaceSummaryCard
          title="Human Male"
          resourceGroups={{
            heads: data.heads.hm,
            hairs: data.hairs.hm,
            beards: data.beards.hm,
          }}
          onInspect={handleInspect}
        />
        <ChargenFaceSummaryCard
          title="Human Female"
          resourceGroups={{ heads: data.heads.hf, hairs: data.hairs.hf }}
          onInspect={handleInspect}
        />
        <ChargenFaceSummaryCard
          title="Elf Male"
          resourceGroups={{ heads: data.heads.em, hairs: data.hairs.em }}
          onInspect={handleInspect}
        />
        <ChargenFaceSummaryCard
          title="Elf Female"
          resourceGroups={{ heads: data.heads.ef, hairs: data.hairs.ef }}
          onInspect={handleInspect}
        />
        <ChargenFaceSummaryCard
          title="Dwarf Male"
          resourceGroups={{
            heads: data.heads.dm,
            hairs: data.hairs.dm,
            beards: data.beards.dm,
          }}
          onInspect={handleInspect}
        />
        <ChargenFaceSummaryCard
          title="Dwarf Female"
          resourceGroups={{ heads: data.heads.df, hairs: data.hairs.df }}
          onInspect={handleInspect}
        />
      </div>

      <ChargenSummaryCard title="Shared Resources">
        <div className="grid gap-x-12 gap-y-3 md:grid-cols-2">
          <ChargenSummaryRow
            title="Hair Colors"
            resourceGroup={data.tints.hair}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            title="Skin Tones"
            resourceGroup={data.tints.skin}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            title="Eye Colors"
            resourceGroup={data.tints.eye}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            title="Eye Makeup"
            resourceGroup={data.tints.eye_makeup}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            title="Blush Makeup"
            resourceGroup={data.tints.blush_makeup}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            title="Lip Makeup"
            resourceGroup={data.tints.lip_makeup}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            title="Brow/Stubble"
            resourceGroup={data.tints.brow}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            title="Tattoo Colors"
            resourceGroup={data.tints.tattoo}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            title="Skin Complexions"
            resourceGroup={data.textures.skin}
            onInspect={handleInspect}
          />
          <ChargenSummaryRow
            title="Tattoos"
            resourceGroup={data.textures.tattoo}
            onInspect={handleInspect}
          />
        </div>
      </ChargenSummaryCard>
    </div>
  );
}

export { ChargenSummary as ChargenResults };
