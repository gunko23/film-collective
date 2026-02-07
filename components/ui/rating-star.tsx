/**
 * SVG star icon with proper half-fill support via <clipPath>.
 *
 * Uses the same 5-point star polygon as Lucide's Star icon so the
 * visual appearance is consistent with the rest of the design system.
 *
 * The half-fill is achieved by rendering two overlapping star polygons:
 *   1. A background star with the empty color (stroke only, no fill)
 *   2. A filled star clipped to exactly the left 50% of the viewBox
 *
 * Each half-fill star needs a document-unique clipPath ID — callers
 * must pass a `uid` prop to guarantee uniqueness.
 */

const STAR_POINTS =
  "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"

export type StarFill = "empty" | "half" | "full"

interface RatingStarProps {
  fill: StarFill
  /** Pixel size (width & height) */
  size: number
  /** Color for the filled portion (fill + stroke) */
  filledColor?: string
  /** Color for the empty portion (stroke only) */
  emptyColor?: string
  /** Document-unique ID suffix used for the SVG clipPath element */
  uid: string
  className?: string
}

export function RatingStar({
  fill,
  size,
  filledColor = "currentColor",
  emptyColor = "currentColor",
  uid,
  className,
}: RatingStarProps) {
  const clipId = `star-half-clip-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {fill === "half" && (
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width="12" height="24" />
          </clipPath>
        </defs>
      )}

      {/* Background: empty star outline */}
      <polygon
        points={STAR_POINTS}
        fill="none"
        stroke={emptyColor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Full fill */}
      {fill === "full" && (
        <polygon
          points={STAR_POINTS}
          fill={filledColor}
          stroke={filledColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Half fill — clipped to left half of viewBox (x: 0–12) */}
      {fill === "half" && (
        <polygon
          points={STAR_POINTS}
          fill={filledColor}
          stroke={filledColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath={`url(#${clipId})`}
        />
      )}
    </svg>
  )
}

/** Helper: compute the fill state for a star at position `star` (1-based) given a rating value. */
export function getStarFill(star: number, rating: number): StarFill {
  if (rating >= star) return "full"
  if (rating >= star - 0.5) return "half"
  return "empty"
}
