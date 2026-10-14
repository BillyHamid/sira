import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getParticipantAccountId } from "@/lib/participant-auth";
import { formatParticipantName } from "@/lib/attestation-pdf";
import { MemberHeader } from "./MemberHeader";
import { DownloadButton } from "./DownloadButton";
import { Alert, Icon, buttonClass } from "../ui-base";

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
  if (!account || !att || !att.active || account.attestationId !== att.id) {
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

      <main className="flex-1 pb-16">
        {/* Bandeau d'accueil */}
        <section className="relative isolate overflow-hidden bg-linear-to-br from-slate-950 via-brand-900 to-brand-700 text-white">
          <div className="bg-grid absolute inset-0 -z-10 opacity-70 [mask-image:linear-gradient(to_right,black,transparent_80%)]" />
          <div className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
          <div className="animate-fade-up mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-12">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur ${
                downloaded
                  ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-100"
                  : "border-white/15 bg-white/10 text-brand-100"
              }`}
            >
              <Icon
                name={downloaded ? "check" : "award"}
                className="h-3.5 w-3.5"
              />
              {downloaded ? "Attestation téléchargée" : "Attestation disponible"}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Bonjour {account!.prenom} 👋
            </h1>
            <p className="mt-2 max-w-2xl text-brand-100/85">
              Voici votre attestation pour la formation{" "}
              <strong className="font-semibold text-white">
                {session.titre}
              </strong>
              .
            </p>
            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-50">
              <Chip icon="user" value={session.formateur} />
              {session.dateDebut && (
                <Chip icon="calendar" value={session.dateDebut} />
              )}
              {session.lieu && <Chip icon="pin" value={session.lieu} />}
            </dl>
          </div>
        </section>

        <div className="mx-auto -mt-16 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
          {/* Attestation */}
          <section className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-6 lg:col-span-2">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Icon name="award" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Mon attestation
                </h2>
                <p className="text-sm text-slate-500">
                  Retrouvez ci-dessous votre attestation personnalisée avec votre nom et prénom.
                </p>
              </div>
            </div>

            {/* Document présenté comme une feuille posée sur un plan de travail */}
            <div className="mt-5 rounded-xl bg-slate-100 p-3 ring-1 ring-inset ring-slate-200 sm:p-5">
              <div className="overflow-hidden rounded-lg bg-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-200">
                <iframe
                  src={`/api/attestation/${slug}/preview`}
                  title="Aperçu de l'attestation"
                  className="h-[320px] w-full sm:h-[460px]"
                />
              </div>
              <a
                href={`/api/attestation/${slug}/preview`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline"
              >
                <Icon name="eye" className="h-4 w-4" />
                Ouvrir l&apos;aperçu en plein écran
              </a>
            </div>

            <div className="mt-5">
              {downloaded ? (
                <div className="space-y-3">
                  <Alert tone="warning">
                    Attestation téléchargée le{" "}
                    {new Date(account!.downloadedAt!).toLocaleString("fr-FR")}.
                    L&apos;aperçu ci-dessus reste consultable à tout moment.
                  </Alert>
                  <button disabled className={buttonClass("disabled")}>
                    <Icon name="check" className="h-5 w-5" />
                    Attestation déjà téléchargée
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-3.5 py-3 text-sm text-brand-800 ring-1 ring-inset ring-brand-100">
                    <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Le téléchargement depuis ce bouton n&apos;est possible
                      qu&apos;<strong className="font-semibold">une seule fois</strong>.
                      Enregistrez bien le fichier.
                    </span>
                  </p>
                  <DownloadButton
                    slug={slug}
                    fileName={`attestation_${fullName
                      .replace(/[^a-z0-9]+/gi, "_")
                      .toLowerCase()}.pdf`}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Profil + détails formation */}
          <div className="animate-fade-up space-y-6 [animation-delay:80ms]">
            <Panel title="Mes informations">
              <InfoRow icon="user" label="Nom" value={account!.nom.toUpperCase()} />
              <InfoRow icon="user" label="Prénom" value={account!.prenom} />
              <InfoRow icon="mail" label="Email" value={account!.email} />
              <InfoRow icon="phone" label="Téléphone" value={account!.telephone} />
              <InfoRow
                icon="calendar"
                label="Membre depuis"
                value={new Date(account!.createdAt).toLocaleDateString("fr-FR")}
              />
            </Panel>

            <Panel title="Détails de la formation">
              <InfoRow icon="award" label="Intitulé" value={session.titre} />
              <InfoRow icon="shield" label="Organisme" value={session.organisme} />
              <InfoRow icon="user" label="Formateur" value={session.formateur} />
              {session.lieu && (
                <InfoRow icon="pin" label="Lieu" value={session.lieu} />
              )}
            </Panel>
          </div>
        </div>
      </main>
    </>
  );
}

function Chip({
  icon,
  value,
}: {
  icon: "user" | "calendar" | "pin";
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} className="h-4 w-4 text-brand-200" />
      <dd>{value}</dd>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <dl className="mt-4 space-y-3.5">{children}</dl>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: "user" | "calendar" | "pin" | "mail" | "phone" | "award" | "shield";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-slate-100">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-slate-400">{label}</dt>
        <dd className="truncate text-sm font-medium text-slate-800" title={value}>
          {value}
        </dd>
      </div>
    </div>
  );
}
