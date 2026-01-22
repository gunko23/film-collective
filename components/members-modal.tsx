"use client"

import Link from "next/link"
import { Crown, Shield, UserIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Member = {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  role: string
  joined_at: string
}

type Props = {
  members: Member[]
  open: boolean
  onClose: () => void
  collectiveId?: string
}

export function MembersModal({ members, open, onClose }: Props) {
  if (!open) return null

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-amber-500" />
      case "admin":
        return <Shield className="h-4 w-4 text-accent" />
      default:
        return <UserIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Owner"
      case "admin":
        return "Admin"
      default:
        return "Member"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Members ({members.length})</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-4">
          <div className="space-y-3">
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/user/${member.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url || "/placeholder.svg"}
                    alt={member.name || "Member"}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-emerald-500/30 transition-all"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 ring-2 ring-transparent group-hover:ring-emerald-500/30 transition-all">
                    <span className="text-sm font-semibold text-accent">
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-emerald-400 transition-colors">
                    {member.name || member.email}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {getRoleIcon(member.role)}
                    <span>{getRoleLabel(member.role)}</span>
                    <span>•</span>
                    <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
