import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChargenSummaryRow } from "@/features/chargen/components/ChargenSummaryRow";
import type { HairResource, Resource, ResourceGroup } from "@/types/chargen";
import { useCallback } from "react";

interface ChargenResultCardProps {
  title: string;
  children: React.ReactNode;
}

function ChargenResultCard({ title, children }: ChargenResultCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export interface ChargenRaceCardProps {
  title: string;
  data: {
    heads: ResourceGroup<Resource>;
    hairs: ResourceGroup<HairResource>;
    beards?: ResourceGroup<Resource>;
  };
  onInspect: (title: string, resources: Resource[]) => void;
}

function ChargenFaceResultCard({
  title,
  data,
  onInspect,
}: ChargenRaceCardProps) {
  const handleInspect = useCallback(
    (subtitle: string, resources: Resource[]) => {
      onInspect(`${title} - ${subtitle}`, resources);
    },
    [title, onInspect],
  );

  return (
    <ChargenResultCard title={title}>
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
    </ChargenResultCard>
  );
}

export { ChargenFaceResultCard, ChargenResultCard };
