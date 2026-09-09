import "server-only"
import type { Prisma } from "@/generated/prisma/client"
import { db } from "@/lib/db"

const conversationSummarySelect = {
    id: true,
    displayName: true,
    pictureUrl: true,
    lastMessageAt: true,
    messages: {
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        take: 1,
        select: {
            id: true,
            text: true,
            direction: true,
            status: true,
            occurredAt: true,
        },
    },
} satisfies Prisma.LineUserSelect

export async function listConversationSummaries() {
    const contacts = await db.lineUser.findMany({
        orderBy: [
            {
                lastMessageAt: {
                    sort: "desc",
                    nulls: "last",
                },
            },
            {
                createdAt: "desc",
            },
        ],
        select: conversationSummarySelect,
    })

    return contacts.map(({ messages, ...contact }) => ({
        ...contact,
        latestMessage: messages[0] ?? null,
    }))
}

const conversationMessageSelect = {
    id: true,
    text: true,
    direction: true,
    status: true,
    occurredAt: true,
} satisfies Prisma.MessageSelect

type ListConversationMessageInput = {
    contactId: string
    cursor?: string
    limit: number
}

export async function getConversationMessages({
    contactId,
    cursor,
    limit,
}: ListConversationMessageInput) {
    const contact = await db.lineUser.findUnique({
        where: {
            id: contactId,
        },
        select: {
            id: true,
            displayName: true,
            pictureUrl: true,
            lastMessageAt: true,
        },
    })

    if (!contact) return null

    const records = await db.message.findMany({
        where: {
            contactId,
        },
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor
            ? {
                  cursor: {
                      id: cursor,
                  },
                  skip: 1,
              }
            : {}),
        select: conversationMessageSelect,
    })

    const hasMore = records.length > limit
    const messages = records.slice(0, limit)
    const nextCursor = hasMore ? (messages.at(-1)?.id ?? null) : null

    return {
        contact,
        messages: messages.reverse(),
        nextCursor,
    }
}
