"use client"

import { useEffect, useCallback } from "react"
import useSWR from "swr"

interface SafeUser {
  id: string
  primaryEmail: string | null
  displayName: string | null
  profileImageUrl: string | null
}

interface SafeUserResult {
  user: SafeUser | null
  isLoading: boolean
  isRateLimited: boolean
  error: string | null
  retry: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("Failed to fetch user")
  }
  return res.json()
}

export function useSafeUser(): SafeUserResult {
  const { data, error, isLoading, mutate } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
    dedupingInterval: 10000, // Cache for 10 seconds to reduce API calls
  })

  const retry = useCallback(() => {
    mutate()
  }, [mutate])

  // Auto-retry after 5 seconds when rate limited
  useEffect(() => {
    if (data?.isRateLimited) {
      const timeout = setTimeout(() => {
        retry()
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [data?.isRateLimited, retry])

  return {
    user: data?.user || null,
    isLoading,
    isRateLimited: data?.isRateLimited || false,
    error: error?.message || data?.error || null,
    retry,
  }
}
