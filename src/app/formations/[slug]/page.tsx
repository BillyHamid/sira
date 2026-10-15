import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ParticipantHeader, ParticipantFooter } from "@/components/ParticipantHeader";
import { FormationBanner } from "@/components/FormationBanner";

export const dynamic = "force-dynamic";

export default async function FormationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await prisma.session.findUnique({ where: { slug }, include: { attestation: { select: { active: true } }, quizzes: { where: { status: "LOBBY" }, select: { slug: true, title: true } } } });
  if (!session) notFound();
  return <><ParticipantHeader /><main className="flex-1">
    <FormationBanner formation={session} />
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-2xl font-semibold">Votre parcours, étape par étape</h2><ol className="mt-7 space-y-6">{[["Évaluez votre formation", "Donnez votre avis sur les 8 critères de la formation. Vos retours nous aident à améliorer les prochaines sessions."], ["Retrouvez votre espace", "Créez votre compte ou connectez-vous pour personnaliser votre attestation."], ["Téléchargez votre attestation", "Vérifiez votre nom et votre prénom dans l’aperçu, puis enregistrez votre document."]].map(([title, text], index) => <li key={title} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">{index + 1}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div></li>)}</ol>
      {session.active ? <Link href={`/eval/${slug}`} className="mt-8 inline-flex w-full justify-center rounded-xl bg-brand-600 px-6 py-4 text-sm font-semibold text-white hover:bg-brand-700">Commencer mon évaluation →</Link> : <p role="status" className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Cette session est fermée. Les nouvelles évaluations ne sont plus disponibles.</p>}
      {session.attestation?.active && <Link href={`/attestation/${slug}`} className="mt-4 block text-center text-sm font-medium text-brand-700 hover:underline">Déjà évalué ? Retrouver mon attestation</Link>}
      {!session.attestation?.active && <p className="mt-4 text-sm text-slate-500">L’organisateur communiquera l’accès à l’attestation dès qu’elle sera disponible.</p>}
      {session.active && session.quizzes.length > 0 && <div className="mt-7 space-y-3 border-t border-slate-100 pt-6"><h3 className="font-bold text-slate-900">Rejoignez le quiz en direct</h3>{session.quizzes.map((quiz) => <Link key={quiz.slug} href={`/quiz/${quiz.slug}`} className="block rounded-xl bg-cyan-50 p-4 font-semibold text-cyan-900">{quiz.title} →</Link>)}</div>}
      </section>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><span className={`rounded-full px-3 py-1 text-xs font-medium ${session.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{session.active ? "Session ouverte" : "Session fermée"}</span><h2 className="mt-6 text-lg font-semibold">Les informations utiles</h2><dl className="mt-5 space-y-5">{[["Formateur", session.formateur], ["Dates", session.dateDebut], ["Lieu", session.lieu], ["Organisme", session.organisme]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl><p className="mt-7 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-500">Besoin d’aide ? Rapprochez-vous de l’organisateur sur place.</p></aside>
    </div>
  </main><ParticipantFooter /></>;
}
