"use client";

import { useTransition } from "react";
import { LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions";

export function UserMenu({ email, activeBusiness }: { email?: string; activeBusiness?: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      {activeBusiness && (
        <div className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-2 text-sm font-medium text-emerald-300 sm:flex">
          <Building2 className="h-3.5 w-3.5" />
          {activeBusiness}
        </div>
      )}
      <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground sm:block">
        {email}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => startTransition(async () => signOutAction())}
        disabled={pending}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
