"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Film,
  User,
  Sparkles,
  Menu,
  X,
  Info,
  Compass,
  Users,
  Settings,
  Loader2,
  LogIn,
  LayoutDashboard,
} from "lucide-react"
import { useUser, useStackApp } from "@stackframe/stack"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notification-bell"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { ErrorBoundary } from "react-error-boundary"

const AVATAR_GRADIENTS: [string, string][] = [
  ["#ff6b2d", "#ff8f5e"],
  ["#3d5a96", "#6b8fd4"],
  ["#2a9d8f", "#5ec4b6"],
  ["#e07878", "#f0a0a0"],
  ["#7b6fa6", "#a99cd4"],
]

function getUserGradient(name: string): [string, string] {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function UserContent() {
  const user = useUser()
  const app = useStackApp()

  if (!user) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => app.redirectToSignIn()}
          className="text-cream-faint hover:text-cream rounded-lg"
        >
          Sign In
        </Button>
        <Button
          size="sm"
          onClick={() => app.redirectToSignUp()}
          className="bg-gradient-to-r from-orange to-orange-light text-warm-black hover:opacity-90 rounded-lg shadow-lg shadow-orange/25 hover:shadow-orange/40 transition-all duration-300"
        >
          <Sparkles className="h-4 w-4 mr-1.5" />
          Get Started
        </Button>
      </div>
    )
  }

  const displayName = user.displayName || user.primaryEmail || "U"
  const gradient = getUserGradient(displayName)

  return (
    <>
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-orange/50 focus:ring-offset-2 focus:ring-offset-background transition-all duration-300">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl || "/placeholder.svg"}
                alt={user.displayName || "User"}
                className="h-8 w-8 rounded-full ring-2 ring-cream-faint/20 hover:ring-cream-faint/40 transition-all duration-300"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-cream-faint/20 hover:ring-cream-faint/40 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                }}
              >
                <span className="text-xs font-bold" style={{ color: "#0f0d0b" }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl bg-card border-cream-faint/[0.08]">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-cream">{user.displayName || "User"}</p>
            <p className="text-xs text-cream-faint">{user.primaryEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <div className="md:hidden">
            <DropdownMenuItem asChild>
              <Link href="/discover" className="flex items-center gap-2 cursor-pointer">
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
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
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
    </>
  )
}

function UserContentFallback() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" disabled className="text-cream-faint rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    </div>
  )
}

function UserContentError({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={resetErrorBoundary}
      className="text-cream-faint hover:text-cream rounded-lg"
    >
      Retry
    </Button>
  )
}

function MobileMenuContent({ onClose }: { onClose: () => void }) {
  const user = useUser()
  const app = useStackApp()

  return (
    <div className="sm:hidden border-t border-cream-faint/[0.05] px-3 py-3 space-y-2">
      {user && (
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cream-faint hover:text-cream transition-colors rounded-lg hover:bg-cream/[0.03]"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      )}
      <Link
        href="/discover"
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cream-faint hover:text-cream transition-colors rounded-lg hover:bg-cream/[0.03]"
      >
        <Compass className="h-4 w-4" />
        Discover
      </Link>
      <Link
        href="/collectives"
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cream-faint hover:text-cream transition-colors rounded-lg hover:bg-cream/[0.03]"
      >
        <Users className="h-4 w-4" />
        Collectives
      </Link>
      <Link
        href="/profile"
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cream-faint hover:text-cream transition-colors rounded-lg hover:bg-cream/[0.03]"
      >
        <User className="h-4 w-4" />
        My Films
      </Link>
      <Link
        href="/about"
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cream-faint hover:text-cream transition-colors rounded-lg hover:bg-cream/[0.03]"
      >
        <Info className="h-4 w-4" />
        About
      </Link>

      {!user && (
        <>
          <div className="border-t border-cream-faint/[0.05] my-2" />
          <button
            onClick={() => {
              onClose()
              app.redirectToSignIn()
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-cream-faint hover:text-cream transition-colors rounded-lg hover:bg-cream/[0.03] w-full"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </button>
          <button
            onClick={() => {
              onClose()
              app.redirectToSignUp()
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-warm-black bg-gradient-to-r from-orange to-orange-light hover:opacity-90 transition-colors rounded-lg w-full"
          >
            <Sparkles className="h-4 w-4" />
            Get Started
          </button>
        </>
      )}
    </div>
  )
}

function MobileMenuButton({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}) {
  const user = useUser()

  if (user) {
    return null
  }

  return (
    <button
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      className="sm:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-cream/[0.03] transition-colors"
    >
      {mobileMenuOpen ? <X className="h-5 w-5 text-cream" /> : <Menu className="h-5 w-5 text-cream" />}
    </button>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-lg ${
        isActive
          ? "text-cream bg-cream/[0.03]"
          : "text-cream-faint hover:text-cream hover:bg-cream/[0.03]"
      }`}
    >
      {children}
    </Link>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = useUser()

  return (
    <>
      <header
        className="hidden lg:block fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(15,13,11,0.91)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(107,99,88,0.05)",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="relative flex h-16 items-center justify-between px-6">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-3">
              <div
                className="relative flex h-9 w-9 items-center justify-center rounded-xl shadow-lg transition-all duration-300 group-hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #ff6b2d, #3d5a96)",
                  boxShadow: "0 4px 16px rgba(255,107,45,0.2)",
                }}
              >
                <Film className="h-[18px] w-[18px]" style={{ color: "#0f0d0b" }} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-cream">Film Collective</span>
                <span className="text-[10px] font-medium text-orange uppercase tracking-widest">
                  Beta
                </span>
              </div>
            </Link>

            {/* Center Nav Links - text only, no icons */}
            <div className="hidden md:flex items-center gap-1">
              {user && <NavLink href="/">Dashboard</NavLink>}
              <NavLink href="/discover">Discover</NavLink>
              <NavLink href="/collectives">Collectives</NavLink>
              <NavLink href="/profile">My Films</NavLink>
              <NavLink href="/about">About</NavLink>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <ErrorBoundary FallbackComponent={UserContentError} onReset={() => window.location.reload()}>
                <Suspense fallback={<UserContentFallback />}>
                  <UserContent />
                </Suspense>
              </ErrorBoundary>

              <ErrorBoundary FallbackComponent={() => null} onReset={() => {}}>
                <Suspense fallback={null}>
                  <MobileMenuButton mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>

          {mobileMenuOpen && (
            <ErrorBoundary FallbackComponent={UserContentError} onReset={() => window.location.reload()}>
              <Suspense
                fallback={
                  <div className="sm:hidden border-t border-cream-faint/[0.05] px-3 py-3">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                }
              >
                <MobileMenuContent onClose={() => setMobileMenuOpen(false)} />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
      </header>
      <MobileBottomNav />
    </>
  )
}

export default Header
