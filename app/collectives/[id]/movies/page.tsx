import { notFound } from "next/navigation"
import { getCollective, getCollectiveRatedMovies } from "@/lib/collectives/collective-service"
import { CollectiveMoviesClient } from "@/components/collective-movies-client"

type Props = {
  params: Promise<{ id: string }>
}

export default async function CollectiveMoviesPage({ params }: Props) {
  const { id: collectiveId } = await params

  const collective = await getCollective(collectiveId)

  if (!collective) {
    notFound()
  }

  const movies = await getCollectiveRatedMovies(collectiveId)

  return (
    <CollectiveMoviesClient
      collectiveId={collectiveId}
      collectiveName={collective.name}
      movies={movies.map((m: any) => ({
        tmdb_id: m.tmdb_id,
        title: m.title,
        poster_path: m.poster_path,
        release_date: m.release_date,
        avg_score: Number(m.avg_score),
        rating_count: Number(m.rating_count),
      }))}
    />
  )
}
