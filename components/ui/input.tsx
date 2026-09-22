import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-[var(--noob-muted)] bg-white px-3 py-2 text-sm text-[var(--noob-blue)] placeholder:text-[var(--noob-blue)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--noob-pink)] disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
