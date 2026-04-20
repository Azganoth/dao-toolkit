import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChargenSummaryRow } from "@/features/chargen/components/ChargenSummaryRow";
import type { HairResource, Resource, ResourceGroup } from "@/types/chargen";
import { useCallback } from "react";

export interface ChargenRaceCardProps {
  title: string;
  data: {
    heads: ResourceGroup<Resource>;
    hairs: ResourceGroup<HairResource>;
    beards?: ResourceGroup<Resource>;
  };
  onInspect: (title: string, resources: Resource[]) => void;
}

function ChargenRaceCard({ title, data, onInspect }: ChargenRaceCardProps) {
  const handleInspect = useCallback(
    (subtitle: string, resources: Resource[]) => {
      onInspect(`${title} - ${subtitle}`, resources);
    },
    [title, onInspect],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChargenSummaryRow
          label="Heads"
          data={data.heads}
          onInspect={handleInspect}
        />
        <ChargenSummaryRow
          label="Hairs"
          data={data.hairs}
          onInspect={handleInspect}
        />
        {data.beards && (
          <ChargenSummaryRow
            label="Beards"
            data={data.beards}
            onInspect={handleInspect}
          />
        )}
      </CardContent>
    </Card>
  );
}

export { ChargenRaceCard };
