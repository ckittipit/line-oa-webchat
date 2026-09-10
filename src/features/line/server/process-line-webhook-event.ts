import "server-only"
import { HTTPFetchError, type webhook } from "@line/bot-sdk"
import { MessageDirection, MessageStatus } from "@/generated/prisma/client"
import { db } from "@/lib/db"
import { getLineClient } from "@/lib/line/client"

async function getLineUserProfile(userId: string) {
    try {
        return await getLineClient().getProfile(userId)
    } catch (error) {
        if (error instanceof HTTPFetchError) {
            console.warn("Unable to load LINE user profile: ", {
                status: error.status,
                requestId: error.headers.get("x-line-request-id"),
            })
        } else {
            console.warn("Unable to load LINE user profile")
        }

        return null
    }
}

export async function processLineWebhookEvent(event: webhook.Event) {
    if (
        event.type !== "message" ||
        event.message.type !== "text" ||
        event.source?.type !== "user"
    ) {
        return "ignored" as const
    }

    const userId = event.source.userId
    if (!userId) return "ignored" as const

    const lineMessageId = event.message.id
    const messageText = event.message.text
    const webhookEventId = event.webhookEventId
    const occurredAt = new Date(event.timestamp)
    const profile = await getLineUserProfile(userId)

    await db.$transaction(async (transaction) => {
        const profileData = profile
            ? {
                  displayName: profile.displayName,
                  pictureUrl: profile.pictureUrl ?? null,
              }
            : {}

        const contact = await transaction.lineUser.upsert({
            where: {
                lineUserId: userId,
            },
            update: profileData,
            create: {
                lineUserId: userId,
                ...profileData,
            },
        })

        await transaction.message.upsert({
            where: {
                lineMessageId: lineMessageId,
            },
            update: {},
            create: {
                lineMessageId,
                webhookEventId,
                contactId: contact.id,
                direction: MessageDirection.INBOUND,
                status: MessageStatus.RECEIVED,
                text: messageText,
                occurredAt,
            },
        })

        const latestMessage = await transaction.message.aggregate({
            where: {
                contactId: contact.id,
            },
            _max: {
                occurredAt: true,
            },
        })

        await transaction.lineUser.update({
            where: {
                id: contact.id,
            },
            data: {
                lastMessageAt: latestMessage._max.occurredAt,
            },
        })
    })

    return "processed" as const
}
