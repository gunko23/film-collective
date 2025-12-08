"use client"

import { Component, type ReactNode } from "react"
import { RefreshCw, Clock } from "lucide-react"
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
      const errorMessage = this.state.error?.message || ""
      const isRateLimit =
        errorMessage.includes("Too Many") ||
        errorMessage.includes("rate") ||
        errorMessage.includes("429") ||
        errorMessage.includes("is not valid JSON") ||
        errorMessage.includes("Unexpected token")

      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="relative z-10 pt-28 pb-16">
            <div className="mx-auto max-w-6xl px-6">
              <div className="text-center py-20 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-6">
                  {isRateLimit ? (
                    <Clock className="h-10 w-10 text-accent" />
                  ) : (
                    <RefreshCw className="h-10 w-10 text-destructive" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {isRateLimit ? "Please wait a moment" : "Something went wrong"}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  {isRateLimit
                    ? "We're experiencing high traffic. Please wait a few seconds and try again."
                    : "An error occurred while loading this page."}
                </p>
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null })
                    window.location.reload()
                  }}
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
