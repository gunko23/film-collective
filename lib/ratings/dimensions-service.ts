import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Types for dynamic rating dimensions
export interface RatingDimension {
  id: string
  key: string
  label: string
  description: string | null
  uiType: "slider" | "tags"
  minValue: number | null
  maxValue: number | null
  step: number | null
  isActive: boolean
  weightDefault: number
  sortOrder: number
  options?: RatingDimensionOption[]
}

export interface RatingDimensionOption {
  id: string
  key: string
  label: string
  description: string | null
  isActive: boolean
  sortOrder: number
}

export interface DimensionScores {
  [key: string]: number
}

export interface DimensionTags {
  [dimensionKey: string]: string[]
}

export interface RatingPayload {
  stars: number // 1-5 star rating
  dimensionScores?: DimensionScores // { emotional_impact: 4, pacing: 3, ... }
  dimensionTags?: DimensionTags // { vibes: ["cozy", "heartwarming"] }
  extraNotes?: string
}

/**
 * Fetch all active rating dimensions with their options
 */
export async function getActiveRatingDimensions(): Promise<RatingDimension[]> {
  const dimensions = await sql`
    SELECT 
      id,
      key,
      label,
      description,
      ui_type as "uiType",
      min_value as "minValue",
      max_value as "maxValue",
      step,
      is_active as "isActive",
      weight_default as "weightDefault",
      sort_order as "sortOrder"
    FROM rating_dimensions
    WHERE is_active = true
    ORDER BY sort_order ASC
  `

  // Fetch options for tag-type dimensions
  const tagDimensionIds = dimensions.filter((d) => d.uiType === "tags").map((d) => d.id)

  const optionsMap: Record<string, RatingDimensionOption[]> = {}

  if (tagDimensionIds.length > 0) {
    const options = await sql`
      SELECT 
        id,
        rating_dimension_id as "ratingDimensionId",
        key,
        label,
        description,
        is_active as "isActive",
        sort_order as "sortOrder"
      FROM rating_dimension_options
      WHERE rating_dimension_id = ANY(${tagDimensionIds})
        AND is_active = true
      ORDER BY sort_order ASC
    `

    // Group options by dimension id
    for (const opt of options) {
      if (!optionsMap[opt.ratingDimensionId]) {
        optionsMap[opt.ratingDimensionId] = []
      }
      optionsMap[opt.ratingDimensionId].push({
        id: opt.id,
        key: opt.key,
        label: opt.label,
        description: opt.description,
        isActive: opt.isActive,
        sortOrder: opt.sortOrder,
      })
    }
  }

  return dimensions.map((d) => ({
    id: d.id,
    key: d.key,
    label: d.label,
    description: d.description,
    uiType: d.uiType as "slider" | "tags",
    minValue: d.minValue ? Number(d.minValue) : null,
    maxValue: d.maxValue ? Number(d.maxValue) : null,
    step: d.step ? Number(d.step) : null,
    isActive: d.isActive,
    weightDefault: Number(d.weightDefault),
    sortOrder: d.sortOrder,
    options: optionsMap[d.id] || undefined,
  }))
}

/**
 * Get dimensions configured for a specific movie (falls back to all active if none configured)
 */
export async function getDimensionsForMovie(movieId: string): Promise<RatingDimension[]> {
  // Check if there are custom configs for this movie
  const customConfigs = await sql`
    SELECT rating_dimension_id
    FROM movie_rating_dimension_configs
    WHERE movie_id = ${movieId}
  `

  if (customConfigs.length === 0) {
    // No custom config, return all active dimensions
    return getActiveRatingDimensions()
  }

  // Return only configured dimensions for this movie
  const dimensionIds = customConfigs.map((c) => c.rating_dimension_id)

  const dimensions = await sql`
    SELECT 
      rd.id,
      rd.key,
      rd.label,
      rd.description,
      rd.ui_type as "uiType",
      rd.min_value as "minValue",
      rd.max_value as "maxValue",
      rd.step,
      rd.is_active as "isActive",
      COALESCE(mrc.weight, rd.weight_default) as "weightDefault",
      rd.sort_order as "sortOrder"
    FROM rating_dimensions rd
    LEFT JOIN movie_rating_dimension_configs mrc 
      ON mrc.rating_dimension_id = rd.id 
      AND mrc.movie_id = ${movieId}
    WHERE rd.id = ANY(${dimensionIds})
      AND rd.is_active = true
    ORDER BY rd.sort_order ASC
  `

  // Fetch options for tag-type dimensions (same as above)
  const tagDimensionIds = dimensions.filter((d) => d.uiType === "tags").map((d) => d.id)

  const optionsMap: Record<string, RatingDimensionOption[]> = {}

  if (tagDimensionIds.length > 0) {
    const options = await sql`
      SELECT 
        id,
        rating_dimension_id as "ratingDimensionId",
        key,
        label,
        description,
        is_active as "isActive",
        sort_order as "sortOrder"
      FROM rating_dimension_options
      WHERE rating_dimension_id = ANY(${tagDimensionIds})
        AND is_active = true
      ORDER BY sort_order ASC
    `

    for (const opt of options) {
      if (!optionsMap[opt.ratingDimensionId]) {
        optionsMap[opt.ratingDimensionId] = []
      }
      optionsMap[opt.ratingDimensionId].push({
        id: opt.id,
        key: opt.key,
        label: opt.label,
        description: opt.description,
        isActive: opt.isActive,
        sortOrder: opt.sortOrder,
      })
    }
  }

  return dimensions.map((d) => ({
    id: d.id,
    key: d.key,
    label: d.label,
    description: d.description,
    uiType: d.uiType as "slider" | "tags",
    minValue: d.minValue ? Number(d.minValue) : null,
    maxValue: d.maxValue ? Number(d.maxValue) : null,
    step: d.step ? Number(d.step) : null,
    isActive: d.isActive,
    weightDefault: Number(d.weightDefault),
    sortOrder: d.sortOrder,
    options: optionsMap[d.id] || undefined,
  }))
}

/**
 * Validate dimension scores against configured dimensions
 */
export function validateDimensionScores(
  scores: DimensionScores,
  dimensions: RatingDimension[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const sliderDimensions = dimensions.filter((d) => d.uiType === "slider")

  for (const [key, value] of Object.entries(scores)) {
    const dimension = sliderDimensions.find((d) => d.key === key)
    if (!dimension) {
      errors.push(`Unknown dimension: ${key}`)
      continue
    }

    const min = dimension.minValue ?? 0
    const max = dimension.maxValue ?? 5

    if (value < min || value > max) {
      errors.push(`${dimension.label} must be between ${min} and ${max}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate dimension tags against configured dimensions
 */
export function validateDimensionTags(
  tags: DimensionTags,
  dimensions: RatingDimension[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const tagDimensions = dimensions.filter((d) => d.uiType === "tags")

  for (const [dimensionKey, selectedTags] of Object.entries(tags)) {
    const dimension = tagDimensions.find((d) => d.key === dimensionKey)
    if (!dimension) {
      errors.push(`Unknown tag dimension: ${dimensionKey}`)
      continue
    }

    if (!dimension.options) {
      errors.push(`No options configured for dimension: ${dimensionKey}`)
      continue
    }

    const validKeys = dimension.options.map((o) => o.key)
    for (const tag of selectedTags) {
      if (!validKeys.includes(tag)) {
        errors.push(`Invalid tag "${tag}" for dimension ${dimension.label}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
