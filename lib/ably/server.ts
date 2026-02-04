import Ably from "ably"

let ablyClient: Ably.Rest | null = null

function getAblyClient(): Ably.Rest {
  if (!ablyClient) {
    ablyClient = new Ably.Rest({ key: process.env.ABLY_API_KEY! })
  }
  return ablyClient
}

export async function publishToChannel(channelName: string, eventName: string, data: unknown) {
  const client = getAblyClient()
  const channel = client.channels.get(channelName)
  await channel.publish(eventName, data)
}
