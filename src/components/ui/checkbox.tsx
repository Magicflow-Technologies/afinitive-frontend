import * as React from "react"
import { Checkbox } from "radix-ui"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

function CheckboxUI({
  className,
  ...props
}: React.ComponentProps<typeof Checkbox.Root>) {
  return (
    <Checkbox.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-[#e7ebf1] bg-[#f7f8fb] shadow-xs outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#caa344]/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[#caa344] data-[state=checked]:bg-[#caa344] data-[state=checked]:text-white cursor-pointer",
        className,
      )}
      {...props}
    >
      <Checkbox.Indicator className="flex items-center justify-center text-current">
        <Check className="size-3.5" />
      </Checkbox.Indicator>
    </Checkbox.Root>
  )
}

export { CheckboxUI as Checkbox }