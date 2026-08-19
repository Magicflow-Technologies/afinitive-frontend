import * as React from "react"
import { RadioGroup } from "radix-ui"
import { cn } from "@/lib/utils"

function RadioGroupUI({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroup.Root>) {
  return (
    <RadioGroup.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroup.Item>) {
  return (
    <RadioGroup.Item
      data-slot="radio-group-item"
      className={cn(
        "aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary dark:border-input dark:bg-input/30 dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <RadioGroup.Indicator className="flex items-center justify-center">
        <span className="size-1.5 rounded-full bg-background dark:bg-foreground" />
      </RadioGroup.Indicator>
    </RadioGroup.Item>
  )
}

export { RadioGroupUI as RadioGroup, RadioGroupItem }