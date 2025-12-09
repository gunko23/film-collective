import { stackServerApp } from "@/stack"

export interface AuthResult {
  user: { id: string; primaryEmail: string | null; displayName: string | null; profileImageUrl: string | null } | null
  error: string | null
  isRateLimited: boolean
}

/**
 * Safe auth helper that handles rate limiting gracefully
 * Returns user data or null with error info instead of throwing
 */
export async function getSafeUser(): Promise<AuthResult> {
  try {
    const user = await stackServerApp.getUser()
    return {
      user: user
        ? {
            id: user.id,
            primaryEmail: user.primaryEmail,
            displayName: user.displayName,
            profileImageUrl: user.profileImageUrl,
          }
        : null,
      error: null,
      isRateLimited: false,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isRateLimited = errorMessage.includes("Too Many") || errorMessage.includes("rate")

    return {
      user: null,
      error: errorMessage,
      isRateLimited,
    }
  }
}
