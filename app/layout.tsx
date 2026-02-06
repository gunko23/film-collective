import type React from "react"
import type { Metadata, Viewport } from "next"
import { StackProvider, StackTheme } from "@stackframe/stack"
import { stackServerApp } from "@/stack"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/next"
import { PWARegister } from "@/components/pwa-register"
import { AblyClientProvider } from "@/components/ably-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Film Collective",
  description: "A social film platform for understanding and sharing your movie taste",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Film Collective",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: [{ url: "/apple-icon.png" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#0f0d0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          <StackProvider app={stackServerApp}>
            <StackTheme>
              <AblyClientProvider>{children}</AblyClientProvider>
            </StackTheme>
          </StackProvider>
        </ThemeProvider>
        <Analytics />
        <PWARegister />
      </body>
    </html>
  )
}
