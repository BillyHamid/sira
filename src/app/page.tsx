import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ParticipantFooter } from "@/components/ParticipantHeader";
import { HomeHero } from "@/components/HomeHero";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sessions = await prisma.session.findMany({
    where: { active: true }, orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, titre: true, organisme: true, formateur: true, dateDebut: true, lieu: true },
  });
  return <>
    <main className="flex-1">
      <HomeHero count={sessions.length} />
      <section id="formations" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-brand-700">À vous de jouer</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Les formations ouvertes</h2><p className="mt-3 text-slate-600">Choisissez votre formation pour commencer.</p></div><span className="rounded-full bg-brand-50 px-4 py-2 text-sm text-brand-800">{sessions.length} session{sessions.length > 1 ? "s" : ""} ouverte{sessions.length > 1 ? "s" : ""}</span></div>
        {sessions.length ? <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{sessions.map((s, i) => <Link key={s.id} href={`/formations/${s.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-brand-600">
          <div className={`course-art course-art-${i % 3} relative flex h-40 items-end justify-between overflow-hidden p-6`}><div aria-hidden="true" className="course-art-shape" /><span className="relative text-5xl font-light tracking-tighter text-white/40">{String(i + 1).padStart(2, "0")}</span><span className="relative rounded-full border border-white/20 bg-black/15 px-3 py-1 text-xs font-medium text-white">Session ouverte</span></div>
          <div className="flex flex-1 flex-col p-6"><p className="text-xs font-semibold uppercase tracking-widest text-brand-700">{s.organisme}</p><h3 className="mt-3 text-xl font-semibold leading-snug">{s.titre}</h3><dl className="mt-5 space-y-2 text-sm text-slate-600"><div><dt className="inline font-medium">Formateur : </dt><dd className="inline">{s.formateur}</dd></div>{s.dateDebut && <div><dt className="inline font-medium">Dates : </dt><dd className="inline">{s.dateDebut}</dd></div>}{s.lieu && <div><dt className="inline font-medium">Lieu : </dt><dd className="inline">{s.lieu}</dd></div>}</dl><span className="mt-6 border-t border-slate-100 pt-4 text-sm font-semibold text-brand-700">Découvrir ma formation <span aria-hidden="true" className="float-right">→</span></span></div>
        </Link>)}</div> : <div className="mt-9 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><h3 className="text-lg font-semibold">De nouvelles formations vous attendent</h3><p className="mt-3 text-sm text-slate-600">Aucune session n’est ouverte pour le moment. Si vous avez déjà un lien d’attestation, vous pouvez toujours l’utiliser pour retrouver votre espace.</p></div>}
      </section>
    </main>
    <ParticipantFooter />
  </>;
}
