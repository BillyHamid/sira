import { ImmersiveScene } from "./ImmersiveScene";
import { Logo } from "./Logo";
import Link from "next/link";
import { HomeIntro } from "./HomeIntro";

export function HomeHero({ count }: { count: number }) {
  return <section className="relative isolate min-h-[680px] h-[100svh] overflow-hidden bg-[#aab7bf] text-[#203541]">
    <HomeIntro />
    <ImmersiveScene />
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-[#d2d8df]/95 via-[#d2d8df]/50 to-transparent" />
    <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between px-6 py-7 sm:px-12 sm:py-10">
      <div className="flex items-start justify-between"><Link href="/" className="pointer-events-auto" aria-label="Box.academy — Accueil"><Logo /></Link><a href="#formations" className="pointer-events-auto flex items-center gap-4 border-b border-[#203541]/40 pb-2 font-mono text-xs uppercase tracking-widest">Formations <span aria-hidden="true">↗</span></a></div>
      <div className="mt-auto pb-5"><p className="font-mono text-[10px] uppercase tracking-[.25em]">Formation professionnelle / BOX AFRICA</p><div className="mt-5 flex flex-wrap items-end justify-between gap-8"><div><h1 className="text-[clamp(2.8rem,7vw,6.5rem)] font-medium leading-[.95] tracking-[-.055em]">L’expérience<br />de la formation.</h1><p className="mt-5 max-w-sm text-sm leading-6">Retrouvez votre session, partagez votre avis<br className="hidden sm:block" /> et accédez à votre attestation.</p></div><a href="#formations" className="pointer-events-auto group flex items-center gap-5 font-mono text-xs"><span>EXPLORER LES SESSIONS<br /><span className="mt-1 block text-[10px] opacity-60">{String(count).padStart(2,"0")} FORMATIONS OUVERTES</span></span><span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full border border-[#203541]/50 text-xl transition group-hover:bg-[#203541] group-hover:text-white">↓</span></a></div></div>
      <div className="flex justify-between border-t border-[#203541]/25 pt-4 font-mono text-[9px] uppercase tracking-widest"><span>Évaluation · Attestation</span><span className="hidden sm:inline">Faire défiler pour découvrir</span><span>BOX / 01</span></div>
    </div>
  </section>;
}
