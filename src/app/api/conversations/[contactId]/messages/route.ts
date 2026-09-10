import {
    ConversationMessageSendError,
    ConversationNotFoundError,
    sendConversationMessage,
} from "@/features/conversations/server/send-conversation-message"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const preferredRegion = "sin1"

const requestSchema = z.object({
    contactId: z.cuid(),
    body: z.object({
        text: z.string().trim().min(1).max(5000),
    }),
})

type RouteContext = {
    params: Promise<{ contactId: string }>
}

export async function POST(request: Request, context: RouteContext) {
    let requestBody: unknown

    try {
        requestBody = await request.json()
    } catch {
        return Response.json(
            {
                error: {
                    code: "INVALID_JSON",
                    message: "Request body must be valid JSON",
                },
            },
            {
                status: 400,
            },
        )
    }

    try {
        const params = await context.params
        const parsedRequest = requestSchema.safeParse({
            contactId: params.contactId,
            body: requestBody,
        })

        if (!parsedRequest.success) {
            return Response.json(
                {
                    error: {
                        code: "INVALID_MESSAGE_REQUEST",
                        message: "Invalid message request",
                    },
                },
                {
                    status: 400,
                },
            )
        }

        const message = await sendConversationMessage({
            contactId: parsedRequest.data.contactId,
            text: parsedRequest.data.body.text,
        })

        return Response.json(
            {
                data: message,
            },
            {
                status: 201,
            },
        )
    } catch (error) {
        if (error instanceof ConversationNotFoundError) {
            return Response.json(
                {
                    error: {
                        code: "CONVERSATION_NOT_FOUND",
                        message: error.message,
                    },
                },
                {
                    status: 404,
                },
            )
        }

        if (error instanceof ConversationMessageSendError) {
            return Response.json(
                {
                    error: {
                        code: "LINE_MESSAGESEND_FAILED",
                        message: error.message,
                        messageId: error.messageId,
                    },
                },
                {
                    status: 502,
                },
            )
        }

        console.error("Failed to create conversation message: ", error)

        return Response.json(
            {
                error: {
                    code: "MESSAGE_CREATE_FAILED",
                    message: "Unable to create message",
                },
            },
            {
                status: 500,
            },
        )
    }
}
