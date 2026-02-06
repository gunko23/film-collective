import * as React from "react"

import { cn } from "@/lib/utils"

type SectionLabelColor = "muted" | "accent" | "cool"

const colorClasses: Record<SectionLabelColor, string> = {
  muted: "text-cream-faint",
  accent: "text-orange",
  cool: "text-blue",
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
        "text-[11px] font-semibold uppercase tracking-[0.16em]",
        colorClasses[color],
        className,
      )}
      {...props}
    />
  )
}

export { SectionLabel }
