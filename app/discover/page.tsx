import { Header } from "@/components/header"
import { DiscoverPage } from "@/components/discover-page"

export default function Discover() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Header />
      <main className="relative z-10 pt-16 sm:pt-20">
        <DiscoverPage />
      </main>
    </div>
  )
}
