import { listConversationSummaries } from "@/features/conversations/server/conversation.repository"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const preferredRegion = "sin1"

export async function GET() {
    try {
        const conversations = await listConversationSummaries()

        return Response.json({
            data: conversations,
        })
    } catch (error) {
        console.error("Failed to list conversations: ", error)

        return Response.json(
            {
                error: {
                    code: "CONVERSATIONS_FETCH_FAILED",
                    message: "Unable to load conversations",
                },
            },
            {
                status: 500,
            },
        )
    }
}
