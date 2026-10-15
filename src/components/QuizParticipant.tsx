"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QuizPodium, useLiveQuiz } from "./QuizLive";

export default function QuizParticipant({ slug }: { slug: string }) {
  const { data, error: connectionError } = useLiveQuiz(slug);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<number[][]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(sessionStorage.getItem(`quiz_answers_${slug}`) || "[]"); } catch { return []; }
  });
  const [joined, setJoined] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("");
  const [clock, setClock] = useState({ server: 0, received: 0, now: 0 });
  const sending = useRef(false);
  const answerVersion = useRef(0);
  useEffect(() => {
    if (!data) return;
    const received = performance.now();
    const tick = () => setClock({ server: data.serverNow, received, now: performance.now() });
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [data]);
  const remaining = data?.startedAt ? Math.max(0, Math.ceil((data.startedAt + data.durationSeconds * 1000 - (clock.server ? clock.server + clock.now - clock.received : data.serverNow)) / 1000)) : 0;
  const finished = submitted || data?.player?.finished;
  const playerId = data?.player?.id;

  async function post(body: unknown) {
    const response = await fetch(`/api/quiz/${slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Envoi impossible.");
  }

  useEffect(() => {
    if (!playerId || data?.status !== "RUNNING" || finished || !answers.length) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/quiz/${slug}`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
          body: JSON.stringify({ action: "save", version: answerVersion.current || Date.now(), answers: Array.from({ length: data.total }, (_, i) => answers[i] ?? []) }) });
        if (!response.ok) throw new Error();
        setSaveState("Réponses sauvegardées");
      } catch { if (!controller.signal.aborted) setSaveState("Sauvegarde interrompue : vérifiez votre connexion et validez à nouveau."); }
    }, 700);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [answers, playerId, data?.status, data?.total, finished, slug]);

  function choose(index: number, option: number, multiple: boolean, version: number) {
    if (finished) return;
    const next = Array.from({ length: data?.total ?? 0 }, (_, i) => answers[i] ?? []);
    next[index] = multiple ? next[index].includes(option) ? next[index].filter((v) => v !== option) : [...next[index], option] : [option];
    answerVersion.current = Math.max(answerVersion.current + 1, version);
    setAnswers(next);
    setSaveState("Sauvegarde en cours…");
    sessionStorage.setItem(`quiz_answers_${slug}`, JSON.stringify(next));
  }
  async function join(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await post({ action: "join", name }); setJoined(true); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending.current) return;
    sending.current = true; setBusy(true); setError("");
    try {
      await post({ action: "submit", answers: Array.from({ length: data?.total ?? 0 }, (_, i) => answers[i] ?? []) });
      setSubmitted(true);
    } catch (e) { setError((e as Error).message); } finally { sending.current = false; setBusy(false); }
  }
  return <main className="mx-auto w-full max-w-3xl px-4 py-10">
    <Link href="/" className="text-sm font-bold tracking-wider text-cyan-700">BOX ACADEMY / QUIZ LIVE</Link>
    <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{data?.title ?? "Préparez-vous à jouer."}</h1>
    {(connectionError || error) && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{error || connectionError}</p>}
    {!data && !connectionError && <p className="mt-8">Connexion au quiz…</p>}
    {data?.status === "LOBBY" && <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      {data.player || joined ? <><p className="text-sm font-bold uppercase tracking-wider text-cyan-700">Vous êtes inscrit</p><h2 className="mt-3 text-2xl font-bold">Bienvenue {data.player?.name ?? name} !</h2><p className="mt-4 text-slate-600">Le formateur donnera le départ. Gardez cette page ouverte : les questions apparaîtront automatiquement.</p></> : <form onSubmit={join} className="space-y-5"><h2 className="text-xl font-bold">Entrez dans la partie.</h2><label className="block">Votre nom et prénom<input autoComplete="name" required minLength={3} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3" placeholder="Ex. OUATTARA Hamid" /></label><p className="text-sm text-slate-500">Votre nom et votre score seront affichés au classement. Une tentative par navigateur ; conservez le même appareil.</p><button disabled={busy} className="rounded-xl bg-cyan-700 px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? "Inscription…" : "Rejoindre le quiz"}</button></form>}
      <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-600"><span>{data.count} inscrits</span><span>· {data.total} questions</span><span>· {data.durationSeconds / 60} min</span></div>
    </section>}
    {data?.status === "RUNNING" && (!data.player ? <p className="mt-8 rounded-2xl bg-white p-6">Le quiz a commencé. Les inscriptions sont fermées ; rejoignez la prochaine partie.</p> : finished ? <section className="mt-8 rounded-3xl bg-cyan-950 p-8 text-white"><h2 className="text-3xl font-bold">Bien joué, {data.player.name} !</h2><p className="mt-4 text-cyan-100">Votre copie est enregistrée. Les résultats et les bonnes réponses seront révélés à la clôture.</p></section> : !data.questions.length ? <section className="mt-8 rounded-3xl bg-cyan-950 p-10 text-center text-white"><h2 className="text-2xl font-bold">À vos marques !</h2><p role="timer" className="mt-6 text-7xl font-black tabular-nums">{Math.max(0, remaining - data.durationSeconds) || "…"}</p><p className="mt-5 text-cyan-100">Le départ est synchronisé. Les questions vont apparaître.</p></section> : <form onSubmit={submit} className="mt-8 space-y-6">
      <div className="sticky top-3 z-10 flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-xl"><span className="truncate text-sm">{data.player.name}</span><strong role="timer" className="whitespace-nowrap text-xl tabular-nums">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</strong></div>
      <p className="text-sm text-slate-600">Toutes les bonnes réponses sont nécessaires pour gagner le point. À la fin du temps, les dernières réponses sauvegardées sont comptées avec la durée maximale.</p>
      {data.questions.map((q, i) => <fieldset key={i} disabled={busy || remaining === 0} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><legend className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-bold text-cyan-900">Question {i + 1} / {data.total}</legend><h2 className="text-lg font-bold">{q.text}</h2><p className="text-xs text-slate-500">{q.multiple ? "Plusieurs réponses possibles" : "Une seule réponse"}</p>{q.options.map((option, k) => <label key={k} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${answers[i]?.includes(k) ? "border-cyan-600 bg-cyan-50" : "border-slate-200"}`}><input type={q.multiple ? "checkbox" : "radio"} name={`q${i}`} checked={answers[i]?.includes(k) ?? false} onChange={() => choose(i, k, q.multiple, Date.now())} className="mt-1 h-4 w-4 accent-cyan-700" /><span>{option}</span></label>)}</fieldset>)}
      <p aria-live="polite" className="text-sm text-slate-500">{saveState}</p>
      <button disabled={busy || remaining === 0} className="w-full rounded-xl bg-cyan-700 p-4 font-bold text-white disabled:opacity-50">{busy ? "Envoi…" : "Valider définitivement mes réponses"}</button>
      <p className="text-center text-xs text-slate-500">Après validation, votre copie ne peut plus être modifiée.</p>
    </form>)}
    {data?.status === "CLOSED" && <div className="mt-8 space-y-8">{data.player && <p className="rounded-xl bg-cyan-100 p-5 font-semibold text-cyan-950">{data.player.name}, votre score : {data.player.score ?? 0} / {data.total}.</p>}<QuizPodium data={data} />{data.questions.length > 0 && <section className="rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">Le corrigé</h2>{data.questions.map((q, i) => <div key={i} className="mt-5 border-t pt-4"><h3 className="font-bold">{i + 1}. {q.text}</h3><ul className="mt-2 space-y-1 text-cyan-800">{q.correct?.map((k) => <li key={k}>✓ {q.options[k]}</li>)}</ul></div>)}</section>}</div>}
  </main>;
}
