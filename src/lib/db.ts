import "server-only"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"

function createPrismaClient() {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) throw new Error("DATABASE_URL is not confiqured")

    const adapter = new PrismaPg({
        connectionString: databaseUrl,
    })

    return new PrismaClient({
        adapter,
    })
}

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
