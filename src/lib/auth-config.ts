// En production, une configuration absente doit fermer les accès.
export function authSecret(): string {
  const value = process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production" &&
      (!value || value === "change-me-secret" || value.length < 32)) {
    throw new Error("AUTH_SECRET doit contenir au moins 32 caractères et être unique en production.");
  }
  return value || "change-me-secret";
}

export function adminPassword(): string {
  const value = process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV === "production" &&
      (!value || value === "box-admin" || value.length < 12)) {
    throw new Error("ADMIN_PASSWORD doit contenir au moins 12 caractères en production.");
  }
  return value || "box-admin";
}
