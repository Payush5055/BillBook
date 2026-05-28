"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUpValue } from "@/components/dashboard/count-up";

export function MetricCard({
  index,
  title,
  value,
  icon: Icon,
  currency,
  hint,
}: {
  index: number;
  title: string;
  value: number;
  icon: LucideIcon;
  currency?: boolean;
  hint: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 160, damping: 18 }}
    >
      <Card className="overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="mt-3 text-3xl font-semibold">
              <CountUpValue value={value} currency={currency} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 p-3">
            <Icon className="h-5 w-5 text-cyan-200" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
