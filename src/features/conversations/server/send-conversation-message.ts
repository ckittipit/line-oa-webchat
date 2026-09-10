import "server-only"
import { HTTPFetchError } from "@line/bot-sdk"
import { MessageDirection, MessageStatus } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { getLineClient } from "@/lib/line/client"

type SendConversationMessageInput = {
    contactId: string
    text: string
}

export class ConversationNotFoundError extends Error {
    constructor() {
        super("Conversation not found")
        this.name = "ConversationNotFoundError"
    }
}

export class ConversationMessageSendError extends Error {
    constructor(public readonly messageId: string) {
        super("Unable to send LINE message")
        this.name = "ConversationMessageSendError"
    }
}

function getSafeLineErrorMessage(error: unknown) {
    if (error instanceof HTTPFetchError)
        return `LINE API request failed with status ${error.status}`

    return "Unexpected LINE API error"
}

export async function sendConversationMessage({
    contactId,
    text,
}: SendConversationMessageInput) {
    const contact = await db.lineUser.findUnique({
        where: {
            id: contactId,
        },
        select: {
            id: true,
            lineUserId: true,
        },
    })

    if (!contact) throw new ConversationNotFoundError()

    const occurredAt = new Date()
    const pendingMessage = await db.$transaction(async (transaction) => {
        const message = await transaction.message.create({
            data: {
                contactId: contact.id,
                direction: MessageDirection.OUTBOUND,
                status: MessageStatus.PENDING,
                text,
                occurredAt,
            },
            select: {
                id: true,
                text: true,
                direction: true,
                status: true,
                occurredAt: true,
            },
        })

        await transaction.lineUser.update({
            where: {
                id: contact.id,
            },
            data: {
                lastMessageAt: occurredAt,
            },
        })

        return message
    })

    let response

    try {
        response = await getLineClient().pushMessage({
            to: contact.lineUserId,
            messages: [
                {
                    type: "text",
                    text,
                },
            ],
        })
    } catch (error) {
        const errorMessage = getSafeLineErrorMessage(error)

        console.error("Failed to send LINE message: ", {
            contactId,
            messageId: pendingMessage.id,
            errorMessage,
        })

        await db.message.update({
            where: {
                id: pendingMessage.id,
            },
            data: {
                status: MessageStatus.FAILED,
                errorMessage,
            },
        })

        throw new ConversationMessageSendError(pendingMessage.id)
    }

    return db.message.update({
        where: {
            id: pendingMessage.id,
        },
        data: {
            status: MessageStatus.SENT,
            lineMessageId: response.sentMessages.at(0)?.id,
        },
        select: {
            id: true,
            text: true,
            direction: true,
            status: true,
            occurredAt: true,
        },
    })
}
