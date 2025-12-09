"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      // Check if sw.js exists before registering
      fetch("/sw.js", { method: "HEAD" })
        .then((response) => {
          if (response.ok && response.headers.get("content-type")?.includes("javascript")) {
            return navigator.serviceWorker.register("/sw.js")
          }
          console.log("[v0] Service Worker not available or wrong MIME type")
          return null
        })
        .then((registration) => {
          if (registration) {
            console.log("[v0] Service Worker registered:", registration)
          }
        })
        .catch((error) => {
          console.log("[v0] Service Worker registration skipped:", error.message)
        })
    }
  }, [])

  return null
}
