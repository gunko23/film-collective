export type GroupMember = {
  userId: string
  name: string
  avatarUrl: string | null
}

export type GenrePreference = {
  genreId: number
  genreName: string
  avgScore: number
  ratingCount: number
}

export type ParentalGuideInfo = {
  sexNudity: "None" | "Mild" | "Moderate" | "Severe" | null
  violence: "None" | "Mild" | "Moderate" | "Severe" | null
  profanity: "None" | "Mild" | "Moderate" | "Severe" | null
  alcoholDrugsSmoking: "None" | "Mild" | "Moderate" | "Severe" | null
  frighteningIntense: "None" | "Mild" | "Moderate" | "Severe" | null
}

export type ConcessionPairings = {
  cocktail: { name: string; desc: string }
  zeroproof: { name: string; desc: string }
  snack: { name: string; desc: string }
}

export type MovieRecommendation = {
  tmdbId: number
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string
  runtime: number | null
  genres: { id: number; name: string }[]
  voteAverage: number
  certification?: string | null
  imdbId?: string | null
  groupFitScore: number
  genreMatchScore: number
  reasoning: string[]
  seenBy: string[]
  parentalGuide?: ParentalGuideInfo | null
  pairings?: ConcessionPairings | null
  parentalSummary?: string | null
}

export type TonightPickResponse = {
  recommendations: MovieRecommendation[]
  groupProfile: {
    memberCount: number
    sharedGenres: GenrePreference[]
    totalRatings: number
  }
}

export type MoodValue = "fun" | "intense" | "emotional" | "mindless" | "acclaimed"
export type Mood = MoodValue | null
export type Audience = "anyone" | "teens" | "adults"
export type ContentLevel = "None" | "Mild" | "Moderate" | "Severe" | null
