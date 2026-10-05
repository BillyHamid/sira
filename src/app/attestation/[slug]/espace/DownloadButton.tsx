"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <>
      {error && (
        <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Génération en cours…" : "Télécharger mon attestation"}
      </button>
    </>
  );
}
