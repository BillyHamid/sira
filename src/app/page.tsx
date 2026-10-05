import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl text-center">
        <Logo
          className="justify-center"
          iconClassName="h-10 w-10"
          textClassName="text-2xl"
        />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Évaluation à chaud des formations
        </h1>
        <p className="mt-4 text-slate-600">
          Cette plateforme permet de recueillir l&apos;avis des participants en
          fin de formation et d&apos;analyser automatiquement les résultats
          (scoring, statistiques, graphiques).
        </p>
        <p className="mt-6 text-sm text-slate-500">
          Vous avez reçu un lien ou un QR code&nbsp;? Ouvrez-le pour remplir
          votre évaluation. Les responsables peuvent accéder à l&apos;espace
          d&apos;administration ci-dessous.
        </p>
        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            Espace administration
          </Link>
        </div>
      </div>
    </main>
  );
}
