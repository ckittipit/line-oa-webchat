"use client"

import { MessageSquareText, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// import { fetchConversationDetail } from "../client/conversation-api"
import {
    fetchConversationDetail,
    sendConversationReply,
} from "../client/conversation-api"
import type { ConversationDetail, ConversationSummary } from "../types"
import { MessageThread } from "./message-thread"
import { MessageComposer } from "./message-composer"

type ConversationWorkspaceProps = {
    initialConversations: ConversationSummary[]
}

function getInitial(displayName: string | null) {
    return displayName?.trim().charAt(0).toUpperCase() || "?"
}

function formatMessageTime(value: string | null) {
    if (!value) return ""

    return new Intl.DateTimeFormat("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
    }).format(new Date(value))
}

export function ConversationWorkspace({
    initialConversations,
}: ConversationWorkspaceProps) {
    const [conversations, setConversations] = useState(initialConversations)
    const [isConversationOpen, setIsConversationOpen] = useState(false)
    const [selectedContactId, setSelectedContactId] = useState<string | null>(
        initialConversations.at(0)?.id ?? null,
    )
    const [conversation, setConversation] = useState<ConversationDetail | null>(
        null,
    )
    const [isLoading, setIsLoading] = useState(initialConversations.length > 0)
    const [error, setError] = useState<string | null>(null)

    const selectedConversation = conversations.find(
        (item) => item.id === selectedContactId,
    )

    const selectedContact =
        conversation?.contact ?? selectedConversation ?? null

    function handleSelectContact(contactId: string) {
        setIsConversationOpen(true)

        if (contactId === selectedContactId) return

        setSelectedContactId(contactId)
        setConversation(null)
        setIsLoading(true)
        setError(null)
    }

    async function handleSendMessage(text: string) {
        if (!selectedContactId) return

        const contactId = selectedContactId

        try {
            const message = await sendConversationReply(contactId, text)

            setConversation((currentConversation) => {
                if (
                    !currentConversation ||
                    currentConversation.contact.id !== contactId
                )
                    return currentConversation

                return {
                    ...currentConversation,
                    contact: {
                        ...currentConversation.contact,
                        lastMessageAt: message.occurredAt,
                    },
                    messages: [...currentConversation.messages, message],
                }
            })

            setConversations((currentConversations) => {
                const currentSummary = currentConversations.find(
                    (item) => item.id === contactId,
                )

                if (!currentSummary) return currentConversations

                const updatedSummary: ConversationSummary = {
                    ...currentSummary,
                    lastMessageAt: message.occurredAt,
                    latestMessage: message,
                }

                return [
                    updatedSummary,
                    ...currentConversations.filter(
                        (item) => item.id !== contactId,
                    ),
                ]
            })
        } catch (sendError) {
            try {
                const refreshedConversation =
                    await fetchConversationDetail(contactId)

                setConversation((currentConversation) =>
                    currentConversation?.contact.id === contactId
                        ? refreshedConversation
                        : currentConversation,
                )
            } catch (refreshError) {
                console.error(
                    "Failed to refresh conversation after error",
                    refreshError,
                )
            }

            throw sendError
        }
    }

    useEffect(() => {
        if (!selectedContactId) return

        const controller = new AbortController()

        fetchConversationDetail(selectedContactId, controller.signal)
            .then((data) => {
                setConversation(data)
            })
            .catch((requestError: unknown) => {
                if (
                    requestError instanceof DOMException &&
                    requestError.name === "AbortError"
                ) {
                    return
                }

                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Unable to load conversation",
                )
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            })

        return () => {
            controller.abort()
        }
    }, [selectedContactId])

    return (
        <main className="h-dvh bg-neutral-100 md:p-6">
            <div className="mx-auto flex h-dvh max-w-7xl overflow-hidden bg-white md:h-[calc(100dvh-3rem)] md:rounded-2xl md:border md:border-neutral-200 md:shadow-sm">
                <aside
                    className={cn(
                        "min-h-0 w-full flex-col border-r border-neutral-200 md:flex md:w-96",
                        isConversationOpen ? "hidden" : "flex",
                    )}
                >
                    <header className="border-b border-neutral-200 px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[#06C755] text-white">
                                <MessageSquareText className="size-5" />
                            </div>

                            <div>
                                <h1 className="font-semibold text-neutral-950">
                                    LINE Webchat
                                </h1>
                                <p className="text-sm text-neutral-500">
                                    Assignment
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="border-b border-neutral-200 px-5 py-3">
                        <p className="text-sm font-medium text-neutral-900">
                            Conversations
                        </p>
                        <p className="text-xs text-neutral-500">
                            {conversations.length} contacts
                        </p>
                    </div>

                    <div className="min-h-0 flex-1 divide-y divide-neutral-100 overflow-y-auto">
                        {conversations.map((item) => {
                            const isSelected = item.id === selectedContactId

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => handleSelectContact(item.id)}
                                    className={cn(
                                        "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-neutral-50",
                                        isSelected &&
                                            "bg-green-50 hover:bg-green-50",
                                    )}
                                >
                                    <Avatar className="size-11">
                                        <AvatarImage
                                            src={item.pictureUrl ?? undefined}
                                            alt={
                                                item.displayName ?? "LINE user"
                                            }
                                        />
                                        <AvatarFallback>
                                            {getInitial(item.displayName)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate text-sm font-medium text-neutral-950">
                                                {item.displayName ??
                                                    "Unknown LINE user"}
                                            </p>

                                            <time className="shrink-0 text-xs text-neutral-400">
                                                {formatMessageTime(
                                                    item.lastMessageAt,
                                                )}
                                            </time>
                                        </div>

                                        <p className="mt-1 truncate text-sm text-neutral-500">
                                            {item.latestMessage?.text ??
                                                "No messages yet"}
                                        </p>
                                    </div>
                                </button>
                            )
                        })}

                        {conversations.length === 0 && (
                            <div className="px-6 py-16 text-center">
                                <p className="text-sm font-medium text-neutral-900">
                                    No conversations
                                </p>
                                <p className="mt-1 text-sm text-neutral-500">
                                    New LINE messages will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                </aside>

                <section
                    className={cn(
                        "min-h-0 min-w-0 flex-1 flex-col md:flex",
                        isConversationOpen ? "flex" : "hidden",
                    )}
                >
                    {selectedContact ? (
                        <>
                            <header className="flex h-[73px] shrink-0 items-center gap-3 border-b border-neutral-200 px-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label="Back to conversations"
                                    onClick={() => setIsConversationOpen(false)}
                                    className="-ml-2 size-9 shrink-0 rounded-full p-0 md:hidden"
                                >
                                    <ArrowLeft className="size-5" />
                                </Button>
                                <Avatar className="size-10">
                                    <AvatarImage
                                        src={
                                            selectedContact.pictureUrl ??
                                            undefined
                                        }
                                        alt={
                                            selectedContact.displayName ??
                                            "LINE user"
                                        }
                                    />
                                    <AvatarFallback>
                                        {getInitial(
                                            selectedContact.displayName,
                                        )}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0">
                                    <h2 className="truncate font-semibold text-neutral-950">
                                        {selectedContact.displayName ??
                                            "Unknown LINE user"}
                                    </h2>
                                    <p className="text-xs text-[#06A847]">
                                        LINE contact
                                    </p>
                                </div>
                            </header>

                            <MessageThread
                                messages={conversation?.messages ?? []}
                                isLoading={isLoading}
                                error={error}
                            />

                            <MessageComposer
                                disabled={
                                    isLoading || Boolean(error) || !conversation
                                }
                                onSend={handleSendMessage}
                            />
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center bg-neutral-50">
                            <div className="max-w-sm px-6 text-center">
                                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-green-100 text-[#06C755]">
                                    <MessageSquareText className="size-7" />
                                </div>

                                <h2 className="mt-4 font-semibold text-neutral-950">
                                    Select a conversation
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-neutral-500">
                                    Choose a LINE contact to view message
                                    history.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
