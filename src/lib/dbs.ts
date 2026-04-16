import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
    errorFormat: "minimal",
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

const shutdown = async (signal: string) => {
    console.log(`\n[DB] 🛑 ${signal} received - Shutting down...`);
    try {
        await prisma.$disconnect();
        console.log("[DB] ✅ Disconnected");
    } catch (error) {
        console.error("[DB] ❌ Error:", error);
    }
    process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));