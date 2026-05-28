import { cn } from "@/lib/utils";

export function PageShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("relative mx-auto w-full max-w-7xl px-4 py-8 md:px-6", className)}>{children}</div>;
}
