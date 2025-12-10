import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { CollectiveMoviesClient } from "@/components/collective-movies-client"

type Props = {
  params: Promise<{ id: string }>
}

export default async function CollectiveMoviesPage({ params }: Props) {
  const { id: collectiveId } = await params

  // Fetch collective info
  const collectiveResult = await sql`
    SELECT id, name FROM collectives WHERE id = ${collectiveId}::uuid
  `

  if (collectiveResult.length === 0) {
    notFound()
  }

  const collective = collectiveResult[0]

  // Fetch all movies rated by collective members, ordered by highest rating
  const movies = await sql`
    SELECT 
      m.tmdb_id,
      m.title,
      m.poster_path,
      m.release_date,
      AVG(umr.overall_score) as avg_score,
      COUNT(umr.id) as rating_count
    FROM user_movie_ratings umr
    JOIN movies m ON m.id = umr.movie_id
    JOIN collective_memberships cm ON cm.user_id = umr.user_id
    WHERE cm.collective_id = ${collectiveId}::uuid
    GROUP BY m.tmdb_id, m.title, m.poster_path, m.release_date
    ORDER BY avg_score DESC, rating_count DESC
  `

  return (
    <CollectiveMoviesClient
      collectiveId={collectiveId}
      collectiveName={collective.name}
      movies={movies.map((m) => ({
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
