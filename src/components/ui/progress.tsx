import * as React from "react"
import { Progress } from "radix-ui"
import { cn } from "@/lib/utils"

function ProgressUI({
  className,
  value,
  ...props
}: React.ComponentProps<typeof Progress.Root>) {
  return (
    <Progress.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-[#e7ebf1]",
        className,
      )}
      {...props}
    >
      <Progress.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-[#caa344] transition-all"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </Progress.Root>
  )
}

export { ProgressUI as Progress }