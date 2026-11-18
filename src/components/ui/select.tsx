import * as React from "react"
import { cn } from "@/lib/utils"

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select
        data-slot="select"
        className={cn(
          "flex h-10 w-full min-w-0 appearance-none rounded-xl border border-[#e7ebf1] bg-[#f7f8fb] px-3.5 py-2 pr-9 text-sm text-[#10233f] placeholder:text-[#8d9aae] shadow-xs transition-all outline-none focus:border-[#caa344] focus:ring-2 focus:ring-[#caa344]/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-rose-500/70 aria-invalid:ring-2 aria-invalid:ring-rose-500/20 [&_option]:bg-white [&_option]:text-[#10233f] cursor-pointer font-medium",
          className,
        )}
        {...props}
      />
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8d9aae]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  )
}

export { Select }