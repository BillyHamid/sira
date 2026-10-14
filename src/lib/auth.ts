// Authentification très simple de l'espace admin : un mot de passe partagé.
// Le cookie ne contient pas le mot de passe mais un jeton dérivé (SHA-256).
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { adminPassword, authSecret } from "./auth-config";

const COOKIE_NAME = "admin_session";

// Jeton attendu dans le cookie pour une session authentifiée.
function expectedToken(): string {
  return createHash("sha256")
    .update(`${adminPassword()}::${authSecret()}`)
    .digest("hex");
}

export function checkPassword(password: string): boolean {
  return password === adminPassword();
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token === expectedToken();
}
