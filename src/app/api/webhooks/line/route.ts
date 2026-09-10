import { validateSignature, type webhook } from "@line/bot-sdk"
import { getLineEnv } from "@/lib/env/server"
import { processLineWebhookEvent } from "@/features/line/server/process-line-webhook-event"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const preferredRegion = "sin1"

export async function POST(request: Request) {
    try {
        const signature = request.headers.get("x-line-signature")

        if (!signature) {
            return Response.json(
                {
                    error: {
                        code: "LINE_SIGNATURE_MISSING",
                        message: "Line signature is required",
                    },
                },
                {
                    status: 401,
                },
            )
        }

        const rawBody = await request.text()
        const { LINE_CHANNEL_SECRET } = getLineEnv()
        const isValidSignature = validateSignature(
            rawBody,
            LINE_CHANNEL_SECRET,
            signature,
        )

        if (!isValidSignature) {
            return Response.json(
                {
                    error: {
                        code: "LINE_SIGNATURE_INVALID",
                        message: "Invalid LINE signature",
                    },
                },
                {
                    status: 401,
                },
            )
        }

        let payload: webhook.CallbackRequest

        try {
            payload = JSON.parse(rawBody) as webhook.CallbackRequest
        } catch {
            return Response.json(
                {
                    error: {
                        code: "LINE_PAYLOAD_INVALID",
                        message: "Invalid line webhook payload",
                    },
                },
                {
                    status: 400,
                },
            )
        }

        // console.info("LINE webhook received: ", {
        //     EventCount: payload.events.length,
        // })

        // return Response.json({
        //     success: true,
        // })
        const reaults = await Promise.all(
            payload.events.map(processLineWebhookEvent),
        )
        const processedCount = reaults.filter(
            (result) => result === "processed",
        ).length

        return Response.json({
            success: true,
            processedCount,
            ignoredCount: reaults.length - processedCount,
        })
    } catch (error) {
        console.error("LINE webhook failed: ", error)

        return Response.json(
            {
                error: {
                    code: "LINE_WEBHOOK_FAILED",
                    message: "Unable to process line webhook",
                },
            },
            {
                status: 500,
            },
        )
    }
}
