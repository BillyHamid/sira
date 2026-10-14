import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { authSecret } from "./auth-config";
import { prisma } from "./prisma";

function signature(sessionId: string, responseId: string) {
  return createHmac("sha256", authSecret()).update(`${sessionId}:${responseId}`).digest("hex");
}

export async function confirmEvaluation(sessionId: string, responseId: string) {
  const store = await cookies();
  store.set(`eval_complete_${sessionId}`, `${responseId}.${signature(sessionId, responseId)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function hasCompletedEvaluation(sessionId: string): Promise<boolean> {
  const raw = (await cookies()).get(`eval_complete_${sessionId}`)?.value;
  if (!raw) return false;
  const [responseId, token, extra] = raw.split(".");
  if (!responseId || !token || extra || !/^[a-f0-9]{64}$/.test(token)) return false;
  if (!timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(signature(sessionId, responseId), "hex"))) return false;
  return !!(await prisma.response.findFirst({ where: { id: responseId, sessionId }, select: { id: true } }));
}
