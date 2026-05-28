import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageShell className="space-y-6">
      <Card className="space-y-4">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80" />
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <Skeleton className="h-28 w-full" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton className="h-80 w-full" />
      </Card>
    </PageShell>
  );
}
