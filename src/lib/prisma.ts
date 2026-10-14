// Client Prisma en singleton (évite de multiplier les connexions en développement).
// Prisma 7 utilise un "driver adapter" : ici better-sqlite3 pour la base locale SQLite.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Le chemin de la base provient de DATABASE_URL ("file:./dev.db").
const url = process.env.DATABASE_URL ?? "file:./dev.db";

function createClient(): PrismaClient {
  if (/^postgres(ql)?:/.test(url)) {
    const adapter = new PrismaPg({ connectionString: url, max: 2, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 });
    return new PrismaClient({ adapter });
  }
  if (process.env.VERCEL) {
    throw new Error("Vercel exige une DATABASE_URL PostgreSQL distante.");
  }
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
