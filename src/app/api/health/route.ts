import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const preferredRegion = "sin1"

export async function GET() {
    try {
        await db.$queryRaw`SELECT 1`

        return Response.json({
            status: "ok",
            database: "connected",
        })
    } catch (error) {
        console.error("Database health check failed:", error)

        return Response.json(
            {
                status: "error",
                database: "disconnected",
            },
            {
                status: 503,
            },
        )
    }
}
