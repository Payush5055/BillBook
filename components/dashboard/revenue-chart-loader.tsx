"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const RevenueChart = dynamic(
  () => import("@/components/dashboard/revenue-chart").then((m) => ({ default: m.RevenueChart })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[320px] w-full" />,
  },
);

export function RevenueChartLoader({
  data,
}: {
  data: { label: string; revenue: number; collected: number }[];
}) {
  return <RevenueChart data={data} />;
}
