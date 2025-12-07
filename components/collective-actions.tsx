"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Users, Copy, Check, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Props = {
  collectiveId: string
  collectiveName: string
  userRole: string | null
}

export function CollectiveActions({ collectiveId, collectiveName, userRole }: Props) {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const createInvite = async () => {
    setCreatingInvite(true)
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: 7 }),
      })
      if (res.ok) {
        const invite = await res.json()
        setInviteCode(invite.invite_code)
      }
    } catch (err) {
      console.error("Error creating invite:", err)
    } finally {
      setCreatingInvite(false)
    }
  }

  const copyInviteLink = () => {
    if (!inviteCode) return
    const link = `${window.location.origin}/invite/${inviteCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const leaveCollective = async () => {
    if (!confirm("Are you sure you want to leave this collective?")) return
    setLeaving(true)
    try {
      const res = await fetch(`/api/collectives/${collectiveId}/members`, {
        method: "DELETE",
      })
      if (res.ok) {
        router.push("/collectives")
      } else {
        const data = await res.json()
        alert(data.error || "Failed to leave collective")
      }
    } catch (err) {
      console.error("Error leaving collective:", err)
    } finally {
      setLeaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Invite Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-xl bg-transparent">
            <Users className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Invite to {collectiveName}</DialogTitle>
            <DialogDescription>Create an invite link to share with friends</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {!inviteCode ? (
              <Button onClick={createInvite} disabled={creatingInvite} className="w-full">
                {creatingInvite ? "Creating..." : "Generate Invite Link"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode}`}
                    className="flex-1 px-3 py-2 text-sm bg-secondary rounded-lg border border-border"
                  />
                  <Button size="sm" variant="outline" onClick={copyInviteLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">This link expires in 7 days</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {userRole !== "owner" && (
        <Button
          variant="outline"
          className="rounded-xl text-destructive hover:text-destructive bg-transparent"
          onClick={leaveCollective}
          disabled={leaving}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave
        </Button>
      )}
    </div>
  )
}
