import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground outline-none transition focus:border-cyan-400/50 focus:bg-white/8 focus:ring-2 focus:ring-cyan-400/20",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
