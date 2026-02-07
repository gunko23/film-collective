import { Film, Tv, Clapperboard, DollarSign } from "lucide-react"

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(0)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return `$${amount}`
}

interface MediaStatsGridProps {
  isMovie: boolean
  status?: string
  budget?: number
  revenue?: number
  productionCompanies?: { id: number; name: string }[]
  type?: string
  numberOfEpisodes?: number
  networks?: { id: number; name: string; logo_path?: string }[]
}

export function MediaStatsGrid({
  isMovie,
  status,
  budget,
  revenue,
  productionCompanies,
  type,
  numberOfEpisodes,
  networks,
}: MediaStatsGridProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
        Details
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
        {status && (
          <div className="text-center lg:text-left">
            <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
              <Film className="h-3 w-3" /> Status
            </p>
            <p className="font-medium text-foreground">{status}</p>
          </div>
        )}
        {/* Movie-specific details */}
        {isMovie && budget && budget > 0 && (
          <div className="text-center lg:text-left">
            <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
              <DollarSign className="h-3 w-3" /> Budget
            </p>
            <p className="font-medium text-foreground">{formatCurrency(budget)}</p>
          </div>
        )}
        {isMovie && revenue && revenue > 0 && (
          <div className="text-center lg:text-left">
            <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
              <DollarSign className="h-3 w-3" /> Revenue
            </p>
            <p className="font-medium text-foreground">{formatCurrency(revenue)}</p>
          </div>
        )}
        {isMovie && productionCompanies && productionCompanies.length > 0 && (
          <div className="text-center lg:text-left">
            <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
              <Clapperboard className="h-3 w-3" /> Studio
            </p>
            <p className="font-medium text-foreground truncate">{productionCompanies[0].name}</p>
          </div>
        )}
        {/* TV-specific details */}
        {!isMovie && type && (
          <div className="text-center lg:text-left">
            <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
              <Tv className="h-3 w-3" /> Type
            </p>
            <p className="font-medium text-foreground">{type}</p>
          </div>
        )}
        {!isMovie && numberOfEpisodes && (
          <div className="text-center lg:text-left">
            <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
              <Clapperboard className="h-3 w-3" /> Episodes
            </p>
            <p className="font-medium text-foreground">{numberOfEpisodes}</p>
          </div>
        )}
        {!isMovie && networks && networks.length > 0 && (
          <div className="text-center lg:text-left">
            <p className="text-muted-foreground text-[10px] sm:text-xs flex items-center justify-center lg:justify-start gap-1">
              <Tv className="h-3 w-3" /> Network
            </p>
            <p className="font-medium text-foreground truncate">{networks[0].name}</p>
          </div>
        )}
      </div>
    </div>
  )
}
