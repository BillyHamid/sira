import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParticipantAccountId } from "@/lib/participant-auth";
import { formatParticipantName } from "@/lib/attestation-pdf";
import { MemberHeader } from "./MemberHeader";
import { DownloadButton } from "./DownloadButton";

export const dynamic = "force-dynamic";

export default async function EspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await prisma.session.findUnique({
    where: { slug },
    include: { attestation: true },
  });
  if (!session) notFound();
  const att = session.attestation;

  const accountId = await getParticipantAccountId();
  if (!accountId) redirect(`/attestation/${slug}`);

  const account = await prisma.attestationAccount.findUnique({
    where: { id: accountId },
  });
  if (!account || !att || account.attestationId !== att.id) {
    redirect(`/attestation/${slug}`);
  }

  const downloaded = account!.downloadedAt != null;
  const fullName = formatParticipantName(account!);
  const initials = `${account!.prenom[0] ?? ""}${account!.nom[0] ?? ""}`.toUpperCase();

  return (
    <>
      <MemberHeader
        slug={slug}
        initials={initials}
        name={fullName}
        email={account!.email}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {/* Bienvenue */}
          <h1 className="text-2xl font-bold text-slate-900">
            Bonjour {account!.prenom} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Bienvenue dans votre espace membre Box.academy.
          </p>

          {/* Cartes de synthèse */}
          <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Formation" value={session.titre} />
            <StatCard label="Formateur" value={session.formateur} />
            <StatCard
              label="Attestation"
              value={downloaded ? "Téléchargée" : "Disponible"}
              tone={downloaded ? "done" : "active"}
            />
            <StatCard
              label="Date de la formation"
              value={session.dateDebut || "—"}
            />
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Attestation */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Mon attestation
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Aperçu filigrané ci-dessous. Téléchargez la version propre (sans
                filigrane) — possible <strong>une seule fois</strong>.
              </p>

              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <iframe
                  src={`/api/attestation/${slug}/preview`}
                  title="Aperçu de l'attestation"
                  className="h-[460px] w-full"
                />
              </div>

              {downloaded ? (
                <>
                  <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Version propre déjà téléchargée le{" "}
                    {new Date(account!.downloadedAt!).toLocaleString("fr-FR")}.
                    L&apos;aperçu ci-dessus reste consultable à tout moment.
                  </div>
                  <button
                    disabled
                    className="mt-3 w-full cursor-not-allowed rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-400"
                  >
                    Attestation déjà téléchargée
                  </button>
                </>
              ) : (
                <div className="mt-4">
                  <DownloadButton
                    slug={slug}
                    fileName={`attestation_${fullName
                      .replace(/[^a-z0-9]+/gi, "_")
                      .toLowerCase()}.pdf`}
                  />
                </div>
              )}
            </section>

            {/* Profil + détails formation */}
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800">
                  Mes informations
                </h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <InfoRow label="Nom" value={account!.nom.toUpperCase()} />
                  <InfoRow label="Prénom" value={account!.prenom} />
                  <InfoRow label="Email" value={account!.email} />
                  <InfoRow label="Téléphone" value={account!.telephone} />
                  <InfoRow
                    label="Membre depuis"
                    value={new Date(account!.createdAt).toLocaleDateString(
                      "fr-FR"
                    )}
                  />
                </dl>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800">
                  Détails de la formation
                </h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <InfoRow label="Intitulé" value={session.titre} />
                  <InfoRow label="Organisme" value={session.organisme} />
                  <InfoRow label="Formateur" value={session.formateur} />
                  {session.lieu && <InfoRow label="Lieu" value={session.lieu} />}
                </dl>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "active" | "done";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900">
        {tone && (
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              tone === "done" ? "bg-emerald-500" : "bg-brand-500"
            }`}
          />
        )}
        <span className="truncate" title={value}>
          {value}
        </span>
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-700">{value}</dd>
    </div>
  );
}
