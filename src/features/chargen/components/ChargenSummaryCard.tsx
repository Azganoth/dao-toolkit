import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ChargenInspectorSelection } from "@/features/chargen/components/ChargenInspector";
import { ChargenSummaryRow } from "@/features/chargen/components/ChargenSummaryRow";
import type { HairResource, Resource, ResourceGroup } from "@/types/chargen";
import { useCallback } from "react";

interface ChargenSummaryCardProps {
  title: string;
  children: React.ReactNode;
}

function ChargenSummaryCard({ title, children }: ChargenSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

export interface ChargenFaceSummaryCardProps {
  title: string;
  resourceGroups: {
    heads: ResourceGroup<Resource>;
    hairs: ResourceGroup<HairResource>;
    beards?: ResourceGroup<Resource>;
  };
  onInspect: (selection: ChargenInspectorSelection) => void;
}

function ChargenFaceSummaryCard({
  title,
  resourceGroups,
  onInspect,
}: ChargenFaceSummaryCardProps) {
  const handleInspect = useCallback(
    (selection: ChargenInspectorSelection) => {
      onInspect({ ...selection, title: `${title} - ${selection.title}` });
    },
    [title, onInspect],
  );

  return (
    <ChargenSummaryCard title={title}>
      <ChargenSummaryRow
        title="Heads"
        resourceGroup={resourceGroups.heads}
        onInspect={handleInspect}
      />
      <ChargenSummaryRow
        title="Hairs"
        resourceGroup={resourceGroups.hairs}
        onInspect={handleInspect}
      />
      {resourceGroups.beards && (
        <ChargenSummaryRow
          title="Beards"
          resourceGroup={resourceGroups.beards}
          onInspect={handleInspect}
        />
      )}
    </ChargenSummaryCard>
  );
}

export { ChargenFaceSummaryCard, ChargenSummaryCard };
