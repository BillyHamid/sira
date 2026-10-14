import os from "node:os";
import { headers } from "next/headers";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
// Cartes réseau virtuelles (VMware, VirtualBox, WSL, Docker…) : injoignables depuis un téléphone.
const VIRTUAL_NIC = /vmware|virtual|vbox|vethernet|wsl|docker|hyper-v|loopback|bluetooth|tailscale|zerotier/i;

function isPrivateIPv4(ip: string): boolean {
  return (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

// Cartes physiques usuelles (Windows, Linux, macOS), à préférer à toute autre.
const PHYSICAL_NIC = /^(wi-?fi|wlan\d*|wireless.*|en\d+|eth\d+|ethernet)$/i;
// Sous-réseau par défaut de VirtualBox Host-Only (la carte s'appelle « Ethernet 2 »…).
const VIRTUALBOX_SUBNET = "192.168.56.";

// Adresse IPv4 de ce PC sur le réseau local (Wi-Fi / Ethernet), ou null.
function lanAddress(): string | null {
  const candidates: { ip: string; rank: number }[] = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family !== "IPv4" || a.internal || !isPrivateIPv4(a.address)) continue;
      const virtual =
        VIRTUAL_NIC.test(name) || a.address.startsWith(VIRTUALBOX_SUBNET);
      candidates.push({
        ip: a.address,
        rank: virtual ? 2 : PHYSICAL_NIC.test(name) ? 0 : 1,
      });
    }
  }
  candidates.sort((x, y) => x.rank - y.rank);
  return candidates[0]?.ip ?? null;
}

/**
 * Base URL à utiliser dans les liens/QR codes partagés aux participants.
 * 1. NEXT_PUBLIC_BASE_URL si défini (production / domaine public) ;
 * 2. sinon l'origine de la requête ; si c'est « localhost », elle est remplacée
 *    par l'adresse réseau du PC pour que le lien s'ouvre depuis un autre appareil.
 */
export async function getShareBaseUrl(): Promise<string> {
  const fixed = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (fixed) return fixed.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const [hostname, port] = host.split(/:(?=\d+$)/);

  if (LOOPBACK.has(hostname)) {
    const lan = lanAddress();
    if (lan) return `${proto}://${lan}${port ? `:${port}` : ""}`;
  }
  return `${proto}://${host}`;
}
