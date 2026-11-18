import * as React from "react"
import { Switch } from "radix-ui"
import { cn } from "@/lib/utils"

function SwitchUI({
  className,
  ...props
}: React.ComponentProps<typeof Switch.Root>) {
  return (
    <Switch.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-[background-color,transform] outline-none focus-visible:ring-2 focus-visible:ring-[#caa344]/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#caa344] data-[state=unchecked]:bg-[#e7ebf1] cursor-pointer",
        className,
      )}
      {...props}
    >
      <Switch.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-white shadow-md ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
      />
    </Switch.Root>
  )
}

export { SwitchUI as Switch }