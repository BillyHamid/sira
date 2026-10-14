import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Autorise l'ouverture du serveur de dev depuis d'autres appareils du réseau
  // local (téléphones des participants) via l'adresse IP du PC.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
