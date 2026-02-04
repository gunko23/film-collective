"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionLabel } from "@/components/ui/section-label"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { MessageBubble } from "@/components/features/message-bubble"

function Logo({ size = "sm" }: { size?: "sm" | "md" }) {
  const dims = size === "md" ? "size-9" : "size-7"
  const circle = size === "md" ? "size-6" : "size-[18px]"
  const square = size === "md" ? "size-5 rounded" : "size-[14px] rounded"
  return (
    <div className={`relative ${dims} shrink-0`}>
      <div className={`absolute top-0 left-0 ${circle} rounded-full border-[1.5px] border-accent`} />
      <div className={`absolute bottom-0 right-0 ${square} bg-cool opacity-80`} />
    </div>
  )
}

const messages = [
  { user: "Sarah", color: "#7b8cde", content: "Just finished Past Lives... I'm not okay 😭" },
  { user: "Mike", color: "#e07850", content: "RIGHT?? That ending scene..." },
  { user: "Dan", color: "#d4a574", content: "Adding it to my list now 👀" },
]

const features = [
  {
    icon: "💬",
    title: "Discuss everything",
    titleShort: "Discuss",
    desc: "React to scenes, debate endings, share hot takes. Your conversations live alongside the films you love.",
    descShort: "Chat about what you're watching, share reactions, debate endings",
    color: "cool",
  },
  {
    icon: "📋",
    title: "Share watchlists",
    titleShort: "Share lists",
    desc: "Create lists together, track what everyone's seen, build a shared film history over time.",
    descShort: "Create watchlists together, track what everyone's seen",
    color: "accent",
  },
  {
    icon: "✨",
    title: "Find your next watch",
    titleShort: "Get picks",
    desc: "When you can't decide, we'll find something that matches everyone's taste. No more 30-minute scrolls.",
    descShort: "When you can't decide, we'll find something everyone will love",
    color: "accent-soft",
  },
  {
    icon: "🔒",
    title: "Private by default",
    desc: "Your collective is yours. Invite-only, no public profiles, no algorithms deciding what you see.",
    color: "cool",
  },
]

const testimonials = [
  {
    quote:
      "It's like a private group chat but for movies. We share everything we're watching and finally have a place to talk about it all.",
    name: "The Martinez Family",
    context: "Family collective",
  },
  {
    quote:
      "My roommates and I have completely different taste. Film Collective actually finds stuff we all enjoy — I didn't think that was possible.",
    name: "Jake & Friends",
    context: "Apartment of 4",
  },
  {
    quote:
      "We used to spend 45 minutes deciding what to watch. Now it takes 2 minutes and we get to spend that time actually talking about films.",
    name: "Sarah & Mike",
    context: "Couple",
  },
]

const pickFilms = [
  { title: "The Holdovers", year: "2023", match: 94 },
  { title: "Past Lives", year: "2023", match: 91 },
  { title: "Aftersun", year: "2022", match: 88 },
]

