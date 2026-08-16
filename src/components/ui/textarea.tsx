import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full min-w-0 rounded-xl border border-[#1b355a] bg-[#0a192f] px-3.5 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 shadow-sm transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-rose-500/70 aria-invalid:ring-2 aria-invalid:ring-rose-500/20 font-medium",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }