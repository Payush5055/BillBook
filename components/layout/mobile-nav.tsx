"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  ReceiptIndianRupee,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/invoices", icon: ReceiptIndianRupee, label: "Invoices" },
  { href: "/payments", icon: CreditCard, label: "Payments" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="glass-panel no-print fixed inset-x-4 bottom-4 z-40 rounded-[26px] p-2 lg:hidden">
      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                active ? "bg-white/10 text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
