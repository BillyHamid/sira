import { notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantHeader } from "@/components/ParticipantHeader";
import { prisma } from "@/lib/prisma";
import EvalForm from "./EvalForm";

export default async function EvalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;

  const session = await prisma.session.findUnique({ where: { slug } });
  if (!session) notFound();

  return (
    <><ParticipantHeader /><main className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link href={`/formations/${slug}`} className="mb-5 inline-block text-sm text-brand-700 hover:underline">← Présentation de la formation</Link>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Étape 1 · Votre évaluation</p>
        {/* En-tête de la session */}
        <header className="rounded-xl bg-linear-to-br from-brand-600 to-brand-700 p-6 text-white shadow">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-100">
            Fiche d&apos;évaluation à chaud — {session.organisme}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{session.titre}</h1>
          <dl className="mt-3 space-y-0.5 text-sm text-brand-50">
            <div>
              <span className="text-brand-200">Formateur :</span>{" "}
              {session.formateur}
            </div>
            {session.dateDebut && (
              <div>
                <span className="text-brand-200">Date :</span>{" "}
                {session.dateDebut}
              </div>
            )}
            {session.lieu && (
              <div>
                <span className="text-brand-200">Lieu :</span> {session.lieu}
              </div>
            )}
          </dl>
        </header>

        <p className="mt-5 text-sm text-slate-600">
          Indiquez votre degré d&apos;appréciation pour chacun des énoncés
          ci-dessous selon l&apos;échelle&nbsp;:{" "}
          <span className="font-medium text-slate-700">
            1 = Faible · 2 = Moyen · 3 = Assez bien · 4 = Bien · 5 = Très bien
          </span>
          .
        </p>

        {!session.active && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Cette évaluation est actuellement fermée et n&apos;accepte plus de
            réponses.
          </div>
        )}

        {error === "incomplet" && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            Veuillez noter tous les critères avant d&apos;envoyer.
          </div>
        )}
        {error === "fermee" && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            Désolé, cette évaluation est fermée.
          </div>
        )}
        {error === "deja" && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Une réponse a déjà été enregistrée depuis cet appareil. Merci de
            votre participation&nbsp;!
          </div>
        )}

        {session.active && (
          <div className="mt-6">
            <EvalForm slug={session.slug} />
          </div>
        )}
      </div>
    </main></>
  );
}
