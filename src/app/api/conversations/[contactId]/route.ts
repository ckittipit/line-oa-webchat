import { z } from "zod"
import { getConversationMessages } from "@/features/conversations/server/conversation.repository"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const preferredRegion = "sin1"

const requestSchema = z.object({
    contactId: z.cuid(),
    cursor: z.cuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
})

type RouteContext = {
    params: Promise<{
        contactId: string
    }>
}

export async function GET(request: Request, context: RouteContext) {
    try {
        const params = await context.params
        const url = new URL(request.url)
        const parsedRequest = requestSchema.safeParse({
            contactId: params.contactId,
            cursor: url.searchParams.get("cursor") ?? undefined,
            limit: url.searchParams.get("limit") ?? undefined,
        })

        if (!parsedRequest.success) {
            return Response.json(
                {
                    error: {
                        code: "INVALID_CONVERSATION_REQUEST",
                        message: "Invalid conversation request",
                    },
                },
                {
                    status: 400,
                },
            )
        }

        const conversation = await getConversationMessages(parsedRequest.data)

        if (!conversation) {
            return Response.json(
                {
                    error: {
                        code: "CONVERSATION_NOT_FOUND",
                        message: "Conversation not found",
                    },
                },
                { status: 404 },
            )
        }

        return Response.json({
            data: conversation,
        })
    } catch (error) {
        console.error("Failed to load conversation: ", error)

        return Response.json(
            {
                error: {
                    code: "CONVERSATION_FETCH_FAILED",
                    message: "Unable to load conversation",
                },
            },
            {
                status: 500,
            },
        )
    }
}
