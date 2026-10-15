"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export type LiveQuiz = {
  title: string; status: string; serverNow: number; startedAt: number | null; durationSeconds: number;
  total: number; count: number; finished: number;
  ranking: { id: string; name: string; score: number; elapsedMs: number | null }[];
  player: { id: string; name: string; finished: boolean; score?: number; elapsedMs?: number } | null;
  questions: { text: string; options: string[]; multiple: boolean; correct?: number[] }[];
};

export function useLiveQuiz(slug: string, admin = false) {
  const [data, setData] = useState<LiveQuiz | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function refresh() {
      let delay = admin ? 3000 : 4000;
      try {
        const response = await fetch(`/api/quiz/${slug}${admin ? "?admin=1" : ""}`, { cache: "no-store", signal: controller.signal });
        const next = await response.json();
        if (!response.ok) throw new Error(next.error || "Connexion impossible.");
        if (next.status === "RUNNING" && next.startedAt > next.serverNow) delay = Math.min(delay, next.startedAt - next.serverNow + 50);
        if (active) { setData(next); setError(""); }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Connexion interrompue.");
      } finally {
        if (active) timer = setTimeout(refresh, Math.max(100, delay));
      }
    }
    void refresh();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [slug, admin]);
  return { data, error };
}

export function QuizPodium({ data }: { data: LiveQuiz }) {
  const winner = data.ranking[0];
  // Un ex æquo parfait produit plusieurs gagnants ; l'ordre des identifiants ne départage pas les scores.
  const winners = winner ? data.ranking.filter((p) => p.score === winner.score && p.elapsedMs === winner.elapsedMs) : [];
  const celebrate = data.status === "CLOSED" && winner;
  return <section aria-label="Classement du quiz" className="space-y-5">
    {celebrate && <div className="quiz-celebration relative overflow-hidden rounded-3xl bg-cyan-950 px-6 py-10 text-center text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">{Array.from({ length: 55 }, (_, i) => <i key={i} className="quiz-confetti absolute h-3 w-2" style={{ left: `${(i * 37) % 100}%`, backgroundColor: ["#22d3ee", "#fbbf24", "#fb7185", "#a78bfa"][i % 4], animationDelay: `${(i % 11) * .17}s`, transform: `rotate(${i * 23}deg)` }} />)}</div>
      <p className="relative text-sm uppercase tracking-[.25em] text-cyan-200">{winners.length > 1 ? "Nos gagnants ex æquo" : "Notre gagnant"}</p>
      <p className="relative mt-3 text-4xl font-black sm:text-6xl">Félicitations !</p>
      <h2 className="relative mt-5 break-words text-3xl font-bold">{winners.map((p) => p.name).join(" · ")}</h2>
      <p className="relative mt-3 text-cyan-100">{winner.score} / {data.total} bonnes réponses · {((winner.elapsedMs ?? 0) / 1000).toFixed(2)} s</p>
    </div>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-5"><h2 className="text-xl font-bold">{data.status === "CLOSED" ? "Classement final" : "Classement provisoire"}</h2><p className="mt-1 text-sm text-slate-500">Bonnes réponses, puis temps le plus court. {data.finished} / {data.count} participants ont terminé.</p></div>
      {!data.ranking.length ? <p className="p-8 text-center text-slate-500">{data.status === "CLOSED" ? "Aucune réponse reçue avant la clôture." : "Les résultats apparaîtront dès les premières copies rendues."}</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Rang</th><th className="p-4">Participant</th><th className="p-4">Score</th><th className="p-4">Temps</th></tr></thead><tbody>{data.ranking.map((p, i) => {
        const rank = data.ranking.findIndex((v) => v.score === p.score && v.elapsedMs === p.elapsedMs) + 1;
        return <tr key={p.id} className={i === 0 ? "border-t border-slate-100 bg-cyan-50" : "border-t border-slate-100"}><td className="p-4 font-bold">{rank}</td><td className="break-words p-4 font-semibold">{p.name}</td><td className="p-4">{p.score} / {data.total}</td><td className="whitespace-nowrap p-4 tabular-nums">{((p.elapsedMs ?? 0) / 1000).toFixed(2)} s</td></tr>;
      })}</tbody></table></div>}
    </div>
    <style>{`@keyframes quiz-confetti-fall { from { top: -15%; opacity: 1; } to { top: 115%; opacity: 0; rotate: 600deg; } } .quiz-confetti { animation: quiz-confetti-fall 3.6s ease-in 3 both; } @media (prefers-reduced-motion: reduce) { .quiz-confetti { display: none; } }`}</style>
  </section>;
}

export default function QuizLive({ slug, shareUrl }: { slug: string; shareUrl: string }) {
  const { data, error } = useLiveQuiz(slug, true);
  return <section className="space-y-6">
    <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="bg-white p-2"><QRCodeSVG value={shareUrl} size={148} level="M" marginSize={2} /></div>
      <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Accès participants</p><a href={shareUrl} className="mt-2 block break-all font-semibold text-slate-900 underline">{shareUrl}</a><p className="mt-2 text-sm text-slate-500">Projetez ce QR code ou imprimez cette page. Les participants s’inscrivent avant le départ.</p><button onClick={() => window.print()} className="mt-3 rounded-lg border px-3 py-2 text-sm print:hidden">Imprimer le QR code</button></div>
    </div>
    {error && <p role="status" className="rounded-xl bg-amber-50 p-4 text-amber-800">{error} · Nouvelle tentative automatique…</p>}
    {data ? <><div className="flex flex-wrap gap-3"><span className="rounded-full bg-cyan-100 px-4 py-2 font-semibold text-cyan-900">{data.count} inscrits</span><span className="rounded-full bg-slate-200 px-4 py-2">{data.finished} copies rendues</span><span className="rounded-full bg-slate-200 px-4 py-2">{({ DRAFT: "Brouillon", LOBBY: "Inscriptions ouvertes", RUNNING: "En cours", CLOSED: "Terminé" } as Record<string, string>)[data.status]}</span></div><QuizPodium data={data} /></> : <p>Chargement du classement…</p>}
  </section>;
}
