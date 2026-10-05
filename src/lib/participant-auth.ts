// Authentification des participants à l'espace attestation.
// Même esprit que src/lib/auth.ts (admin) : pas de stockage de mot de passe en clair,
// jetons dérivés en SHA-256 salés avec AUTH_SECRET, cookies httpOnly.
import { cookies } from "next/headers";
import { createHash } from "crypto";

function authSecret(): string {
  return process.env.AUTH_SECRET ?? "change-me-secret";
}

// --- Hachage des mots de passe (temporaire d'attestation + perso participant) ---
// SHA-256 salé. Suffisant pour ce contexte (cohérent avec l'auth admin existante).
export function hashPassword(password: string): string {
  return createHash("sha256")
    .update(`${password}::${authSecret()}`)
    .digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ============================== SESSION PARTICIPANT ==============================
// Cookie d'identité : jeton dérivé de l'id du compte (pas l'id en clair seul).

const SESSION_COOKIE = "att_session";

function accountToken(accountId: string): string {
  return createHash("sha256")
    .update(`${accountId}::${authSecret()}`)
    .digest("hex");
}

export async function createParticipantSession(accountId: string): Promise<void> {
  const store = await cookies();
  // On stocke "id.jeton" : l'id pour retrouver le compte, le jeton pour le valider.
  store.set(SESSION_COOKIE, `${accountId}.${accountToken(accountId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
}

export async function destroyParticipantSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Renvoie l'id du compte authentifié, ou null si le cookie est absent/invalide.
export async function getParticipantAccountId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const sep = raw.indexOf(".");
  if (sep <= 0) return null;
  const accountId = raw.slice(0, sep);
  const token = raw.slice(sep + 1);
  if (token !== accountToken(accountId)) return null;
  return accountId;
}

// ============================== PORTAIL (mot de passe temporaire) ==============================
// Après avoir saisi le bon mot de passe temporaire, on pose un cookie de "passage"
// propre à la session de formation, requis pour accéder aux écrans inscription/connexion.

function gateCookieName(sessionId: string): string {
  return `att_gate_${sessionId}`;
}

function gateToken(sessionId: string, passwordHash: string): string {
  return createHash("sha256")
    .update(`${sessionId}::${passwordHash}::${authSecret()}`)
    .digest("hex");
}

export async function createGatePass(
  sessionId: string,
  passwordHash: string
): Promise<void> {
  const store = await cookies();
  store.set(gateCookieName(sessionId), gateToken(sessionId, passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 heures
  });
}

// Le passage reste lié au passwordHash courant : si l'admin change le mot de passe
// temporaire, les anciens cookies de passage deviennent invalides.
export async function hasGatePass(
  sessionId: string,
  passwordHash: string
): Promise<boolean> {
  const store = await cookies();
  const token = store.get(gateCookieName(sessionId))?.value;
  return token === gateToken(sessionId, passwordHash);
}
