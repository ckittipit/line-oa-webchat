export type ConversationMessageDirection = "INBOUND" | "OUTBOUND"

export type ConversationMessageStatus =
    "RECEIVED" | "PENDING" | "SENT" | "FAILED"

export type ConversationMessage = {
    id: string
    text: string
    direction: ConversationMessageDirection
    status: ConversationMessageStatus
    occurredAt: string
}

export type ConversationContact = {
    id: string
    displayName: string | null
    pictureUrl: string | null
    lastMessageAt: string | null
}

export type ConversationSummary = ConversationContact & {
    latestMessage: ConversationMessage | null
}

export type ConversationDetail = {
    contact: ConversationContact
    messages: ConversationMessage[]
    nextCursor: string | null
}

export type ApiDataResponse<T> = {
    data: T
}

export type ApiErrorResponse = {
    error: {
        code: string
        message: string
        messageId?: string
    }
}
