"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CreditCard,
  LayoutDashboard,
  ReceiptIndianRupee,
  Settings,
  Users,
  WandSparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/catalog", label: "Catalog", icon: Boxes },
  { href: "/invoices", label: "Invoices", icon: ReceiptIndianRupee },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel surface-ring sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 rounded-[30px] p-4 lg:block">
      <div className="flex h-full flex-col">
        <div className="mb-8 flex items-center gap-3 px-3 pt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950 shadow-glow">
            <WandSparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">{APP_NAME}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">GST Studio</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="sidebar-pill"
                    className="absolute inset-0 rounded-2xl bg-white/8"
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  />
                ) : null}
                <item.icon className="relative z-10 h-5 w-5" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[26px] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/10 via-white/5 to-emerald-400/10 p-5">
          <p className="text-sm font-medium">Built for fast, premium billing.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            GST-ready invoicing, clean reports, and beautiful client-ready documents.
          </p>
        </div>
      </div>
    </aside>
  );
}
