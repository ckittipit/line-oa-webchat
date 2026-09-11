import { ConversationWorkspace } from "@/features/conversations/components/conservation-workspace"
import { listConversationSummaries } from "@/features/conversations/server/conversation.repository"
import type { ConversationSummary } from "@/features/conversations/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const preferredRegion = "sin1"

export default async function Home() {
    const conversations = await listConversationSummaries()
    const initialConversations: ConversationSummary[] = conversations.map(
        (conversation) => ({
            ...conversation,
            lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
            latestMessage: conversation.latestMessage
                ? {
                      ...conversation.latestMessage,
                      occurredAt:
                          conversation.latestMessage.occurredAt.toISOString(),
                  }
                : null,
        }),
    )

    return <ConversationWorkspace initialConversations={initialConversations} />
}
