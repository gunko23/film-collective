import Anthropic from "@anthropic-ai/sdk"

// ── Rate Limiter ──
// Enforces max concurrent calls and minimum spacing between API requests.

const MAX_CONCURRENT = 30
const MIN_INTERVAL_MS = 200 // max ~5 calls/sec

let _client: Anthropic | null = null
let _activeCalls = 0
let _lastCallTime = 0
const _waitQueue: Array<() => void> = []

/**
 * Get the shared Anthropic client (lazy singleton).
 * Returns null if ANTHROPIC_API_KEY is not set.
 */
export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  if (!_client) {
    _client = new Anthropic({ apiKey })
  }
  return _client
}

async function acquireSlot(): Promise<void> {
  if (_activeCalls >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => _waitQueue.push(resolve))
  }
  const now = Date.now()
  const wait = MIN_INTERVAL_MS - (now - _lastCallTime)
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait))
  }
  _activeCalls++
  _lastCallTime = Date.now()
}

function releaseSlot(): void {
  _activeCalls--
  if (_waitQueue.length > 0) {
    _waitQueue.shift()!()
  }
}

/**
 * Rate-limited wrapper around client.messages.create().
 * Enforces max concurrent calls and minimum interval between requests.
 */
export async function rateLimitedCreate(
  params: Anthropic.Messages.MessageCreateParamsNonStreaming
): Promise<Anthropic.Messages.Message> {
  const client = getAnthropicClient()
  if (!client) throw new Error("ANTHROPIC_API_KEY not set")

  await acquireSlot()
  try {
    return await client.messages.create(params)
  } finally {
    releaseSlot()
  }
}
