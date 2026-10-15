"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_QUESTIONS, NEED_OPTIONS, PROFILE_FIELDS, type EventSurvey } from "@/lib/event-survey";
import { submitResponseAction, resumeEvaluationAction } from "@/lib/actions";

function getDeviceId(): string {
  let id: string | null = null;
  try { id = localStorage.getItem("box_eval_device"); } catch {}
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try { localStorage.setItem("box_eval_device", id); } catch {}
  }
  return id;
}
export default function EventSurveyForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<EventSurvey["profile"]>({ entreprise: "", nom: "", prenom: "", poste: "", telephone: "", email: "" });
  const [answers, setAnswers] = useState<EventSurvey["answers"]>({});
  const [commentaire, setCommentaire] = useState("");
  const [meetingPeriod, setMeetingPeriod] = useState("");
  const [otherNeeds, setOtherNeeds] = useState<"oui" | "non" | "">("");
  const [needsDetails, setNeedsDetails] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lastStep = 9;
  const question = step > 0 && step <= 5 ? EVENT_QUESTIONS[step - 1] : null;
  const stepTitle = step === 0 ? "Faisons connaissance." : question?.text ?? (step === 6 ? "Avez-vous d’autres problématiques que vous souhaitez prochainement adresser ?" : step === 7 ? "Votre organisation envisage-t-elle un projet de modernisation de sa gestion financière ?" : step === 8 ? "Souhaitez-vous une rencontre personnalisée avec Box.africa ?" : "Vos remarques et suggestions");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDeviceId(getDeviceId());
      try { setAlreadyDone(localStorage.getItem(`box_eval_confirmed_${slug}`) === "1"); } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, [slug]);
  function go(next: number) {
    setError(null); setStep(next);
    requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true });
      titleRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
    });
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (step === 0) { if (formRef.current?.reportValidity()) go(1); return; }
    if (step !== lastStep) {
      if (step === 6 && (!otherNeeds || (otherNeeds === "oui" && (!NEED_OPTIONS.some((n) => answers[n.key] === "oui") || !needsDetails.trim())))) { setError("Indiquez Oui ou Non et, si Oui, choisissez vos problématiques puis décrivez-les en quelques lignes."); return; }
      if (step === 7 && (!answers.modernisation || (answers.modernisation === "oui" && !projectDetails.trim()))) { setError("Indiquez Oui ou Non et, si Oui, décrivez votre projet."); return; }
      if (step === 8 && !answers.rencontre) { setError("Indiquez si vous souhaitez une rencontre personnalisée."); return; }
      if (step >= 6) go(step + 1);
      return;
    }
    if (!EVENT_QUESTIONS.every((q) => answers[q.key] === "oui" || answers[q.key] === "non")) { setError("Répondez à toutes les questions avant d’envoyer."); return; }
    setSubmitting(true); setError(null);
    const form = new FormData();
    form.set("slug", slug); form.set("deviceId", deviceId); form.set("commentaire", commentaire);
    form.set("surveyData", JSON.stringify({ version: "odoo-event-v2", profile, answers, meetingPeriod, otherNeeds, needsDetails, projectDetails }));
    try {
      const result = await submitResponseAction(form);
      if (!result.success) { setError(result.error); return; }
      try { localStorage.setItem(`box_eval_confirmed_${slug}`, "1"); } catch {}
      router.push(`/eval/${slug}/merci`);
    } catch { setError("L’envoi a échoué. Vérifiez votre connexion et réessayez."); }
    finally { setSubmitting(false); }
  }
  if (alreadyDone) return <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center"><p className="font-semibold text-brand-800">Vous avez déjà répondu à cette évaluation depuis cet appareil.</p><button type="button" onClick={async () => {
    const data = new FormData(); data.set("slug", slug); data.set("deviceId", deviceId);
    try { const result = await resumeEvaluationAction(data); if (result.success) router.push(`/eval/${slug}/merci`); else setError(result.error); }
    catch { setError("Impossible de retrouver votre réponse. Réessayez."); }
  }} className="mt-4 text-sm font-semibold underline">Continuer vers mon attestation →</button>{error && <p role="alert" className="mt-3 text-red-700">{error}</p>}</div>;
  return <form ref={formRef} onSubmit={submit} className="space-y-5">
    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500"><span>{step === 0 ? "Votre profil" : step <= 5 ? `Évaluation · ${step} / 5` : step === 6 ? "Vos problématiques" : step === 7 ? "Votre projet" : step === 8 ? "Une rencontre" : "Votre commentaire"}</span><span>{Math.round(step / lastStep * 100)} %</span></div>
    <div role="progressbar" aria-label="Progression du questionnaire" aria-valuemin={0} aria-valuemax={lastStep} aria-valuenow={step} className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cyan-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${step / lastStep * 100}%` }} /></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <section key={step} className="eval-step rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">{step === 0 ? "Appréciation client" : question?.group ?? (step === 6 ? "Vos besoins" : step === 7 ? "Modernisation financière" : step === 8 ? "Restons en contact" : "Un dernier mot")}</p>
      <h2 ref={titleRef} tabIndex={-1} className="mt-4 text-2xl font-bold leading-snug outline-none sm:text-3xl">{stepTitle}</h2>
      {step === 0 && <><p className="mt-3 text-sm text-slate-500">Votre retour et vos coordonnées sont destinés à l’organisateur. Les champs marqués * sont obligatoires.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{PROFILE_FIELDS.map((field) => <label key={field.key} className="text-sm font-medium text-slate-700">{field.label}{field.required ? " *" : ""}<input name={field.key} type={field.key === "email" ? "email" : field.key === "telephone" ? "tel" : "text"} required={field.required} maxLength={200} autoComplete={({ nom: "family-name", prenom: "given-name", email: "email", telephone: "tel", entreprise: "organization", poste: "organization-title" })[field.key]} value={profile[field.key]} onChange={(e) => setProfile((p) => ({ ...p, [field.key]: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" /></label>)}</div></>}
      {question && <div className="mt-8 grid grid-cols-2 gap-4" role="group" aria-label="Votre réponse">{(["oui", "non"] as const).map((answer) => <button key={answer} type="button" aria-pressed={answers[question.key] === answer} onClick={() => { setAnswers((a) => ({ ...a, [question.key]: answer })); go(step + 1); }} className={`rounded-2xl border-2 px-4 py-7 text-xl font-bold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600 motion-reduce:transform-none ${answers[question.key] === answer ? "border-cyan-700 bg-cyan-700 text-white" : "border-slate-200 bg-slate-50 text-slate-800 hover:border-cyan-600 hover:bg-cyan-50"}`}>{answer === "oui" ? "Oui" : "Non"}</button>)}</div>}
      {step === 6 && <div className="mt-6 space-y-5">
        <BinaryChoice value={otherNeeds} onChange={(answer) => { setOtherNeeds(answer); setAnswers((current) => ({ ...current, ...Object.fromEntries(NEED_OPTIONS.map((n) => [n.key, answer === "non" ? "non" : current[n.key] ?? "non"])) })); }} />
        {otherNeeds === "oui" && <><fieldset className="space-y-3"><legend className="mb-3 text-sm font-semibold">Choisissez une ou plusieurs problématiques :</legend>{NEED_OPTIONS.map((n) => <label key={n.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm"><input type="checkbox" checked={answers[n.key] === "oui"} onChange={(e) => setAnswers((current) => ({ ...current, [n.key]: e.target.checked ? "oui" : "non" }))} className="mt-1 h-4 w-4 accent-cyan-700" /><span>{n.label}</span></label>)}</fieldset><DetailsField label="Quelles en sont les grandes lignes ?" value={needsDetails} onChange={setNeedsDetails} /></>}
      </div>}
      {step === 7 && <div className="mt-6 space-y-5"><BinaryChoice value={answers.modernisation ?? ""} onChange={(answer) => setAnswers((current) => ({ ...current, modernisation: answer }))} />{answers.modernisation === "oui" && <DetailsField label="Décrivez votre projet en quelques lignes." value={projectDetails} onChange={setProjectDetails} />}</div>}
      {step === 8 && <div className="mt-6 space-y-5"><BinaryChoice value={answers.rencontre ?? ""} onChange={(answer) => setAnswers((current) => ({ ...current, rencontre: answer }))} />{answers.rencontre === "oui" && <label className="block text-sm font-medium">Période souhaitée pour la rencontre (facultatif)<input maxLength={200} value={meetingPeriod} onChange={(e) => setMeetingPeriod(e.target.value)} placeholder="Semaine prochaine ou date souhaitée…" className="mt-2 w-full rounded-xl border border-slate-300 p-3" /></label>}</div>}
      {step === lastStep && <div className="mt-6 space-y-5"><label htmlFor="commentaire" className="block text-sm font-medium">Commentaire (facultatif)</label><textarea id="commentaire" rows={6} maxLength={5000} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Vos remarques ou suggestions pour un prochain événement…" className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" /><p className="text-right text-xs text-slate-400">{commentaire.length} / 5 000</p><p className="text-sm text-slate-500">Vous pouvez revenir aux questions précédentes pour modifier vos réponses avant l’envoi.</p></div>}
    </section>
    <div className="flex items-center justify-between gap-3">{step > 0 ? <button type="button" disabled={submitting} onClick={() => go(step - 1)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold disabled:opacity-50">← Précédent</button> : <span />}{step === 0 && <button type="submit" className="rounded-xl bg-cyan-700 px-6 py-3 font-semibold text-white">Commencer →</button>}{step >= 6 && step < lastStep && <button type="submit" className="rounded-xl bg-cyan-700 px-6 py-3 font-semibold text-white">Continuer →</button>}{step === lastStep && <button type="submit" disabled={submitting || !deviceId} className="rounded-xl bg-cyan-700 px-6 py-3 font-semibold text-white disabled:opacity-50">{submitting ? "Envoi…" : "Envoyer mon évaluation"}</button>}</div>
    <style>{`@keyframes eval-step-enter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } } .eval-step { animation: eval-step-enter .25s ease-out; } @media (prefers-reduced-motion: reduce) { .eval-step { animation: none; } }`}</style>
  </form>;
}

function BinaryChoice({ value, onChange }: { value: string; onChange: (value: "oui" | "non") => void }) {
  return <div className="grid grid-cols-2 gap-4" role="group" aria-label="Votre réponse">{(["oui", "non"] as const).map((answer) => <button key={answer} type="button" aria-pressed={value === answer} onClick={() => onChange(answer)} className={`rounded-2xl border-2 px-4 py-5 text-xl font-bold ${value === answer ? "border-cyan-700 bg-cyan-700 text-white" : "border-slate-200 bg-slate-50 hover:border-cyan-600"}`}>{answer === "oui" ? "Oui" : "Non"}</button>)}</div>;
}
function DetailsField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium">{label}<textarea required rows={4} maxLength={3000} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3" placeholder="Précisez votre besoin en quelques grandes lignes…" /></label>;
}
