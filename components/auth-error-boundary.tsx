"use client"

import { Component, type ReactNode } from "react"
import { RefreshCw } from "lucide-react"
import Header from "@/components/header"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      const isRateLimit =
        this.state.error?.message?.includes("Too Many") ||
        this.state.error?.message?.includes("rate") ||
        this.state.error?.message?.includes("429")

      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="relative z-10 pt-28 pb-16">
            <div className="mx-auto max-w-6xl px-6">
              <div className="text-center py-20 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-6">
                  <RefreshCw className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {isRateLimit ? "Too many requests" : "Something went wrong"}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  {isRateLimit ? "Please wait a moment and try again." : "An error occurred while loading this page."}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-all duration-300 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      )
    }

    return this.props.children
  }
}

export default AuthErrorBoundary
