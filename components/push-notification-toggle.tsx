"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if push notifications are supported
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      waitForServiceWorkerAndCheckSubscription()
    } else {
      setIsLoading(false)
    }
  }, [])

  async function waitForServiceWorkerAndCheckSubscription() {
    try {
      let registration = await navigator.serviceWorker.getRegistration("/sw.js")

      if (!registration) {
        // Try to register it ourselves if not already registered
        try {
          registration = await navigator.serviceWorker.register("/sw.js")
          console.log("[v0] Service worker registered from toggle")
        } catch (regError) {
          console.error("[v0] Failed to register service worker:", regError)
          setError("Could not register service worker")
          setIsLoading(false)
          return
        }
      }

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Service worker activation timeout")), 10000),
      )

      // Wait for service worker to be ready
      const readyRegistration = await Promise.race([navigator.serviceWorker.ready, timeoutPromise])

      const subscription = await readyRegistration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
      console.log("[v0] Push subscription status:", !!subscription)
    } catch (error) {
      console.error("[v0] Error checking subscription:", error)
      setError("Push notifications unavailable")
    } finally {
      setIsLoading(false)
    }
  }

  async function subscribe() {
    setIsLoading(true)
    setError(null)
    try {
      // Request permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== "granted") {
        setError("Notification permission denied")
        setIsLoading(false)
        return
      }

      // Get VAPID public key
      const keyResponse = await fetch("/api/push/vapid-key")
      if (!keyResponse.ok) {
        const errorData = await keyResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to get VAPID key")
      }
      const { publicKey } = await keyResponse.json()

      if (!publicKey) {
        throw new Error("VAPID public key not configured")
      }

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (response.ok) {
        setIsSubscribed(true)
        console.log("[v0] Successfully subscribed to push notifications")
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to save subscription")
      }
    } catch (error) {
      console.error("[v0] Error subscribing to push:", error)
      setError(error instanceof Error ? error.message : "Failed to enable notifications")
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribe() {
    setIsLoading(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe()

        // Remove from server
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setIsSubscribed(false)
      console.log("[v0] Successfully unsubscribed from push notifications")
    } catch (error) {
      console.error("[v0] Error unsubscribing from push:", error)
      setError("Failed to disable notifications")
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-destructive">{error}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null)
            setIsLoading(true)
            waitForServiceWorkerAndCheckSubscription()
          }}
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (!isSupported) {
    return <div className="text-sm text-muted-foreground">Push notifications are not supported in this browser</div>
  }

  if (permission === "denied") {
    return (
      <div className="text-sm text-muted-foreground">
        Notifications are blocked. Please enable them in your browser settings.
      </div>
    )
  }

  return (
    <Button
      variant={isSubscribed ? "outline" : "default"}
      size="sm"
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {isLoading ? "Loading..." : isSubscribed ? "Disable Notifications" : "Enable Notifications"}
    </Button>
  )
}
