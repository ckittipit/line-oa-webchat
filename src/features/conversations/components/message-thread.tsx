"use client"
import { CircleAlert, LoaderCircle, MessageSquareOff } from "lucide-react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { ConversationMessage } from "../types"

type MessageThreadProps = {
    messages: ConversationMessage[]
    isLoading: boolean
    error: string | null
}

function formatMessageDate(value: string) {
    return new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
    }).format(new Date(value))
}

function getStatusLabel(message: ConversationMessage) {
    if (message.direction === "INBOUND") return null

    switch (message.status) {
        case "PENDING":
            return "Sending..."
        case "SENT":
            return "Sent"
        case "FAILED":
            return "Failed"
        default:
            return null
    }
}

export function MessageThread({
    messages,
    isLoading,
    error,
}: MessageThreadProps) {
    const threadEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({
            block: "end",
        })
    }, [messages])

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center bg-neutral-50">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading Message...
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-1 items-center justify-center bg-neutral-50 px-6">
                <div className="max-w-sm text-center">
                    <CircleAlert className="mx-auto size-8 text-red-500" />
                    <p className="mt-3 font-medium text-neutral-950">
                        Unable to load messagws
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">{error}</p>
                </div>
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center bg-neutral-50 px-6">
                <div className="text-center">
                    <MessageSquareOff className="mx-auto size-8 text-neutral-400" />
                    <p className="mt-3 font-medium text-neutral-950">
                        No message
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                        Send a message to start conversation.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div
            role="log"
            aria-live="polite"
            className="flex flex-1 flex-col gap-4 overflow-y-auto bg-neutral-50 px-4 py-6 sm:px-6"
        >
            {messages.map((message) => {
                const isOutBound = message.direction === "OUTBOUND"
                const statusLabel = getStatusLabel(message)

                return (
                    <article
                        key={message.id}
                        className={cn(
                            "flex flex-col",
                            isOutBound ? "items-end" : "items-start",
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm",
                                isOutBound
                                    ? "rounded-br-md bg-[#06c755] text-white"
                                    : "rounded-bl-md border border-neutral-200 bgpwhite text-neutral-900",
                                message.status === "FAILED" &&
                                    "bg-red-500 text-white",
                            )}
                        >
                            <p className="whitespace-pre-wrap break-words">
                                {message.text}
                            </p>
                        </div>

                        <div className="mt-1 flex items-center gap-2 px-1 text-xs text-neutral-400">
                            <time dateTime={message.occurredAt}>
                                {formatMessageDate(message.occurredAt)}
                            </time>

                            {statusLabel && (
                                <span
                                    className={cn(
                                        message.status === "FAILED" &&
                                            "text-red-500",
                                    )}
                                >
                                    {statusLabel}
                                </span>
                            )}
                        </div>
                    </article>
                )
            })}

            <div ref={threadEndRef} aria-hidden="true" />
        </div>
    )
}
