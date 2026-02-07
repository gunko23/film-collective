import Image from "next/image"
import { Users } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"

interface CastMember {
  id: number
  name: string
  character: string
  profile_path?: string
  profilePath?: string
}

interface CastCarouselProps {
  cast: CastMember[]
}

export function CastCarousel({ cast }: CastCarouselProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
        Cast
      </h2>
      <div className="relative -mx-4 sm:mx-0">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
          {cast.slice(0, 10).map((actor: any) => (
            <div key={actor.id} className="flex-shrink-0 w-14 sm:w-20 text-center">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-1 sm:mb-2 rounded-full overflow-hidden bg-card ring-1 ring-border/50">
                {actor.profilePath || actor.profile_path ? (
                  <Image
                    src={getImageUrl(actor.profilePath || actor.profile_path, "w185") || ""}
                    alt={actor.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Users className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-foreground truncate">{actor.name}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{actor.character}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
