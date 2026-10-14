"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Icon, buttonClass } from "../ui-base";

// Télécharge l'attestation via fetch (plutôt qu'un lien direct) pour gérer
// proprement le cas "déjà téléchargée" sans afficher de page d'erreur brute,
// puis rafraîchit l'espace pour refléter le verrou.
export function DownloadButton({
  slug,
  fileName,
}: {
  slug: string;
  fileName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attestation/${slug}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Le téléchargement a échoué.");
        router.refresh();
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      router.refresh(); // l'attestation est désormais verrouillée
    } catch {
      setError("Le téléchargement a échoué. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className={`${buttonClass("primary")} disabled:cursor-wait disabled:opacity-70`}
      >
        {loading ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
            Génération en cours…
          </>
        ) : (
          <>
            <Icon name="download" className="h-5 w-5" />
            Télécharger mon attestation
          </>
        )}
      </button>
    </div>
  );
}
