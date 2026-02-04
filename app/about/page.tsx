import { Header } from "@/components/header"
import {
  Film,
  Users,
  Sparkles,
  Brain,
  Heart,
  Repeat,
  Users2,
  Fingerprint,
  Moon,
  Clock,
  Shield,
  ListChecks,
  History,
  Trophy,
  Zap,
  Play,
  Palette,
  Theater,
  Star,
} from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Header />

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-[100px] animate-pulse-glow animation-delay-200" />
      </div>

      <main className="relative z-10 pt-6 lg:pt-28 pb-24 lg:pb-16">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.05]">
              A new way to
              <br />
              <span className="gradient-text text-glow">experience film</span>
            </h1>

            <p className="mt-6 sm:mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Built for the people you actually watch movies with. Instead of chasing reviews, followers, or algorithms
              — Film Collective creates private spaces for{" "}
              <span className="text-foreground font-medium">belonging</span>.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/handler/sign-up"
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent text-accent-foreground font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]"
              >
                <span className="relative z-10">Start Your Collective</span>
                <Play className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="px-4 sm:px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 backdrop-blur-sm">
              <div className="absolute top-6 left-8 text-6xl text-accent/20 font-serif">"</div>
              <p className="relative text-xl sm:text-2xl text-foreground leading-relaxed font-medium text-center px-4">
                Most film platforms are designed around broadcasting opinions to strangers.
                <span className="text-accent"> We designed Film Collective for something more meaningful.</span>
              </p>
            </div>
          </div>
        </section>

        {/* Private Groups Section */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-border/30">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Private Groups</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
              Collectives are invite-only spaces for you and the people you care about. No strangers, no algorithms —
              just the people whose opinions actually matter to you.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <ListChecks className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Log what you've watched</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Zap className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Compare your tastes</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <History className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Track shared history</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Trophy className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Celebrate film identity</span>
              </div>
            </div>
          </div>
        </section>

        {/* Smart Recommendations Section */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-border/30">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Smart Recommendations</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
              Group-based curation that considers everyone in the room. No more endless scrolling or debates — just
              great picks for your group.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Users2 className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Everyone's tastes</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Moon className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Mood of the moment</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Clock className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Runtime constraints</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Shield className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Content preferences</span>
              </div>
            </div>
          </div>
        </section>

        {/* Taste Beyond Star Ratings Section */}
        <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-border/30">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Brain className="h-6 w-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Taste Beyond Star Ratings</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-2xl">
              Movies are more than a single score.
            </p>
            <p className="text-lg text-foreground font-medium mb-10 max-w-2xl">
              Film Collective introduces a richer way to express what you felt:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Moon className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Mood Match</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Heart className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Emotional Impact</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Palette className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Aesthetic Style</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Repeat className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Rewatchability</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Theater className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Social Watchability</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Star className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Artistic Merit</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-card/30 border border-border/30 hover:border-accent/30 hover:bg-card/50 transition-all">
                <Fingerprint className="h-6 w-6 text-accent" />
                <span className="text-sm font-medium text-foreground text-center">Personal Resonance</span>
              </div>
            </div>
            <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/20">
              <p className="text-muted-foreground leading-relaxed">
                Each film becomes a <span className="text-foreground font-medium">signature profile</span>, and each
                user develops a <span className="text-foreground font-medium">taste vector</span> that captures far more
                than a number.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                This powers <span className="text-accent font-medium">deeper insights</span>,{" "}
                <span className="text-accent font-medium">better recommendations</span>, and a fuller picture of why
                people love what they love.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-4 sm:px-6 py-16 sm:py-24 border-t border-border/30">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">A More Human Film Platform</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Whether you're picking a movie with your partner, running a weekly film night, or exploring new genres
              with friends — Film Collective makes discovering films feel effortless, personal, and social.
            </p>
            <p className="text-xl font-medium text-accent">Because film is more fun when we experience it together.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 px-4 sm:px-6 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <Film className="h-4 w-4 text-accent" />
            </div>
            <span className="font-semibold text-foreground">Film Collective</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">Film data provided by TMDB</p>
        </div>
      </footer>
    </div>
  )
}
