import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import {
    MessageDirection,
    MessageStatus,
    PrismaClient,
} from "../src/generated/prisma/client"

const directUrl = process.env.DIRECT_URL

if (!directUrl) throw new Error("DIRECT_URL i s not configured")

const adapter = new PrismaPg({
    connectionString: directUrl,
})

const db = new PrismaClient({
    adapter,
})

const now = new Date()
const minutesAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * 60_000)

const contacts = [
    {
        lineUserId: "U1111",
        displayName: "ทด",
        pictureUrl: null,
        messages: [
            {
                lineMessageId: "seed-message-001",
                webhookEventId: "seed-event-001",
                direction: MessageDirection.INBOUND,
                status: MessageStatus.RECEIVED,
                text: "ทดสอบ1จั๊บ",
                occurredAt: minutesAgo(30),
            },
            {
                lineMessageId: "seed-message-002",
                webhookEventId: null,
                direction: MessageDirection.OUTBOUND,
                status: MessageStatus.SENT,
                text: "ทดสอบ2จั้บ",
                occurredAt: minutesAgo(28),
            },
            {
                lineMessageId: "seed-message-003",
                webhookEventId: "seed-event-003",
                direction: MessageDirection.INBOUND,
                status: MessageStatus.RECEIVED,
                text: "ทดสอบ3จั๊บ",
                occurredAt: minutesAgo(25),
            },
        ],
    },
    {
        lineUserId: "U2222",
        displayName: "สอบ",
        pictureUrl: null,
        messages: [
            {
                lineMessageId: "seed-message-004",
                webhookEventId: "seed-event-004",
                direction: MessageDirection.INBOUND,
                status: MessageStatus.RECEIVED,
                text: "test1",
                occurredAt: minutesAgo(12),
            },
            {
                lineMessageId: "seed-message-005",
                webhookEventId: null,
                direction: MessageDirection.OUTBOUND,
                status: MessageStatus.SENT,
                text: "test2",
                occurredAt: minutesAgo(10),
            },
        ],
    },
]

async function main() {
    for (const contact of contacts) {
        const lastMessageAt = contact.messages.at(-1)?.occurredAt ?? null
        const savedContact = await db.lineUser.upsert({
            where: {
                lineUserId: contact.lineUserId,
            },
            update: {
                displayName: contact.displayName,
                pictureUrl: contact.pictureUrl,
                lastMessageAt,
            },
            create: {
                lineUserId: contact.lineUserId,
                displayName: contact.displayName,
                pictureUrl: contact.pictureUrl,
                lastMessageAt,
            },
        })

        for (const message of contact.messages) {
            await db.message.upsert({
                where: {
                    lineMessageId: message.lineMessageId,
                },
                update: {
                    ...message,
                    contactId: savedContact.id,
                },
                create: {
                    ...message,
                    contactId: savedContact.id,
                },
            })
        }
    }

    console.log("seed 2 conversation, 5 messages")
}

main()
    .catch((error) => {
        console.error("database seed failed: ", error)
        process.exitCode = 1
    })
    .finally(async () => {
        await db.$disconnect
    })
