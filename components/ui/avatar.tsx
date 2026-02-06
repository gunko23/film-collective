"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

type AvatarSize = "xs" | "sm" | "md" | "lg"

const AvatarContext = React.createContext<{ size: AvatarSize; color?: string; gradient?: [string, string] }>({
  size: "sm",
})

const sizeClasses: Record<AvatarSize, string> = {
  xs: "size-7", // 28px
  sm: "size-8", // 32px
  md: "size-10", // 40px
  lg: "size-12", // 48px
}

const fallbackTextClasses: Record<AvatarSize, string> = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

function Avatar({
  className,
  size = "sm",
  color,
  gradient,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: AvatarSize
  color?: string
  gradient?: [string, string]
}) {
  return (
    <AvatarContext.Provider value={{ size, color, gradient }}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    </AvatarContext.Provider>
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  style,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  const { size, color, gradient } = React.useContext(AvatarContext)

  const gradientStyle = gradient
    ? {
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        color: "#0f0d0b",
        boxShadow: `0 2px 12px ${gradient[0]}22`,
        ...style,
      }
    : color
      ? { backgroundColor: color, ...style }
      : style

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full font-bold",
        !color && !gradient && "bg-surface-light text-cream",
        fallbackTextClasses[size],
        className,
      )}
      style={gradientStyle}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "flex items-center -space-x-2.5 [&_[data-slot=avatar]]:ring-2 [&_[data-slot=avatar]]:ring-background",
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup }
