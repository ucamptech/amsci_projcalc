import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { Resource } from "@/api/types";
import SectionTitle from "./SectionTitle";
import type { WbsRow } from "@/data/types";

type Props = {
  wbsRows: WbsRow[];
  resources: Resource[];
};

export default function GanttSection({ wbsRows, resources }: Props) {
  console.log(wbsRows.length, resources.length);
  return (
    <section className="mt-6">
      <SectionTitle title="IV. Gantt" />
      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="text-base">Schedule Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            No tasks to display. Add resources and mandays in the WBS.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
