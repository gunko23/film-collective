"use client"

import { useState, useEffect } from "react"
import { useUser } from "@stackframe/stack"
import { MessageSquare, List, Plus, ChevronRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreatePostModal } from "@/components/create-post-modal"
import Link from "next/link"

type Post = {
  id: string
  title: string
  content: string | null
  post_type: "discussion" | "movie_list"
  created_at: string
  user_name: string | null
  user_avatar: string | null
  comment_count: number
  movie_count: number
}

type Props = {
  collectiveId: string
}

export function MessageBoard({ collectiveId }: Props) {
  const user = useUser()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/posts?page=${page}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [collectiveId, page])

  const handlePostCreated = () => {
    setShowCreateModal(false)
    setPage(1)
    fetchPosts()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Message Board</h2>
        {user && (
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Post
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card/50 rounded-lg p-4 animate-pulse">
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-card/30 border border-border/50 rounded-lg p-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No posts yet. Start a conversation!</p>
          {user && (
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="outline"
              className="border-accent/50 text-accent hover:bg-accent/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create First Post
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/collectives/${collectiveId}/posts/${post.id}`}
              className="block bg-card/30 hover:bg-card/50 border border-border/50 hover:border-accent/30 rounded-lg p-4 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {post.post_type === "movie_list" ? (
                    <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <List className="h-5 w-5 text-accent" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate">{post.title}</h3>
                    {post.post_type === "movie_list" && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex-shrink-0">
                        {post.movie_count} films
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {post.user_avatar ? (
                        <img src={post.user_avatar || "/placeholder.svg"} alt="" className="h-4 w-4 rounded-full" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {post.user_name || "Anonymous"}
                    </span>
                    <span>{formatDate(post.created_at)}</span>
                    <span>{post.comment_count} comments</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
              </div>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <CreatePostModal
        collectiveId={collectiveId}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePostCreated}
      />
    </div>
  )
}
