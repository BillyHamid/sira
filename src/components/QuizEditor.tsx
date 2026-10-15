"use client";

import { useActionState, useState } from "react";
import { saveQuiz } from "@/lib/quiz-actions";
import type { QuizQuestion } from "@/lib/quiz";

const blank = (): QuizQuestion => ({ text: "", options: ["", "", "", ""], correct: [0] });
const field = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900";

export default function QuizEditor({ sessions, initial }: {
  sessions: { id: string; titre: string }[];
  initial?: { id: string; title: string; sessionId: string | null; durationSeconds: number; questions: QuizQuestion[] };
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initial?.questions ?? [blank()]);
  const [state, action, pending] = useActionState(saveQuiz, { error: "" });
  function change(index: number, data: Partial<QuizQuestion>) {
    setQuestions((items) => items.map((q, i) => i === index ? { ...q, ...data } : q));
  }
  return <form action={action} className="space-y-6">
    <input type="hidden" name="id" value={initial?.id ?? ""} />
    <input type="hidden" name="questions" value={JSON.stringify(questions)} />
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2">
      <label className="space-y-2 font-medium md:col-span-2">Titre du quiz<input name="title" required maxLength={160} defaultValue={initial?.title} className={field} placeholder="Le grand quiz de la comptabilité" /></label>
      <label className="space-y-2 font-medium">Durée totale (secondes)<input name="durationSeconds" type="number" required min={30} max={7200} defaultValue={initial?.durationSeconds ?? 300} className={field} /></label>
      <label className="space-y-2 font-medium">Formation associée<select name="sessionId" defaultValue={initial?.sessionId ?? ""} className={field}><option value="">Quiz indépendant</option>{sessions.map((s) => <option key={s.id} value={s.id}>{s.titre}</option>)}</select></label>
    </div>
    <p className="text-sm text-slate-600">Cochez toutes les bonnes réponses. Un point est attribué uniquement si le participant sélectionne exactement les bonnes propositions. Aucun point négatif.</p>
    {questions.map((q, i) => <fieldset key={i} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <legend className="rounded-full bg-slate-900 px-4 py-1 text-sm font-bold text-white">Question {i + 1}</legend>
      <label className="block space-y-2">Énoncé<textarea required maxLength={500} value={q.text} onChange={(e) => change(i, { text: e.target.value })} className={field} /></label>
      {q.options.map((option, n) => <div key={n} className="flex items-center gap-3">
        <input aria-label={`Question ${i + 1}, réponse ${n + 1} correcte`} type="checkbox" checked={q.correct.includes(n)} onChange={(e) => change(i, { correct: e.target.checked ? [...q.correct, n] : q.correct.filter((v) => v !== n) })} className="h-5 w-5 accent-cyan-600" />
        <input aria-label={`Question ${i + 1}, proposition ${n + 1}`} required maxLength={300} value={option} placeholder={`Proposition ${n + 1}`} onChange={(e) => change(i, { options: q.options.map((v, k) => k === n ? e.target.value : v) })} className={field} />
        {q.options.length > 2 && <button type="button" aria-label={`Supprimer la proposition ${n + 1}`} onClick={() => change(i, { options: q.options.filter((_, k) => k !== n), correct: q.correct.filter((k) => k !== n).map((k) => k > n ? k - 1 : k) })} className="px-2 text-red-600">×</button>}
      </div>)}
      <div className="flex flex-wrap justify-between gap-3 text-sm">
        {q.options.length < 6 && <button type="button" onClick={() => change(i, { options: [...q.options, ""] })} className="font-semibold text-cyan-700">+ Ajouter un choix</button>}
        {questions.length > 1 && <button type="button" onClick={() => setQuestions((items) => items.filter((_, k) => k !== i))} className="text-red-600">Supprimer la question</button>}
      </div>
    </fieldset>)}
    {questions.length < 40 && <button type="button" onClick={() => setQuestions((items) => [...items, blank()])} className="rounded-xl border border-dashed border-slate-400 px-5 py-3 font-medium">+ Ajouter une question</button>}
    {state.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{state.error}</p>}
    <div><button disabled={pending} className="rounded-xl bg-cyan-700 px-6 py-3 font-bold text-white disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer le quiz"}</button></div>
  </form>;
}
