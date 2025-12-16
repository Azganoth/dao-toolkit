import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChargenStatRow } from "@/features/chargen/components/ChargenStatRow";
import type { HairResource, Resource } from "@/types/chargen";
import { useCallback } from "react";

export interface ChargenRaceCardProps {
  title: string;
  stats: {
    heads: number;
    hairs: number;
    beards?: number;
  };
  manifest: {
    heads: Resource[];
    hairs: HairResource[];
    beards?: Resource[];
  };
  onInspect: (title: string, files: (Resource | HairResource)[]) => void;
}

function ChargenRaceCard({
  title,
  stats,
  manifest,
  onInspect,
}: ChargenRaceCardProps) {
  const handleInspect = useCallback(
    (subtitle: string, files: (Resource | HairResource)[]) => {
      onInspect(`${title} - ${subtitle}`, files);
    },
    [title, onInspect],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChargenStatRow
          label="Heads"
          total={stats.heads}
          files={manifest.heads}
          onInspect={handleInspect}
        />
        <ChargenStatRow
          label="Hairs"
          total={stats.hairs}
          files={manifest.hairs}
          onInspect={handleInspect}
        />
        {stats.beards !== undefined && manifest.beards !== undefined && (
          <ChargenStatRow
            label="Beards"
            total={stats.beards}
            files={manifest.beards}
            onInspect={handleInspect}
          />
        )}
      </CardContent>
    </Card>
  );
}

export { ChargenRaceCard };
