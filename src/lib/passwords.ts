import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { authSecret } from "./auth-config";

const deriveKey = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith("scrypt:")) {
    const parts = hash.split(":");
    if (parts.length !== 3 || !/^[a-f0-9]{32}$/.test(parts[1]) ||
        !/^[a-f0-9]{128}$/.test(parts[2])) return false;
    const key = await deriveKey(password, parts[1], 64) as Buffer;
    return timingSafeEqual(key, Buffer.from(parts[2], "hex"));
  }
  // Compatibilité avec les comptes existants, migrés à leur connexion.
  if (!/^[a-f0-9]{64}$/.test(hash)) return false;
  const legacy = createHash("sha256").update(`${password}::${authSecret()}`).digest();
  return timingSafeEqual(legacy, Buffer.from(hash, "hex"));
}
