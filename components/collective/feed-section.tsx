"use client"

import type React from "react"
import { Film, ChevronLeft, ChevronRight } from "lucide-react"
import { DashboardActivityItem, type Activity } from "@/components/dashboard/dashboard-activity-item"

type FeedSectionProps = {
  activities: Activity[]
  feedLoading: boolean
  feedTotal: number
  feedPage: number
  totalFeedPages: number
  setFeedPage: React.Dispatch<React.SetStateAction<number>>
}

export function FeedSection({
  activities,
  feedLoading,
  feedTotal,
  feedPage,
  totalFeedPages,
  setFeedPage,
}: FeedSectionProps) {
  return (
    <div className="mb-8 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Activity Feed</h2>
        <p className="text-sm text-muted-foreground">
          {feedTotal} activit{feedTotal !== 1 ? "ies" : "y"} from collective members
        </p>
      </div>

      {feedLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 border border-border/50 rounded-xl bg-card/30">
          <Film className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No activity yet</p>
          <p className="text-sm text-muted-foreground/70">Be the first to rate something!</p>
        </div>
      ) : (
        <>
          <div>
            {activities.map((activity, i) => (
              <DashboardActivityItem
                key={`${activity.activity_type}-${activity.activity_id}-${i}`}
                activity={activity}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalFeedPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setFeedPage((p) => Math.max(0, p - 1))}
                disabled={feedPage === 0}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border/50 hover:border-accent/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {feedPage + 1} of {totalFeedPages}
              </span>
              <button
                onClick={() => setFeedPage((p) => Math.min(totalFeedPages - 1, p + 1))}
                disabled={feedPage >= totalFeedPages - 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border/50 hover:border-accent/50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
