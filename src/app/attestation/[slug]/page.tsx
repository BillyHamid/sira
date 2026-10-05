import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gateAction } from "@/lib/attestation-actions";
import {
  getParticipantAccountId,
  hasGatePass,
} from "@/lib/participant-auth";
import { AttestationHeader } from "./AttestationHeader";
import { AuthTabs } from "./AuthTabs";

export const dynamic = "force-dynamic";

export default async function AttestationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ err?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const { err, tab } = await searchParams;

  const session = await prisma.session.findUnique({
    where: { slug },
    include: { attestation: true },
  });
  if (!session) notFound();
  const att = session.attestation;

  // Si déjà connecté → espace.
  const accountId = await getParticipantAccountId();
  if (accountId) {
    const account = await prisma.attestationAccount.findUnique({
      where: { id: accountId },
    });
    if (account && att && account.attestationId === att.id) {
      redirect(`/attestation/${slug}/espace`);
    }
  }

  const gated =
    att && att.active ? await hasGatePass(session.id, att.passwordHash) : false;

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-xl">
        <AttestationHeader
          titre={session.titre}
          organisme={session.organisme}
          formateur={session.formateur}
          dateDebut={session.dateDebut}
          lieu={session.lieu}
        />

        {!att || !att.active ? (
          <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            L&apos;attestation de cette formation n&apos;est pas disponible pour
            le moment. Rapprochez-vous de l&apos;organisateur.
          </div>
        ) : !gated ? (
          // Étape 1 : portail mot de passe temporaire.
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Accès à votre attestation
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Saisissez le mot de passe temporaire communiqué par
              l&apos;organisateur de la formation.
            </p>
            <form action={gateAction} className="mt-5 space-y-4">
              <input type="hidden" name="slug" value={slug} />
              {(err === "motdepasse" || err === "indispo") && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {err === "motdepasse"
                    ? "Mot de passe incorrect."
                    : "Attestation indisponible."}
                </div>
              )}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Mot de passe temporaire
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoFocus
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Continuer
              </button>
            </form>
          </div>
        ) : (
          // Étape 2 : créer un compte ou se reconnecter.
          <div className="mt-6">
            <AuthTabs
              slug={slug}
              defaultTab={tab === "login" ? "login" : "register"}
              error={err}
            />
          </div>
        )}
      </div>
    </main>
  );
}
