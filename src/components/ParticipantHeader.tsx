import Link from "next/link";
import { Logo } from "./Logo";

export function ParticipantHeader() {
  return <header className="border-b border-slate-200/70 bg-white">
    <nav aria-label="Navigation principale" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Link href="/" aria-label="Box.academy — Accueil"><Logo /></Link>
      <Link href="/#formations" className="text-sm font-medium text-slate-600 hover:text-brand-700">Nos formations</Link>
    </nav>
  </header>;
}

export function ParticipantFooter() {
  return <footer className="mt-auto border-t border-slate-200 px-5 py-7">
    <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 text-xs text-slate-500">
      <span>BOX AFRICA · Apprendre. Progresser. Aller plus loin.</span>
      <Link href="/admin" className="hover:text-brand-700">Espace organisateur</Link>
    </div>
  </footer>;
}
