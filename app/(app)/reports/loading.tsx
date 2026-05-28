import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-4 w-80" />
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-36" />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="overflow-hidden p-0">
            <div className="border-b border-white/10 p-6">
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="divide-y divide-white/5">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="grid grid-cols-4 gap-4 px-6 py-3">
                  {Array.from({ length: 4 }).map((_, k) => (
                    <Skeleton key={k} className="h-4 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/10 p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="divide-y divide-white/5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 px-6 py-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
