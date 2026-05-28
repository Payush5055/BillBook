import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoiceDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[210mm] rounded-2xl bg-white/5 p-8">
        <div className="flex justify-between border-b border-white/10 pb-6">
          <div className="space-y-3">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="space-y-3 text-right">
            <Skeleton className="ml-auto h-3 w-24" />
            <Skeleton className="ml-auto h-9 w-40" />
            <Skeleton className="ml-auto h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-8 border-b border-white/10 py-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>

      <Card className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </Card>
    </div>
  );
}
