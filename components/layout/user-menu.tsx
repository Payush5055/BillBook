"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions";

export function UserMenu({ email }: { email?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
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
