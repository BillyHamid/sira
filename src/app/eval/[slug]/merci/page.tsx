import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasCompletedEvaluation } from "@/lib/evaluation-progress";
import { ParticipantHeader, ParticipantFooter } from "@/components/ParticipantHeader";

export default async function MerciPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await prisma.session.findUnique({ where: { slug }, include: { attestation: { select: { active: true } } } });
  if (!session) notFound();
  if (!(await hasCompletedEvaluation(session.id))) redirect(`/eval/${slug}`);
  return <><ParticipantHeader /><main className="flex flex-1 items-center justify-center px-5 py-16"><div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
    <span aria-hidden="true" className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl text-emerald-700">✓</span>
    <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brand-700">Évaluation terminée</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight">Merci pour votre avis !</h1>
    <p className="mt-4 leading-7 text-slate-600">Votre réponse pour <strong>{session.titre}</strong> a bien été enregistrée.</p>
    {session.attestation?.active ? <><p className="mt-5 text-sm leading-6 text-slate-500">La prochaine étape : créez votre compte ou connectez-vous pour retrouver votre attestation personnalisée.</p><Link href={`/attestation/${slug}`} className="mt-7 inline-flex w-full justify-center rounded-xl bg-brand-600 px-5 py-4 text-sm font-semibold text-white hover:bg-brand-700">Accéder à mon attestation →</Link></> : <p className="mt-6 rounded-xl bg-brand-50 p-4 text-sm leading-6 text-brand-800">Votre attestation sera accessible lorsque l’organisateur l’aura mise à disposition. Conservez le lien de votre formation.</p>}
    <Link href={`/formations/${slug}`} className="mt-5 inline-block text-sm text-slate-500 hover:text-brand-700">Retour à ma formation</Link>
  </div></main><ParticipantFooter /></>;
}
