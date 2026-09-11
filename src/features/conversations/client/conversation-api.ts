import {
    ApiDataResponse,
    ApiErrorResponse,
    ConversationDetail,
    ConversationMessage,
    ConversationSummary,
} from "../types"

export class ConversationApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        message: string,
        public readonly messageId?: string,
    ) {
        super(message)
        this.name = "ConversationApiError"
    }
}

async function readResponseData<T>(response: Response) {
    let payload: ApiDataResponse<T> | ApiErrorResponse

    try {
        payload = (await response.json()) as
            ApiDataResponse<T> | ApiErrorResponse
    } catch {
        throw new ConversationApiError(
            response.status,
            "INVALID_API_RESPONSE",
            "Server retuen invalid response",
        )
    }

    if (!response.ok) {
        const apiError =
            "error" in payload
                ? payload.error
                : {
                      code: "UNKNOWN_API_ERROR",
                      message: "The request failed",
                  }

        throw new ConversationApiError(
            response.status,
            apiError.code,
            apiError.message,
            apiError.messageId,
        )
    }

    if (!("data" in payload)) {
        throw new ConversationApiError(
            response.status,
            "INVALID_API)RESPONSE",
            "Server does not contains data",
        )
    }

    return payload.data
}

export async function fetchConversationSummaries(signal?: AbortSignal) {
    const response = await fetch("/api/conversations", {
        cache: "no-store",
        signal,
    })

    return readResponseData<ConversationSummary[]>(response)
}

export async function fetchConversationDetail(
    contactId: string,
    signal?: AbortSignal,
) {
    const response = await fetch(
        `/api/conversations/${encodeURIComponent(contactId)}`,
        {
            cache: "no-store",
            signal,
        },
    )

    return readResponseData<ConversationDetail>(response)
}

export async function sendConversationReply(contactId: string, text: string) {
    const response = await fetch(
        `/api/conversations/${encodeURIComponent(contactId)}/messages`,
        {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                text,
            }),
        },
    )

    return readResponseData<ConversationMessage>(response)
}
