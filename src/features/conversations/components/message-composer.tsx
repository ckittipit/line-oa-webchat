"use client"

import { LoaderCircle, Send } from "lucide-react"
import { type FormEvent, type KeyboardEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type MessageComposerProps = {
    disabled?: boolean
    onSend: (text: string) => Promise<void>
}

export function MessageComposer({
    disabled = false,
    onSend,
}: MessageComposerProps) {
    const [text, setText] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const trimmedText = text.trim()
    const canSend = !disabled && !isSending && trimmedText.length > 0

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!canSend) return

        setIsSending(true)
        setError(null)

        try {
            await onSend(trimmedText)
            setText("")
        } catch (sendError) {
            setError(
                sendError instanceof Error
                    ? sendError.message
                    : "Unable to send message",
            )
        } finally {
            setIsSending(false)
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (
            event.key !== "Enter" ||
            event.shiftKey ||
            event.nativeEvent.isComposing
        )
            return

        event.preventDefault()
        event.currentTarget.form?.requestSubmit()
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="border-t border-neutral-200 bg-white px-4 py-3 sm:px-6"
        >
            <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                    <Textarea
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={5000}
                        disabled={disabled || isSending}
                        aria-label="Message"
                        aria-describedby={
                            error ? "message-sent-error" : undefined
                        }
                        placeholder="Type a message...."
                        rows={1}
                        className="max-h-36 min-h-11 resize-none rounded-xl border-neutral-300 bg-neutral-50 px-4 py-3"
                    />

                    <div className="mt-1 flex min-h-5 items-center justify-between gap-3 px-1">
                        <p
                            id="message-send-error"
                            role="alert"
                            className="text-xs text-red-500"
                        >
                            {error}
                        </p>

                        {text.length >= 4500 && (
                            <p className="shrink-0 text-xs text-neutral-400">
                                {text.length}/5000
                            </p>
                        )}
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send message"
                    className="size-11 shrink-0 rounded-xl bg-[#06c755] p-0 text-white hover:bg-[#05b34c]"
                >
                    {isSending ? (
                        <LoaderCircle className="size-5 animate-spin" />
                    ) : (
                        <Send className="size-5" />
                    )}
                </Button>
            </div>

            <p className="px-1 text-xs text-neutral-400">
                Enter to send · Shift + Enter for a new line
            </p>
        </form>
    )
}
