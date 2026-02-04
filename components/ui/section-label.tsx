import * as React from "react"

import { cn } from "@/lib/utils"

type SectionLabelColor = "muted" | "accent" | "cool"

const colorClasses: Record<SectionLabelColor, string> = {
  muted: "text-muted-foreground",
  accent: "text-accent",
  cool: "text-cool",
}

function SectionLabel({
  className,
  color = "muted",
  ...props
}: React.ComponentProps<"span"> & {
  color?: SectionLabelColor
}) {
  return (
    <span
      data-slot="section-label"
      className={cn(
        "text-[11px] font-medium uppercase tracking-wider",
        colorClasses[color],
        className,
      )}
      {...props}
    />
  )
}

export { SectionLabel }
