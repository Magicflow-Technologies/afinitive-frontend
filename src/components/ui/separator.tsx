import * as React from "react"
import { Separator } from "radix-ui"
import { cn } from "@/lib/utils"

function SeparatorUI({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof Separator.Root>) {
  return (
    <Separator.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  )
}

export { SeparatorUI as Separator }