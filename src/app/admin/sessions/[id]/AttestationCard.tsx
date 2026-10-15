"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  saveAttestationAction,
  toggleAttestationAction,
  deleteAttestationAction,
  resetAttestationDownloadAction,
} from "@/lib/attestation-actions";

// Garantit que requestAnimationFrame déclenche ses callbacks même si l'onglet est
// caché (sinon le navigateur les suspend et la boucle de rendu pdfjs se fige).
// Renvoie une fonction de restauration à appeler une fois le rendu terminé.
function ensureAnimationFrame(): () => void {
  if (typeof document === "undefined" || !document.hidden) return () => {};
  const w = window as unknown as { __rafPatched?: boolean };
  if (w.__rafPatched) return () => {}; // déjà patché (évite une fuite en double-montage)
  const original = window.requestAnimationFrame;
  w.__rafPatched = true;
  window.requestAnimationFrame = (cb: FrameRequestCallback): number =>
    window.setTimeout(() => cb(performance.now()), 16) as unknown as number;
  return () => {
    window.requestAnimationFrame = original;
    w.__rafPatched = false;
  };
}

export type AccountRow = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  createdAt: Date;
  downloadedAt: Date | null;
};

export type AttestationData = {
  fileName: string;
  nameX: number;
  nameY: number;
  fontSize: number;
  align: string;
  active: boolean;
} | null;

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export default function AttestationCard({
  sessionId,
  slug,
  baseUrl,
  attestation,
  accounts = [],
  feedback,
}: {
  sessionId: string;
  slug: string;
  baseUrl: string;
  attestation: AttestationData;
  accounts?: AccountRow[];
  feedback?: { ok?: boolean; err?: string };
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">
          Attestation de formation
        </h2>
        {attestation && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              attestation.active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {attestation.active ? "Active" : "Désactivée"}
          </span>
        )}
      </div>

      <Feedback feedback={feedback} />

      {!attestation ? (
        <UploadForm sessionId={sessionId} />
      ) : (
        <>
          <Configured
            sessionId={sessionId}
            slug={slug}
            baseUrl={baseUrl}
            attestation={attestation}
          />
          <ParticipantsList accounts={accounts} />
        </>
      )}
    </section>
  );
}

