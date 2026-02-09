/**
 * Reasoning Publisher
 *
 * Generates LLM reasoning asynchronously and publishes results
 * to Ably so the frontend can stream them in as they arrive.
 * This avoids blocking the recommendation response on LLM latency.
 */

import Ably from "ably"
import { generateRecommendationReasoning } from "./reasoning-service"
import type { MovieRecommendation } from "./recommendation-service"

type ReasoningPublishInput = {
  recommendations: MovieRecommendation[]
  lovedMovies: { title: string; avgScore: number }[]
  dislikedMovies: { title: string; avgScore: number }[]
  mood: string | null
  soloMode: boolean
  memberCount: number
  channelId: string
}

/**
 * Generate LLM reasoning and publish each movie's result to Ably.
 * Designed to be called fire-and-forget after returning recommendations.
 */
export async function generateAndPublishReasoning(input: ReasoningPublishInput): Promise<void> {
  const ablyApiKey = process.env.ABLY_API_KEY
  if (!ablyApiKey) {
    console.warn("[ReasoningPublisher] ABLY_API_KEY not set, skipping publish")
    return
  }

  const ably = new Ably.Rest({ key: ablyApiKey })

  try {
    const reasoning = await generateRecommendationReasoning({
      recommendations: input.recommendations,
      lovedMovies: input.lovedMovies,
      dislikedMovies: input.dislikedMovies,
      mood: input.mood,
      soloMode: input.soloMode,
      memberCount: input.memberCount,
    })

    const channel = ably.channels.get(input.channelId)

    // Publish each movie's reasoning as it's ready
    for (const [tmdbId, data] of reasoning.entries()) {
      await channel.publish("reasoning", {
        tmdbId,
        summary: data.summary,
        pairings: data.pairings || null,
        parentalSummary: data.parentalSummary || null,
      })
    }

    // Signal completion
    await channel.publish("reasoning-complete", {
      count: reasoning.size,
    })

    console.log(`[ReasoningPublisher] Published reasoning for ${reasoning.size} movies to ${input.channelId}`)
  } catch (error) {
    console.error("[ReasoningPublisher] Error generating/publishing reasoning:", error)
  }
}
