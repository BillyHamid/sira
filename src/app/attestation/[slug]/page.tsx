import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { gateAction } from "@/lib/attestation-actions";
import {
  getParticipantAccountId,
  hasGatePass,
} from "@/lib/participant-auth";
import { AttestationShell } from "./AttestationShell";
import { AuthTabs } from "./AuthTabs";
import Link from "next/link";
import { hasCompletedEvaluation } from "@/lib/evaluation-progress";
import { Field } from "./ui";
import { Alert, Icon, buttonClass } from "./ui-base";

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
    if (account && att?.active && account.attestationId === att.id) {
      redirect(`/attestation/${slug}/espace`);
    }
  }

  const gated =
    att && att.active ? await hasGatePass(session.id, att.passwordHash) : false;

  const unavailable = !att || !att.active;
  const evaluated = !unavailable && await hasCompletedEvaluation(session.id);

  return (
    <AttestationShell
      titre={session.titre}
      organisme={session.organisme}
      formateur={session.formateur}
      dateDebut={session.dateDebut}
      lieu={session.lieu}
      step={gated ? 2 : 1}
    >
      {unavailable ? (
        <Alert tone="warning">
          L&apos;attestation de cette formation n&apos;est pas disponible pour
          le moment. Rapprochez-vous de l&apos;organisateur.
        </Alert>
      ) : !gated ? (
        // Étape 1 : portail mot de passe temporaire.
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Icon name="lock" className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Accès à votre attestation
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Saisissez le mot de passe temporaire communiqué par
            l&apos;organisateur de la formation.
          </p>
          <form action={gateAction} className="mt-6 space-y-5">
            <input type="hidden" name="slug" value={slug} />
            {(err === "motdepasse" || err === "indispo") && (
              <Alert tone="error">
                {err === "motdepasse"
                  ? "Mot de passe incorrect."
                  : "Attestation indisponible."}
              </Alert>
            )}
            <Field
              id="password"
              name="password"
              label="Mot de passe temporaire"
              type="password"
              icon="lock"
              autoFocus
            />
            <button type="submit" className={buttonClass("primary")}>
              Continuer
            </button>
          </form>
        </div>
      ) : (
        // Étape 2 : créer un compte ou se reconnecter.
        <>
        {!evaluated && <div className="mb-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-800"><p>Avant de créer votre compte, partagez votre avis sur la formation. Si vous possédez déjà un compte, connectez-vous ci-dessous.</p><Link href={`/eval/${slug}`} className="mt-3 inline-block font-semibold underline">Remplir mon évaluation →</Link></div>}
        <AuthTabs
          slug={slug}
          defaultTab={!evaluated || tab === "login" ? "login" : "register"}
          allowRegister={!!evaluated}
          error={err}
        />
        </>
      )}
    </AttestationShell>
  );
}
