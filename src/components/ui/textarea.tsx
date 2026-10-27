import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full min-w-0 rounded-xl border border-[#e7ebf1] bg-[#f7f8fb] px-3.5 py-2.5 text-sm text-[#10233f] placeholder:text-[#8d9aae] shadow-xs transition-all outline-none focus:border-[#caa344] focus:ring-2 focus:ring-[#caa344]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-rose-500/70 aria-invalid:ring-2 aria-invalid:ring-rose-500/20 font-medium",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }