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
        "peer size-4 shrink-0 rounded-[4px] border border-input shadow-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:border-input dark:bg-input/30 dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary",
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