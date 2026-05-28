"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export function CountUpValue({
  value,
  currency,
}: {
  value: number;
  currency?: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 1000;
    const started = performance.now();

    const tick = (time: number) => {
      const progress = Math.min((time - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{currency ? formatCurrency(display) : Math.round(display).toLocaleString("en-IN")}</>;
}
