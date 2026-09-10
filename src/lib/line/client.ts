import "server-only"
import { LineBotClient } from "@line/bot-sdk"
import { getLineEnv } from "@/lib/env/server"

let client: LineBotClient | undefined

export function getLineClient() {
    if (client) return client

    const { LINE_CHANNEL_ACCESS_TOKEN } = getLineEnv()

    client = LineBotClient.fromChannelAccessToken({
        channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
    })

    return client
}
