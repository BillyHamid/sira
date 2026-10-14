import Link from "next/link";
import { Logo } from "./Logo";

type Formation = {
  slug: string; titre: string; organisme: string; formateur: string;
  dateDebut: string | null; lieu: string | null; active: boolean;
};

export function FormationBanner({ formation }: { formation: Formation }) {
  return <section className="formation-cosmos relative isolate overflow-hidden text-white">
    <div aria-hidden="true" className="cosmos-stars pointer-events-none absolute inset-0" />
    <div aria-hidden="true" className="cosmos-nebula pointer-events-none absolute inset-0" />
    <svg aria-hidden="true" viewBox="0 0 360 360" className="pointer-events-none absolute -right-10 bottom-16 h-64 w-64 text-white/65 sm:right-3 sm:h-80 sm:w-80 lg:right-12">
      <ellipse cx="235" cy="213" rx="87" ry="75" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="9 7" transform="rotate(-28 235 213)" />
      <ellipse cx="276" cy="294" rx="42" ry="21" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="9 7" transform="rotate(-28 276 294)" />
      <circle cx="235" cy="205" r="24" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M214 199 Q235 217 250 190 M217 212 Q240 230 257 200 M223 222 Q245 236 258 211" fill="none" stroke="currentColor" strokeWidth="3" />
      <g transform="translate(130 164) rotate(-30)"><rect x="-9" y="-12" width="18" height="24" rx="3" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M-9 -7H-32V7H-9 M9 -7H32V7H9 M-20 -7V7 M20 -7V7 M-9 0H-32 M9 0H32 M0 -12V-24L8 -29" fill="none" stroke="currentColor" strokeWidth="2" /></g>
      <path d="M315 120v14m-7-7h14 M107 272v10m-5-5h10" stroke="currentColor" strokeWidth="2" />
    </svg>
    <svg aria-hidden="true" viewBox="0 0 200 120" className="pointer-events-none absolute left-7 top-12 h-28 w-44 text-white/70"><circle cx="33" cy="38" r="21" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M84 15l3 7 3-7-3-7z M65 61l3 7 3-7-3-7z M154 40l3 8 3-8-3-8z" fill="currentColor" /></svg>
    <div className="absolute right-6 top-8 hidden sm:block"><Logo tone="light" textClassName="text-xl" /></div>
    <div className="relative mx-auto max-w-6xl px-5 pb-8 pt-7 sm:px-8 sm:pt-9">
      <nav aria-label="Fil d’Ariane" className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-slate-400"><Link href="/#formations" className="hover:text-white">Les formations</Link><span aria-hidden="true">/</span><span className="text-slate-200">Votre session</span></nav>
      <div className="pb-9 pt-16 sm:max-w-[72%] sm:pb-12 sm:pt-20">
        <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[.2em] text-brand-200"><span className="h-px w-8 bg-brand-300" />{formation.organisme}</p>
        <h1 className="cosmos-title mt-5 break-words text-4xl font-semibold leading-[1.12] sm:text-6xl">{formation.titre}</h1>
        <p className="relative mt-6 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">Votre formation se poursuit ici. Partagez votre expérience et retrouvez votre attestation personnelle.</p>
        {formation.active ? <Link href={`/eval/${formation.slug}`} className="mt-7 inline-flex items-center gap-8 rounded-lg bg-white px-5 py-3.5 text-sm font-semibold text-[#182a36] transition-colors hover:bg-brand-100">Commencer mon évaluation <span aria-hidden="true">↗</span></Link> : <p className="mt-7 inline-block rounded-lg border border-white/20 px-4 py-3 text-sm text-slate-300">Les évaluations de cette session sont closes.</p>}
      </div>
      <dl className="grid gap-5 border-t border-white/15 pt-6 sm:grid-cols-3 sm:gap-8"><div><dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Votre formateur</dt><dd className="mt-2 text-sm font-medium">{formation.formateur}</dd></div><div><dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Dates de la formation</dt><dd className="mt-2 text-sm font-medium">{formation.dateDebut || "Communiquées par l’organisateur"}</dd></div><div><dt className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Lieu</dt><dd className="mt-2 text-sm font-medium">{formation.lieu || "Communiqué par l’organisateur"}</dd></div></dl>
    </div>
  </section>;
}
