"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Building2, Check, ChevronDown, LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setActiveBusinessAction, signOutAction } from "@/lib/actions";
import type { Business } from "@/lib/types";

export function UserMenu({
  email,
  businesses,
}: {
  email?: string;
  businesses: Business[];
}) {
  const router = useRouter();
  const [logoutPending, startLogout] = useTransition();
  const [switchPending, startSwitch] = useTransition();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeBusiness = businesses.find((b) => b.is_active) ?? businesses[0] ?? null;

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSwitch = (id: string) => {
    if (switchPending) return;
    setDropdownOpen(false);
    startSwitch(async () => {
      try {
        await setActiveBusinessAction(id);
        if (typeof window !== "undefined") {
          localStorage.setItem("active_business_id", id);
        }
        // Refresh so server components re-render with new active business
        router.refresh();
        toast.success("Switched business.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to switch business.");
      }
    });
  };

  return (
    <div className="flex items-center gap-3">
      {/* Business switcher pill */}
      {businesses.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            disabled={switchPending}
            className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15 disabled:opacity-60"
          >
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden max-w-[180px] truncate sm:block">
              {activeBusiness?.name ?? "Select business"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  My Businesses
                </p>
              </div>

              <div className="py-1">
                {businesses.map((biz) => (
                  <button
                    key={biz.id}
                    type="button"
                    disabled={biz.is_active || switchPending}
                    onClick={() => handleSwitch(biz.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04] disabled:cursor-default"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {biz.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {biz.gstin ?? "No GSTIN"} • {biz.city ?? biz.state ?? "—"}
                      </p>
                    </div>
                    {biz.is_active && (
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-white/5 p-2">
                <a
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add / manage businesses
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email pill */}
      <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground sm:block">
        {email}
      </div>

      {/* Logout */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => startLogout(async () => signOutAction())}
        disabled={logoutPending}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
