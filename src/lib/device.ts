// Outils pour les données techniques anonymes (type d'appareil).

export type DeviceType = "Mobile" | "Ordinateur" | "Inconnu";

// Déduit le type d'appareil à partir du user-agent.
export function deviceType(userAgent?: string | null): DeviceType {
  if (!userAgent) return "Inconnu";
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent)
    ? "Mobile"
    : "Ordinateur";
}

// Version courte et lisible du user-agent (ex : "Android · Chrome").
export function deviceLabel(userAgent?: string | null): string {
  if (!userAgent) return "Inconnu";
  const os =
    /Windows/i.test(userAgent)
      ? "Windows"
      : /Android/i.test(userAgent)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(userAgent)
          ? "iOS"
          : /Mac OS X/i.test(userAgent)
            ? "macOS"
            : /Linux/i.test(userAgent)
              ? "Linux"
              : "Autre";
  const browser =
    /Edg\//i.test(userAgent)
      ? "Edge"
      : /OPR\/|Opera/i.test(userAgent)
        ? "Opera"
        : /Chrome\//i.test(userAgent)
          ? "Chrome"
          : /Firefox\//i.test(userAgent)
            ? "Firefox"
            : /Safari\//i.test(userAgent)
              ? "Safari"
              : "Navigateur";
  return `${os} · ${browser}`;
}
