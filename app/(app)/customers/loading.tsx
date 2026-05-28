import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return (
    <div>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-9 w-32" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 px-6 py-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-full" />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