// Liste des participants inscrits + suivi des téléchargements (admin).
function ParticipantsList({ accounts }: { accounts: AccountRow[] }) {
  const downloaded = accounts.filter((a) => a.downloadedAt != null).length;
  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">
          Participants ({accounts.length})
        </h3>
        <span className="text-xs text-slate-500">
          {downloaded} téléchargement{downloaded > 1 ? "s" : ""} sur{" "}
          {accounts.length}
        </span>
      </div>

      {accounts.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Aucun participant inscrit pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Nom</th>
                <th className="px-3 py-2 font-medium">Contact</th>
                <th className="px-3 py-2 font-medium">Inscrit le</th>
                <th className="px-3 py-2 font-medium">Téléchargement</th>
                <th className="px-3 py-2 font-medium">Copie administrateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {a.nom.toUpperCase()} {a.prenom}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <div>{a.email}</div>
                    <div className="text-xs text-slate-400">{a.telephone}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                    {new Date(a.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {a.downloadedAt ? (
                      <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        ✓ {new Date(a.downloadedAt).toLocaleString("fr-FR")}
                      </span>
                      <form action={resetAttestationDownloadAction} className="mt-2">
                        <input type="hidden" name="accountId" value={a.id} />
                        <button type="submit" className="text-xs font-medium text-brand-700 underline">
                          Réautoriser le téléchargement
                        </button>
                      </form>
                      </div>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        Pas encore
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <a href={`/api/admin/attestation/download?accountId=${encodeURIComponent(a.id)}`} target="_blank" rel="noreferrer" className="inline-flex rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700" aria-label={`Télécharger l’attestation de ${a.nom} ${a.prenom}`}>
                      Télécharger le PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Feedback({ feedback }: { feedback?: { ok?: boolean; err?: string } }) {
  if (!feedback) return null;
  if (feedback.ok) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Attestation enregistrée.
      </div>
    );
  }
  if (feedback.err) {
    const messages: Record<string, string> = {
      fichier: "Veuillez sélectionner un fichier PDF.",
      motdepasse: "Veuillez définir un mot de passe temporaire.",
      type: "Le fichier doit être un PDF.",
      taille: "Le PDF dépasse la taille maximale (3 Mo).",
    };
    return (
      <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
        {messages[feedback.err] ?? "Une erreur est survenue."}
      </div>
    );
  }
  return null;
}

// --- État initial : aucun modèle encore téléversé ---
function UploadForm({ sessionId }: { sessionId: string }) {
  return (
    <form action={saveAttestationAction} className="mt-4 space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <p className="text-sm text-slate-500">
        Téléversez le modèle PDF d&apos;attestation (avec un emplacement vide
        pour le nom) et définissez le mot de passe temporaire partagé.
      </p>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Fichier PDF (max 3 Mo)
        </label>
        <input
          type="file"
          name="file"
          accept="application/pdf"
          required
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Mot de passe temporaire
        </label>
        <input
          name="password"
          type="text"
          required
          placeholder="ex : BOX2025"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Téléverser le modèle
      </button>
    </form>
  );
}

// --- État configuré : aperçu + positionnement du nom ---
function Configured({
  sessionId,
  slug,
  baseUrl,
  attestation,
}: {
  sessionId: string;
  slug: string;
  baseUrl: string;
  attestation: NonNullable<AttestationData>;
}) {
  const [nameX, setNameX] = useState(attestation.nameX);
  const [nameY, setNameY] = useState(attestation.nameY);
  const [fontSize, setFontSize] = useState(attestation.fontSize);
  const [align, setAlign] = useState<"center" | "left">(
    attestation.align === "left" ? "left" : "center"
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 }); // points PDF
  const [dispW, setDispW] = useState(0); // largeur affichée px
  const [rendered, setRendered] = useState(false);
  const [renderError, setRenderError] = useState(false);

  const measure = useCallback(() => {
    const c = canvasRef.current;
    if (c) setDispW(c.getBoundingClientRect().width);
  }, []);

  // Rendu de la page 1 du PDF modèle via pdfjs.
  // Le démarrage est différé (setTimeout) puis annulé au nettoyage : ainsi le
  // montage éphémère de React StrictMode n'amorce jamais le fetch (qui serait
  // aussitôt avorté), seul le montage définitif le lance. On rend dans un canvas
  // hors-écran avant de recopier l'image dans le canvas visible.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      // Onglet caché : requestAnimationFrame est suspendu par le navigateur, ce
      // qui figerait la boucle de rendu de pdfjs. On bascule alors sur un timer.
      const restoreRaf = ensureAnimationFrame();
      try {
        const pdfjs = await import("pdfjs-dist");
        // Le worker est un module ES (.mjs) : on l'instancie explicitement en
        // `type: "module"` (sinon pdfjs le charge en worker classique → échec
        // silencieux et rendu bloqué). Servi depuis /public.
        if (!pdfjs.GlobalWorkerOptions.workerPort) {
          pdfjs.GlobalWorkerOptions.workerPort = new Worker(
            "/pdf.worker.min.mjs",
            { type: "module" }
          );
        }

        // On récupère les octets nous-mêmes (évite l'abandon du flux par pdfjs).
        const res = await fetch(
          `/api/admin/attestation/template?id=${sessionId}`
        );
        if (!res.ok) throw new Error(`template ${res.status}`);
        const data = new Uint8Array(await res.arrayBuffer());
        if (cancelled) return;
        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(900 / viewport.width, 2);
        const scaled = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = scaled.width;
        canvas.height = scaled.height;
        await page.render({ canvas, canvasContext: ctx, viewport: scaled })
          .promise;
        if (cancelled) return;

        setPageSize({ w: viewport.width, h: viewport.height });
        setRendered(true);
        measure();
      } catch (e) {
        if (cancelled) return;
        console.error("[attestation preview]", e);
        setRenderError(true);
      } finally {
        restoreRaf();
      }
    }, 60);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionId, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function updateFromEvent(clientX: number, clientY: number) {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    setNameX(x);
    setNameY(y);
  }

  function onPointerDown(e: ReactPointerEvent) {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromEvent(e.clientX, e.clientY);
  }
  function onPointerMove(e: ReactPointerEvent) {
    if (!dragging.current) return;
    updateFromEvent(e.clientX, e.clientY);
  }
  function onPointerUp() {
    dragging.current = false;
  }

  // Taille de la police d'aperçu (px), proportionnelle à l'échelle d'affichage.
  const previewFontPx = pageSize.w ? (fontSize * dispW) / pageSize.w : fontSize;

  return (
    <div className="mt-4 space-y-5">
      <p className="text-sm text-slate-500">
        Glissez l&apos;étiquette « NOM Prénom » à l&apos;emplacement voulu sur
        l&apos;aperçu, puis ajustez la taille. Le nom réel de chaque participant
        y sera incrusté.
      </p>

      {/* Aperçu + étiquette déplaçable */}
      <div
        ref={containerRef}
        className="relative mx-auto max-w-full select-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <canvas ref={canvasRef} className="block w-full" />
        {renderError && (
          <div className="p-8 text-center text-sm text-slate-500">
            Impossible d&apos;afficher l&apos;aperçu du PDF.
          </div>
        )}
        {rendered && (
          <div
            onPointerDown={onPointerDown}
            style={{
              position: "absolute",
              left: `${nameX * 100}%`,
              top: `${nameY * 100}%`,
              transform: align === "center" ? "translateX(-50%)" : "none",
              fontSize: `${previewFontPx}px`,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              cursor: "grab",
              color: "#00aeef",
              fontWeight: 700,
              fontFamily: "Helvetica, Arial, sans-serif",
              textShadow: "0 0 2px rgba(255,255,255,0.8)",
            }}
            className="rounded ring-1 ring-brand-400/60 ring-offset-0"
            title="Glissez pour positionner"
          >
            NOM Prénom
          </div>
        )}
      </div>

      {/* Réglages */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Taille de police : {Math.round(fontSize)} pt
          </label>
          <input
            type="range"
            min={8}
            max={72}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="mt-2 w-full accent-brand-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Alignement
          </label>
          <div className="mt-2 inline-flex overflow-hidden rounded-lg border border-slate-300">
            {(["left", "center"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAlign(a)}
                className={`px-3 py-1.5 text-sm font-medium transition ${
                  align === a
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {a === "left" ? "Gauche" : "Centré"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enregistrer la position */}
      <form action={saveAttestationAction}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="nameX" value={nameX} />
        <input type="hidden" name="nameY" value={nameY} />
        <input type="hidden" name="fontSize" value={fontSize} />
        <input type="hidden" name="align" value={align} />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Enregistrer la position
        </button>
      </form>

      {/* Lien public + mot de passe */}
      <ShareAttestation slug={slug} baseUrl={baseUrl} />

      {/* Remplacer le modèle / changer le mot de passe */}
      <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          Remplacer le PDF ou changer le mot de passe
        </summary>
        <form action={saveAttestationAction} className="mt-3 space-y-3">
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="nameX" value={nameX} />
          <input type="hidden" name="nameY" value={nameY} />
          <input type="hidden" name="fontSize" value={fontSize} />
          <input type="hidden" name="align" value={align} />
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nouveau PDF (laisser vide pour conserver)
            </label>
            <input
              type="file"
              name="file"
              accept="application/pdf"
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
            />
            <p className="mt-1 text-xs text-slate-400">
              Actuel : {attestation.fileName}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nouveau mot de passe (laisser vide pour conserver)
            </label>
            <input name="password" type="text" className={inputClass} />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Mettre à jour
          </button>
        </form>
      </details>

      {/* Activer/désactiver + supprimer */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <form action={toggleAttestationAction}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {attestation.active ? "Désactiver" : "Activer"}
          </button>
        </form>
        <form action={deleteAttestationAction}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Supprimer l&apos;attestation
          </button>
        </form>
      </div>
    </div>
  );
}

function ShareAttestation({
  slug,
  baseUrl,
}: {
  slug: string;
  baseUrl: string;
}) {
  const url = `${baseUrl}/attestation/${slug}`;
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">
        Lien de l&apos;attestation
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Diffusez ce lien avec le mot de passe temporaire aux participants.
      </p>
      <div className="mt-3 flex items-stretch gap-2">
        <input
          readOnly
          value={url}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
    </div>
  );
}
