import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

export type SyncLogEntry = {
  id: string
  syncType: string
  status: string
  startedAt: Date | string
  completedAt?: Date | string | null
  itemsProcessed?: number | null
  totalItems?: number | null
  errorMessage?: string | null
}
