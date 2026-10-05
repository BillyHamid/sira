"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function ShareCard({ slug }: { slug: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    setUrl(`${base.replace(/\/$/, "")}/eval/${slug}`);
  }, [slug]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQR() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">
        Partager l&apos;évaluation
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Envoyez ce lien aux participants ou affichez le QR code.
      </p>

      <div className="mt-4 flex flex-col items-center gap-3">
        <div ref={qrRef} className="rounded-lg bg-white p-2 ring-1 ring-slate-200">
          {url && <QRCodeCanvas value={url} size={160} marginSize={2} />}
        </div>
        <button
          onClick={downloadQR}
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          Télécharger le QR code (PNG)
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-stretch gap-2">
          <input
            readOnly
            value={url}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600"
          />
          <button
            onClick={copy}
            className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      </div>
    </div>
  );
}
