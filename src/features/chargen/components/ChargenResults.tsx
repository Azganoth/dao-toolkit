import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Overline } from "@/components/ui/Typography";
import { ChargenRaceCard } from "@/features/chargen/components/ChargenRaceCard";
import { ChargenStatRow } from "@/features/chargen/components/ChargenStatRow";
import {
  type ChargenManifest,
  type ChargenStats,
  type HairResource,
  type Resource,
} from "@/types/chargen";
import { useState } from "react";
import { ChargenInspector, type InspectorState } from "./ChargenInspector";

interface ChargenResultsProps {
  stats: ChargenStats | null;
  manifest: ChargenManifest | null;
}

function ChargenResults({ stats, manifest }: ChargenResultsProps) {
  const [inspector, setInspector] = useState<InspectorState>({
    open: false,
    title: "",
    files: [],
  });

  const handleInspect = (title: string, files: (Resource | HairResource)[]) => {
    setInspector({ open: true, title, files });
  };

  if (!stats || !manifest) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-muted/50">
        <p className="text-muted-foreground">Run a scan to see the results.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ChargenInspector
        state={inspector}
        onOpenChange={(open) => setInspector((prev) => ({ ...prev, open }))}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChargenRaceCard
          title="Human Male"
          stats={{
            heads: stats.heads.hm,
            hairs: stats.hairs.hm,
            beards: stats.beards.hm,
          }}
          manifest={{
            heads: manifest.heads.hm,
            hairs: manifest.hairs.hm,
            beards: manifest.beards.hm,
          }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Human Female"
          stats={{ heads: stats.heads.hf, hairs: stats.hairs.hf }}
          manifest={{ heads: manifest.heads.hf, hairs: manifest.hairs.hf }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Elf Male"
          stats={{ heads: stats.heads.em, hairs: stats.hairs.em }}
          manifest={{ heads: manifest.heads.em, hairs: manifest.hairs.em }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Elf Female"
          stats={{ heads: stats.heads.ef, hairs: stats.hairs.ef }}
          manifest={{ heads: manifest.heads.ef, hairs: manifest.hairs.ef }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Dwarf Male"
          stats={{
            heads: stats.heads.dm,
            hairs: stats.hairs.dm,
            beards: stats.beards.dm,
          }}
          manifest={{
            heads: manifest.heads.dm,
            hairs: manifest.hairs.dm,
            beards: manifest.beards.dm,
          }}
          onInspect={handleInspect}
        />
        <ChargenRaceCard
          title="Dwarf Female"
          stats={{ heads: stats.heads.df, hairs: stats.hairs.df }}
          manifest={{ heads: manifest.heads.df, hairs: manifest.hairs.df }}
          onInspect={handleInspect}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Shared Resources</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-x-12 gap-y-4 md:grid-cols-2">
          <div>
            <Overline className="mb-2">Tints</Overline>
            <div className="space-y-3">
              <ChargenStatRow
                label="Hair Colors"
                total={stats.tints.hair}
                files={manifest.tints.hair}
                onInspect={handleInspect}
              />
              <ChargenStatRow
                label="Skin Tones"
                total={stats.tints.skin}
                files={manifest.tints.skin}
                onInspect={handleInspect}
              />
              <ChargenStatRow
                label="Eye Colors"
                total={stats.tints.eye}
                files={manifest.tints.eye}
                onInspect={handleInspect}
              />
              <ChargenStatRow
                label="Eye Makeup"
                total={stats.tints.eye_makeup}
                files={manifest.tints.eye_makeup}
                onInspect={handleInspect}
              />
              <ChargenStatRow
                label="Blush Makeup"
                total={stats.tints.blush_makeup}
                files={manifest.tints.blush_makeup}
                onInspect={handleInspect}
              />
              <ChargenStatRow
                label="Lip Makeup"
                total={stats.tints.lip_makeup}
                files={manifest.tints.lip_makeup}
                onInspect={handleInspect}
              />
              <ChargenStatRow
                label="Brow/Stubble"
                total={stats.tints.brow}
                files={manifest.tints.brow}
                onInspect={handleInspect}
              />
              <ChargenStatRow
                label="Tattoo Colors"
                total={stats.tints.tattoo}
                files={manifest.tints.tattoo}
                onInspect={handleInspect}
              />
            </div>
          </div>
          <div>
            <Overline className="mb-2">Textures</Overline>
            <div className="space-y-3">
              <ChargenStatRow
                label="Skin Complexions"
                total={stats.textures.skin}
                files={manifest.textures.skin}
                onInspect={handleInspect}
              />
              <ChargenStatRow
                label="Tattoos"
                total={stats.textures.tattoo}
                files={manifest.textures.tattoo}
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
