import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import SectionTitle from "./SectionTitle";

export default function AuthorizationSection() {
  return (
    <section className="mt-6">
      <SectionTitle title="III. Authorization" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sign-off</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Role Name Signature Date
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
