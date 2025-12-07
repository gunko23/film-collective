import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MessageSquare, List, Film, User, Calendar } from "lucide-react"
import { getImageUrl } from "@/lib/tmdb/image"
import { PostComments } from "@/components/post-comments"
import Header from "@/components/header"

export default async function PostDetailPage({ params }: { params: Promise<{ id: string; postId: string }> }) {
  const { id: collectiveId, postId } = await params

  // Fetch post with user info
  const posts = await sql`
    SELECT 
      p.*,
      u.name as user_name,
      u.avatar_url as user_avatar,
      c.name as collective_name
    FROM collective_posts p
    JOIN users u ON u.id = p.user_id
    JOIN collectives c ON c.id = p.collective_id
    WHERE p.id = ${postId}
  `

  if (posts.length === 0) {
    notFound()
  }

  const post = posts[0]

  // Fetch movie list items if applicable
  let movieListItems: any[] = []
  if (post.post_type === "movie_list") {
    movieListItems = await sql`
      SELECT * FROM post_movie_list_items
      WHERE post_id = ${postId}
      ORDER BY position ASC
    `
  }

  // Fetch initial comments
  const comments = await sql`
    SELECT 
      c.*,
      u.name as user_name,
      u.avatar_url as user_avatar
    FROM post_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ${postId}
    ORDER BY c.created_at ASC
  `

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href={`/collectives/${collectiveId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {post.collective_name}
        </Link>

        {/* Post Header */}
        <div className="bg-card/30 border border-border/50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              {post.post_type === "movie_list" ? (
                <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <List className="h-6 w-6 text-accent" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {post.user_avatar ? (
                    <img src={post.user_avatar || "/placeholder.svg"} alt="" className="h-5 w-5 rounded-full" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  {post.user_name || "Anonymous"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.created_at)}
                </span>
                {post.post_type === "movie_list" && (
                  <span className="bg-accent/20 text-accent px-2 py-0.5 rounded-full text-xs">
                    {movieListItems.length} films
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Post Content */}
          {post.content && <p className="text-foreground/80 whitespace-pre-wrap">{post.content}</p>}
        </div>

        {/* Movie List */}
        {post.post_type === "movie_list" && movieListItems.length > 0 && (
          <div className="bg-card/30 border border-border/50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Movies in this list</h2>
            <div className="space-y-3">
              {movieListItems.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/movies/${item.tmdb_id}`}
                  className="flex items-center gap-4 p-3 bg-background/50 hover:bg-accent/10 border border-border/30 hover:border-accent/30 rounded-lg transition-all"
                >
                  <span className="text-2xl font-bold text-accent w-8 text-center">{index + 1}</span>
                  {item.poster_path ? (
                    <img
                      src={getImageUrl(item.poster_path, "w92") || "/placeholder.svg"}
                      alt=""
                      className="w-12 h-18 object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-12 h-18 bg-muted rounded-md flex items-center justify-center">
                      <Film className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.release_date ? new Date(item.release_date).getFullYear() : "N/A"}
                    </p>
                    {item.note && <p className="text-sm text-foreground/60 mt-1 italic">"{item.note}"</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="bg-card/30 border border-border/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Comments ({comments.length})</h2>
          <PostComments collectiveId={collectiveId} postId={postId} initialComments={comments} />
        </div>
      </main>
    </div>
  )
}
