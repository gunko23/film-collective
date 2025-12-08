"use client"

import { useState } from "react"
import Link from "next/link"
import { Film, User, Sparkles, Menu, X, Info, Compass, Users, Settings } from "lucide-react"
import { useUser, useStackApp } from "@stackframe/stack"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notification-bell"

export function Header() {
  const user = useUser()
  const app = useStackApp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-2 sm:mx-4 mt-2 sm:mt-4">
        <div className="mx-auto max-w-6xl">
          <nav className="relative rounded-xl sm:rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20">
            {/* Animated gradient border effect */}
            <div className="absolute -inset-[1px] rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent/20 via-transparent to-accent/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
              {/* Logo */}
              <Link href="/" className="group flex items-center gap-2 sm:gap-3">
                <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/25 group-hover:shadow-accent/40 transition-all duration-300 group-hover:scale-105">
                  <Film className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
                  <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">Film Collective</span>
                  <span className="hidden sm:block text-[10px] font-medium text-accent uppercase tracking-widest">
                    Beta
                  </span>
                </div>
              </Link>

              {/* Center Nav Links - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/"
                  className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-lg hover:bg-secondary/50"
                >
                  Discover
                </Link>
                <Link
                  href="/collectives"
                  className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-lg hover:bg-secondary/50"
                >
                  Collectives
                </Link>
                <Link
                  href="/profile"
                  className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-lg hover:bg-secondary/50"
                >
                  My Films
                </Link>
                <Link
                  href="/about"
                  className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-lg hover:bg-secondary/50"
                >
                  About
                </Link>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />

                {user && <NotificationBell />}

                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background transition-all duration-300">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl || "/placeholder.svg"}
                            alt={user.displayName || "User"}
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-accent/30 hover:ring-accent/50 transition-all duration-300"
                          />
                        ) : (
                          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/80 ring-2 ring-accent/30 hover:ring-accent/50 transition-all duration-300">
                            <span className="text-xs sm:text-sm font-semibold text-accent-foreground">
                              {user.displayName?.charAt(0).toUpperCase() ||
                                user.primaryEmail?.charAt(0).toUpperCase() ||
                                "U"}
                            </span>
                          </div>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-foreground">{user.displayName || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user.primaryEmail}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <div className="md:hidden">
                        <DropdownMenuItem asChild>
                          <Link href="/" className="flex items-center gap-2 cursor-pointer">
                            <Compass className="h-4 w-4" />
                            Discover
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/collectives" className="flex items-center gap-2 cursor-pointer">
                            <Users className="h-4 w-4" />
                            Collectives
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/about" className="flex items-center gap-2 cursor-pointer">
                            <Info className="h-4 w-4" />
                            About
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                          <User className="h-4 w-4" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/handler/account-settings" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Account Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => user.signOut()} className="text-destructive cursor-pointer">
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <div className="hidden sm:flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => app.redirectToSignIn()}
                        className="text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        Sign In
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => app.redirectToSignUp()}
                        className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300"
                      >
                        <Sparkles className="h-4 w-4 mr-1.5" />
                        Get Started
                      </Button>
                    </div>

                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="sm:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      {mobileMenuOpen ? (
                        <X className="h-5 w-5 text-foreground" />
                      ) : (
                        <Menu className="h-5 w-5 text-foreground" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {mobileMenuOpen && !user && (
              <div className="sm:hidden border-t border-border/50 px-3 py-3 space-y-2">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                >
                  <Compass className="h-4 w-4" />
                  Discover
                </Link>
                <Link
                  href="/collectives"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                >
                  <Users className="h-4 w-4" />
                  Collectives
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                >
                  <User className="h-4 w-4" />
                  My Films
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                >
                  <Info className="h-4 w-4" />
                  About
                </Link>
                <div className="pt-2 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      app.redirectToSignIn()
                    }}
                    className="w-full justify-center rounded-lg"
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      app.redirectToSignUp()
                    }}
                    className="w-full justify-center bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg shadow-lg shadow-accent/25"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Get Started
                  </Button>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
