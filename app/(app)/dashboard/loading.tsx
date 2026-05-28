import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-28 w-full" />
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <Skeleton className="mb-4 h-6 w-48" />
          <Skeleton className="h-[320px] w-full" />
        </Card>
        <Card className="space-y-3">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="space-y-3">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-16 w-full" />
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