export function LandingPage() {
  const [loaded, setLoaded] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100)
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      clearTimeout(t)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [handleMouseMove])

  const ease = "cubic-bezier(0.16, 1, 0.3, 1)"

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient light — static on mobile, mouse-following on desktop */}
      <div
        className="fixed inset-0 pointer-events-none z-0 hidden lg:block transition-[background] duration-500"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at ${25 + mousePos.x * 15}% ${20 + mousePos.y * 15}%, rgba(224,120,80,0.07) 0%, transparent 50%),
            radial-gradient(ellipse 60% 60% at ${75 - mousePos.x * 10}% ${70 + mousePos.y * 10}%, rgba(123,140,222,0.03) 0%, transparent 45%)
          `,
        }}
      />
      <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[50%] bg-[radial-gradient(ellipse,_rgba(224,120,80,0.08)_0%,_transparent_60%)] pointer-events-none lg:hidden" />

      {/* Navigation */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 py-3 lg:fixed lg:top-0 lg:left-0 lg:right-0 lg:z-[100] lg:px-14 lg:py-7"
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(-20px)",
          transition: `all 0.8s ${ease}`,
        }}
      >
        <div className="flex items-center gap-2.5 lg:gap-3.5">
          <Logo size="sm" />
          <span className="text-[15px] lg:text-[17px] font-medium text-cream">Film Collective</span>
        </div>

        {/* Mobile: sign in button */}
        <Button variant="outline" size="sm" asChild className="lg:hidden">
          <Link href="/handler/sign-in">Sign in</Link>
        </Button>

        {/* Desktop: nav links + CTA */}
        <div className="hidden lg:flex items-center gap-12">
          <Link href="/about" className="text-sm text-foreground/40 hover:text-cream transition-colors">
            Features
          </Link>
          <Link href="/about" className="text-sm text-foreground/40 hover:text-cream transition-colors">
            About
          </Link>
          <Link href="/handler/sign-in" className="text-sm font-medium text-cream hover:text-cream/80 transition-colors">
            Sign in
          </Link>
          <Button asChild>
            <Link href="/handler/sign-up">Create your collective</Link>
          </Button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          HERO SECTION
          Mobile: single column, stacked
          Desktop: two columns — copy left, discussion card right
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 lg:min-h-screen lg:flex lg:items-center lg:px-14">
        {/* Decorative circles — desktop only */}
        <div
          className="hidden lg:block absolute top-[10%] right-[5%] size-[500px] rounded-full border border-foreground/[0.02]"
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 1s ease 0.5s",
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[300px] rounded-full border border-foreground/[0.01]" />
        </div>

        <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-16 xl:gap-24 lg:max-w-[1400px] lg:mx-auto lg:w-full lg:items-center">
          {/* Left — Copy */}
          <div className="relative z-10">
            {/* Hero content — mobile */}
            <div
              className="px-6 pt-10 pb-8 lg:px-0 lg:pt-0 lg:pb-0 transition-all duration-[800ms]"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? "translateY(0)" : "translateY(20px)",
                transitionTimingFunction: ease,
              }}
            >
              {/* Eyebrow */}
              <div
                className="flex items-center gap-3 lg:gap-4 mb-6 lg:mb-8"
                style={{
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? "translateY(0)" : "translateY(30px)",
                  transition: `all 0.8s ${ease} 0.2s`,
                }}
              >
                <div className="w-8 lg:w-12 h-0.5 bg-accent" />
                <SectionLabel color="accent">Private film clubs</SectionLabel>
              </div>

              {/* Headline */}
              <h1 className="text-[40px] lg:text-[48px] font-light leading-none lg:leading-[0.98] tracking-tighter lg:tracking-[-0.03em] mb-5 lg:mb-10">
                <span
                  className="block"
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? "translateY(0)" : "translateY(40px)",
                    transition: `all 0.8s ${ease} 0.3s`,
                  }}
                >
                  Your space to
                </span>
                <span
                  className="block italic font-normal text-accent"
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? "translateY(0)" : "translateY(40px)",
                    transition: `all 0.8s ${ease} 0.4s`,
                  }}
                >
                  talk film
                </span>
                <span
                  className="block"
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? "translateY(0)" : "translateY(40px)",
                    transition: `all 0.8s ${ease} 0.5s`,
                  }}
                >
                  together<span className="text-cool">.</span>
                </span>
              </h1>

              {/* Subhead */}
              <p
                className="text-base lg:text-[18px] leading-relaxed lg:leading-[1.6] text-muted-foreground mb-7 lg:mb-12"
                style={{
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? "translateY(0)" : "translateY(30px)",
                  transition: `all 0.8s ${ease} 0.6s`,
                }}
              >
                Create private collectives for your partner, friends, or family. Share what you&apos;re
                watching, discuss your favorites, and discover films you&apos;ll all love.
              </p>

              {/* CTAs */}
              <div
                className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-5 lg:mb-14"
                style={{
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? "translateY(0)" : "translateY(30px)",
                  transition: `all 0.8s ${ease} 0.7s`,
                }}
              >
                <Button
                  size="lg"
                  className="w-full lg:w-auto lg:px-12 lg:py-6 lg:text-[17px]"
                  iconRight={<ArrowRight className="size-[18px] lg:size-5" />}
                  asChild
                >
                  <Link href="/handler/sign-up">Create your collective</Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full lg:w-auto lg:px-12 lg:py-6 lg:text-[17px]" asChild>
                  <Link href="/about">Learn more</Link>
                </Button>
              </div>

              {/* Social proof */}
              <div
                className="hidden lg:flex items-center gap-4"
                style={{
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? "translateY(0)" : "translateY(20px)",
                  transition: `all 0.8s ${ease} 0.8s`,
                }}
              >
                <AvatarGroup>
                  <Avatar size="sm" color="#e07850">
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm" color="#7b8cde">
                    <AvatarFallback>M</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm" color="#d4a574">
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <Avatar size="sm" color="rgba(248,246,241,0.15)">
                    <AvatarFallback>+</AvatarFallback>
                  </Avatar>
                </AvatarGroup>
                <p className="text-[15px] text-muted-foreground">2,400+ collectives talking film</p>
              </div>
            </div>
          </div>

          {/* Right — Discussion preview card (desktop), separate section on mobile */}
          <div
            className="hidden lg:block max-w-[440px] ml-auto"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0) rotate(0deg)" : "translateY(40px) rotate(2deg)",
              transition: `all 1s ${ease} 0.5s`,
            }}
          >
            <DiscussionCard />
          </div>
        </div>
      </section>

      {/* Mobile social proof — below hero */}
      <section className="relative z-10 px-6 pb-8 lg:hidden">
        <div className="flex items-center gap-3.5">
          <AvatarGroup>
            <Avatar size="sm" color="#e07850">
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <Avatar size="sm" color="#7b8cde">
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
            <Avatar size="sm" color="#d4a574">
              <AvatarFallback>S</AvatarFallback>
            </Avatar>
            <Avatar size="sm" color="rgba(248,246,241,0.15)">
              <AvatarFallback>+</AvatarFallback>
            </Avatar>
          </AvatarGroup>
          <p className="text-[13px] text-muted-foreground">2,400+ collectives talking film</p>
        </div>
      </section>

      {/* Mobile discussion preview card */}
      <section className="relative z-10 px-6 pb-8 lg:hidden">
        <div className="bg-card rounded-3xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-foreground/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-md bg-gradient-to-br from-accent/40 to-cool/30 flex items-center justify-center text-base">
                🎬
              </div>
              <div>
                <p className="text-sm font-semibold text-cream">Friday Night Films</p>
                <p className="text-[11px] text-muted-foreground">4 members</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-cool/15 text-[11px] font-medium text-cool">Private</span>
          </div>
          <div className="mb-4">
            <SectionLabel className="mb-3 block">Recent discussion</SectionLabel>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <MessageBubble key={i} userName={msg.user} content={msg.content} />
              ))}
            </div>
          </div>
          <div className="flex items-center px-3.5 py-3 bg-surface-light rounded-full">
            <span className="text-[13px] text-muted-foreground">Share what you&apos;re watching...</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURES SECTION
          Mobile: simple stacked list (3 items)
          Desktop: sticky sidebar left, feature cards right (4 items)
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-8 border-t border-border lg:px-14 lg:py-28">
        {/* Section number — desktop only */}
        <div className="hidden lg:block absolute top-40 right-14 text-[140px] font-extralight text-foreground/[0.03] leading-none select-none">
          01
        </div>

        <div className="lg:max-w-[1400px] lg:mx-auto">
          {/* Mobile features */}
          <div className="lg:hidden">
            <SectionLabel color="cool" className="mb-6 block">
              Your collective, your space
            </SectionLabel>
            {features.slice(0, 3).map((item, i) => (
              <div key={i} className="flex gap-4 py-5 items-start" style={{ borderBottom: i < 2 ? undefined : "none" }}>
                {i < 2 && <div className="absolute left-6 right-6 bottom-0 h-px bg-border" />}
                <div className="size-10 rounded-xl bg-card flex items-center justify-center text-lg shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-base font-medium text-cream mb-1">{item.titleShort || item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.descShort || item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop features — centered intro + 2-col grid */}
          <div className="hidden lg:block">
            {/* Centered intro */}
            <div className="max-w-[640px] mb-16">
              <SectionLabel color="cool" className="mb-6 block">
                Your collective, your space
              </SectionLabel>
              <h2 className="text-[48px] font-light leading-[1.1] tracking-[-0.02em] mb-6">
                More than just
                <span className="italic text-accent"> recommendations</span>
              </h2>
              <p className="text-[18px] leading-[1.65] text-foreground/60">
                Film Collective is a private space for you and your people to share, discuss, and discover films
                together. It&apos;s your movie club, digitized.
              </p>
            </div>

            {/* Feature cards — 2-col grid */}
            <div className="grid grid-cols-2 gap-5">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="flex gap-5 p-7 bg-surface rounded-[20px] border border-foreground/[0.04] items-start"
                >
                  <div
                    className="size-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{
                      backgroundColor:
                        feature.color === "cool"
                          ? "rgba(123,140,222,0.12)"
                          : feature.color === "accent"
                            ? "rgba(224,120,80,0.12)"
                            : "rgba(212,165,116,0.12)",
                    }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium tracking-[-0.01em] mb-2">{feature.title}</h3>
                    <p className="text-[15px] leading-[1.6] text-foreground/[0.35]">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TONIGHT'S PICK
          Mobile: simple grid of 3 film cards
          Desktop: two columns — interactive demo left, copy right
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-8 border-t border-border lg:px-14 lg:py-28 lg:bg-surface lg:border-t-0">
        {/* Mobile */}
        <div className="lg:hidden">
          <SectionLabel color="accent" className="mb-2 block">
            When you can&apos;t decide
          </SectionLabel>
          <h3 className="text-[22px] font-normal tracking-tight text-cream mb-4">Tonight&apos;s Pick</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Select who&apos;s watching and the mood — we&apos;ll find films that match everyone&apos;s taste. No more
            30-minute scroll sessions.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {pickFilms.map((film, i) => (
              <div key={i} className="bg-card rounded-xl p-3 border border-border">
                <div
                  className="w-full aspect-[2/3] rounded-md mb-2.5"
                  style={{
                    background: `linear-gradient(135deg, rgba(224,120,80,${0.3 - i * 0.08}), rgba(123,140,222,${0.2 - i * 0.05}))`,
                  }}
                />
                <div className="px-2 py-1 rounded bg-cool/15 text-xs font-semibold text-cool text-center">
                  {film.match}% match
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:block lg:max-w-[1200px] lg:mx-auto">
          <div className="grid grid-cols-[3fr_2fr] gap-16 xl:gap-24 items-center">
            {/* Left — copy (larger side) */}
            <div>
              <SectionLabel color="accent" className="mb-6 block">
                When you can&apos;t decide
              </SectionLabel>
              <h2 className="text-[48px] font-light leading-[1.1] tracking-[-0.02em] mb-6">
                Find something
                <span className="italic text-cool"> everyone</span> will love
              </h2>
              <p className="text-[18px] leading-[1.65] text-foreground/60 mb-10">
                Select who&apos;s watching and the vibe you&apos;re going for. We&apos;ll analyze everyone&apos;s taste
                and find films that hit the sweet spot — movies you&apos;ll all genuinely enjoy, not just tolerate.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  "Learns from your ratings and Letterboxd",
                  "Factors in streaming availability",
                  "Gets smarter the more you watch",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="size-5 rounded-full bg-cool/20 flex items-center justify-center shrink-0">
                      <Check className="size-2.5 text-cool" strokeWidth={3} />
                    </div>
                    <span className="text-[15px] text-foreground/70">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — demo (smaller side) */}
            <div className="bg-background rounded-2xl p-6 border border-foreground/[0.04] max-w-[380px] ml-auto">
              <div className="mb-5">
                <SectionLabel color="accent" className="mb-1.5 block">
                  Tonight&apos;s Pick
                </SectionLabel>
                <p className="text-base font-medium text-cream">Friday with Sarah & Dan</p>
              </div>

              {/* Mood selector */}
              <div className="mb-5">
                <p className="text-[11px] text-foreground/40 mb-2.5">Mood?</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["Chill", "Intense", "Funny", "Deep"].map((mood, i) => (
                    <span
                      key={mood}
                      className={`px-4 py-2 rounded-full text-[13px] font-medium ${
                        i === 0
                          ? "bg-accent text-background"
                          : "bg-transparent text-foreground/60 border border-foreground/[0.08]"
                      }`}
                    >
                      {mood}
                    </span>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div>
                <p className="text-[11px] text-foreground/40 mb-3">Perfect matches</p>
                {pickFilms.map((film, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl mb-1 ${
                      i === 0 ? "bg-surface-light" : ""
                    }`}
                  >
                    <div
                      className="w-9 h-[50px] rounded-md shrink-0"
                      style={{
                        background: `linear-gradient(135deg, rgba(224,120,80,${0.35 - i * 0.07}), rgba(123,140,222,0.2))`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cream mb-0.5">{film.title}</p>
                      <p className="text-xs text-foreground/[0.35]">{film.year}</p>
                    </div>
                    <div className="px-2.5 py-1 bg-cool/15 rounded-md">
                      <span className="text-[13px] font-semibold text-cool">{film.match}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURES GRID (mobile only) / hidden on desktop
          ═══════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 py-8 border-t border-border lg:hidden">
        <SectionLabel className="mb-5 block">Also included</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { title: "Letterboxd sync", color: "bg-cool" },
            { title: "Taste compatibility", color: "bg-accent" },
            { title: "Group insights", color: "bg-accent-soft" },
            { title: "Private & secure", color: "bg-cool" },
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3.5 py-4 bg-card rounded-xl border border-border">
              <div className={`size-2 rounded-full shrink-0 ${feature.color}`} />
              <p className="text-[13px] font-medium text-cream">{feature.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TESTIMONIALS
          Mobile: single card
          Desktop: 3-column grid with header
          ═══════════════════════════════════════════════════ */}
      {/* Mobile testimonial */}
      <section className="relative z-10 px-6 pb-8 lg:hidden">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/[0.07] to-cool/[0.05]">
          <p className="text-[15px] italic leading-relaxed text-cream mb-3">
            &ldquo;{testimonials[0].quote}&rdquo;
          </p>
          <p className="text-[13px] text-muted-foreground">&mdash; {testimonials[0].name}</p>
        </div>
      </section>

      {/* Desktop testimonials */}
      <section className="hidden lg:block relative z-10 px-14 py-28">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <SectionLabel className="mb-5 block">From our collectives</SectionLabel>
            <h2 className="text-[48px] font-light tracking-[-0.02em]">
              People are <span className="italic text-accent">loving</span> it
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 bg-surface rounded-[20px] border border-foreground/[0.04]">
                <p className="text-base leading-[1.6] mb-6 italic text-cream">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-medium text-cream">{t.name}</p>
                  <p className="text-[13px] text-foreground/[0.35]">{t.context}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════ */}
      {/* Mobile CTA */}
      <section className="relative z-10 px-6 py-8 lg:hidden">
        <div className="relative px-6 py-10 rounded-3xl bg-gradient-to-br from-accent/[0.13] to-cool/[0.09] text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[200px] rounded-full border border-foreground/[0.06]" />
          <div className="relative z-10">
            <h3 className="text-2xl font-light tracking-tight leading-snug mb-2">
              Start your
              <br />
              <span className="italic text-accent">film club</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-6">Invite your people, start talking</p>
            <Button asChild>
              <Link href="/handler/sign-up">Create your collective</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Desktop CTA */}
      <section className="hidden lg:block relative z-10 px-14 py-28 text-center">
        {/* Decorative circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full border border-foreground/[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] rounded-full border border-foreground/[0.04]" />

        <div className="relative z-10 max-w-[700px] mx-auto">
          <h2 className="text-[clamp(40px,5vw,60px)] font-light leading-[1.1] tracking-[-0.02em] mb-6">
            Start your
            <br />
            <span className="italic text-accent">film club</span>
          </h2>
          <p className="text-xl text-foreground/[0.35] mb-10">
            Invite your people, start talking about the films you love
          </p>
          <Button size="lg" className="px-[52px] py-[22px] text-[17px]" iconRight={<ArrowRight className="size-[22px]" />} asChild>
            <Link href="/handler/sign-up">Create your collective</Link>
          </Button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
          Mobile: centered
          Desktop: horizontal with logo left, links right
          ═══════════════════════════════════════════════════ */}
      <footer className="relative z-10 px-6 py-6 border-t border-border text-center lg:px-14 lg:py-12 lg:flex lg:justify-between lg:items-center lg:text-left">
        {/* Desktop footer left */}
        <div className="hidden lg:flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-sm text-foreground/40">© 2026 Film Collective</span>
        </div>

        {/* Links */}
        <div className="flex justify-center lg:justify-end gap-6 lg:gap-9 mb-4 lg:mb-0">
          {[
            { label: "About", href: "/about" },
            { label: "Privacy", href: "/about" },
            { label: "Terms", href: "/about" },
            { label: "Contact", href: "/about" },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="text-[13px] lg:text-sm text-muted-foreground hover:text-cream transition-colors">
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile copyright */}
        <p className="text-xs text-foreground/20 lg:hidden">© 2026 Film Collective</p>
      </footer>

      {/* Typing animation keyframes */}
      <style jsx>{`
        @keyframes typing-dot {
          0%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   DISCUSSION CARD — desktop hero right column
   Richer than the mobile version with "currently discussing"
   film bar and typing indicator
   ═══════════════════════════════════════════════════ */
function DiscussionCard() {
  return (
    <div className="bg-surface rounded-2xl border border-foreground/[0.04] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-foreground/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-gradient-to-br from-accent/40 to-cool/30 flex items-center justify-center text-sm">
            🎬
          </div>
          <div>
            <p className="text-sm font-semibold text-cream">Friday Night Films</p>
            <p className="text-[11px] text-foreground/40">4 members · Active now</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-cool/15 text-[10px] font-medium text-cool">Private</span>
      </div>

      {/* Currently discussing */}
      <div className="px-5 py-3.5 bg-surface-light flex items-center gap-3">
        <div className="w-10 h-[54px] rounded-md shrink-0 bg-gradient-to-br from-accent/50 to-cool/30" />
        <div>
          <p className="text-[10px] text-foreground/[0.25] tracking-widest uppercase mb-0.5">Currently discussing</p>
          <p className="text-[15px] font-semibold text-cream mb-0.5">Past Lives</p>
          <p className="text-xs text-foreground/50">2023 · Drama, Romance</p>
        </div>
      </div>

      {/* Messages */}
      <div className="px-5 py-4">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <MessageBubble key={i} userName={msg.user} content={msg.content} />
          ))}
        </div>

        {/* Typing indicator */}
        <div className="flex items-center gap-2 mt-3 pl-[38px]">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-1.5 rounded-full bg-foreground/30"
                style={{
                  animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <span className="text-[11px] text-foreground/[0.25]">Emma is typing...</span>
        </div>
      </div>

      {/* Input hint */}
      <div className="px-5 py-3 border-t border-foreground/[0.04]">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-light rounded-full">
          <span className="text-[13px] text-foreground/[0.25]">Share your thoughts...</span>
        </div>
      </div>
    </div>
  )
}
