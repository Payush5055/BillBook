import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4 px-6 py-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-full" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
