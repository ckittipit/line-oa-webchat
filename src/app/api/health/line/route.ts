import { HTTPFetchError } from "@line/bot-sdk"
import { getLineClient } from "@/lib/line/client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const preferredRegion = "sin1"

export async function GET() {
    try {
        const bot = await getLineClient().getBotInfo()

        return Response.json({
            status: "ok",
            line: {
                connected: true,
                displayName: bot.displayName,
                basicId: bot.basicId,
            },
        })
    } catch (error) {
        if (error instanceof HTTPFetchError) {
            console.error("LINE health check failed", {
                status: error.status,
                requestId: error.headers.get("x-line-request-id"),
            })
        } else {
            console.error("LINE health check failed", error)
        }

        return Response.json(
            {
                status: "error",
                line: {
                    connected: false,
                },
            },
            {
                status: 503,
            },
        )
    }
}
