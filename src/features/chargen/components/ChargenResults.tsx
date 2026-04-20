import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Overline } from "@/components/ui/Typography";
import { ChargenRaceCard } from "@/features/chargen/components/ChargenRaceCard";
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
        <ChargenRaceCard
          title="Human Male"
          data={{
            heads: data.heads.hm,
            hairs: data.hairs.hm,
            beards: data.beards.hm,
          }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Human Female"
          data={{ heads: data.heads.hf, hairs: data.hairs.hf }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Elf Male"
          data={{ heads: data.heads.em, hairs: data.hairs.em }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Elf Female"
          data={{ heads: data.heads.ef, hairs: data.hairs.ef }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Dwarf Male"
          data={{
            heads: data.heads.dm,
            hairs: data.hairs.dm,
            beards: data.beards.dm,
          }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Dwarf Female"
          data={{ heads: data.heads.df, hairs: data.hairs.df }}
          onInspect={handleInspect}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Shared Resources</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-12 gap-y-4 md:grid-cols-2">
          <div>
            <Overline className="mb-2 font-display">Tints</Overline>
            <div className="space-y-3">
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
            </div>
          </div>
          <div>
            <Overline className="mb-2 font-display">Textures</Overline>
            <div className="space-y-3">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { ChargenResults };
