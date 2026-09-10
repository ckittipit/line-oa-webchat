import "server-only"
import { z } from "zod"

const databaseEnvSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
})

const lineEnvSchema = z.object({
    LINE_CHANNEL_SECRET: z.string().min(1, "LINE_CHANNEL_SECRET is required"),
    LINE_CHANNEL_ACCESS_TOKEN: z
        .string()
        .min(1, "LINE_CHANNEL_ACCESS_TOKEN is required"),
})

export function getDatabaseEnv() {
    return databaseEnvSchema.parse({
        DATABASE_URL: process.env.DATABASE_URL,
    })
}

export function getLineEnv() {
    return lineEnvSchema.parse({
        LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
        LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    })
}
