import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeStats, appreciation } from "@/lib/scoring";
import { CRITERIA_GROUPS } from "@/lib/criteria";
import { deviceType, deviceLabel } from "@/lib/device";
import { getShareBaseUrl } from "@/lib/share-url";
import {
  toggleSessionAction,
  deleteSessionAction,
} from "@/lib/actions";
import AdminHeader from "../../AdminHeader";
import ShareCard from "./ShareCard";
import AttestationCard from "./AttestationCard";
import {
  GaugeChart,
  RadarProfile,
  CriteriaChart,
  DistributionDonut,
  DistributionLegend,
} from "./Charts";

export const dynamic = "force-dynamic";

export default async function SessionDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attOk?: string; attErr?: string; created?: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const { attOk, attErr, created } = await searchParams;
  const baseUrl = await getShareBaseUrl();

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      responses: { orderBy: { createdAt: "desc" } },
      // On sélectionne uniquement les champs sûrs (pas les octets du PDF).
      attestation: {
        select: {
          fileName: true,
          nameX: true,
          nameY: true,
          fontSize: true,
          align: true,
          active: true,
          accounts: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              telephone: true,
              createdAt: true,
              downloadedAt: true,
            },
          },
        },
      },
    },
  });
  if (!session) notFound();

  const stats = computeStats(session.responses);
  const comments = session.responses.filter(
    (r) => r.commentaire && r.commentaire.trim().length > 0
  );

  // Répartition par type d'appareil (donnée d'audit anonyme).
  const mobileCount = session.responses.filter(
    (r) => deviceType(r.userAgent) === "Mobile"
  ).length;
  const desktopCount = session.responses.filter(
    (r) => deviceType(r.userAgent) === "Ordinateur"
  ).length;

  return (
    <>
      <AdminHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Link
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Retour aux sessions
          </Link>

          {/* Titre + actions */}
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {session.titre}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {session.organisme} · {session.formateur}
                {session.dateDebut ? ` · ${session.dateDebut}` : ""}
                {session.lieu ? ` · ${session.lieu}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/api/admin/export?id=${session.id}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Exporter (CSV)
              </a>
              <form action={toggleSessionAction}>
                <input type="hidden" name="id" value={session.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {session.active ? "Fermer" : "Rouvrir"}
                </button>
              </form>
            </div>
          </div>

          {created === "1" && (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
              <p className="font-semibold">Session créée ✔</p>
              <p className="mt-1">
                Lien à partager aux participants :{" "}
                <a
                  href={`${baseUrl}/eval/${session.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-mono text-brand-700 underline"
                >
                  {`${baseUrl}/eval/${session.slug}`}
                </a>
              </p>
            </div>
          )}

          {session.responses.length === 0 ? (
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
                  Aucune réponse pour l&apos;instant. Partagez le lien ou le QR
                  code ci-contre pour commencer à recueillir des évaluations.
                </div>
              </div>
              <ShareCard slug={session.slug} baseUrl={baseUrl} />
            </div>
          ) : (
            <>
              {/* Cartes chiffres clés */}
              <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Réponses" value={String(stats.total)} />
                <StatCard
                  label="Note moyenne"
                  value={`${stats.moyenneGlobale.toFixed(2)} / 5`}
                />
                <StatCard
                  label="Satisfaction"
                  value={`${stats.pourcentGlobal.toFixed(0)} %`}
                />
                <StatCard
                  label="Appréciation"
                  value={appreciation(stats.moyenneGlobale)}
                />
              </section>

              <div className="mt-8 grid gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                  {/* Jauge de satisfaction + Radar du profil */}
                  <div className="grid gap-8 sm:grid-cols-2">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h2 className="text-sm font-semibold text-slate-800">
                        Satisfaction globale
                      </h2>
                      <div className="mt-3">
                        <GaugeChart
                          pourcent={stats.pourcentGlobal}
                          note={stats.moyenneGlobale}
                        />
                      </div>
                      <p className="mt-2 text-center text-sm font-medium text-brand-700">
                        {appreciation(stats.moyenneGlobale)}
                      </p>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h2 className="text-sm font-semibold text-slate-800">
                        Profil des critères
                      </h2>
                      <div className="mt-3">
                        <RadarProfile data={stats.parCritere} />
                      </div>
                    </section>
                  </div>

                  {/* Histogramme par critère */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-800">
                      Moyenne par critère (sur 5)
                    </h2>
                    <div className="mt-3">
                      <CriteriaChart data={stats.parCritere} />
                    </div>
                  </section>

                  {/* Donut de répartition */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-800">
                      Répartition des notes globales
                    </h2>
                    <div className="mt-3">
                      <DistributionDonut
                        data={stats.distribution}
                        total={stats.total}
                      />
                    </div>
                    <div className="mt-4">
                      <DistributionLegend />
                    </div>
                  </section>

                  {/* Tableau détaillé par critère */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-800">
                      Détail par critère
                    </h2>
                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2 font-medium">Critère</th>
                            <th className="px-3 py-2 font-medium">Moyenne</th>
                            <th className="px-3 py-2 font-medium">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {CRITERIA_GROUPS.map((group) => (
                            <GroupRows
                              key={group}
                              group={group}
                              stats={stats.parCritere}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* Commentaires */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-slate-800">
                      Commentaires ({comments.length})
                    </h2>
                    <div className="mt-3 space-y-3">
                      {comments.length === 0 && (
                        <p className="text-sm text-slate-500">
                          Aucun commentaire pour l&apos;instant.
                        </p>
                      )}
                      {comments.map((r) => (
                        <blockquote
                          key={r.id}
                          className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        >
                          <p>&laquo; {r.commentaire} &raquo;</p>
                          <footer className="mt-1 text-xs text-slate-400">
                            Anonyme · {deviceType(r.userAgent)} ·{" "}
                            {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                          </footer>
                        </blockquote>
                      ))}
                    </div>
                  </section>

                  {/* Audit technique anonyme */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-slate-800">
                        Audit des réponses
                      </h2>
                      <span className="text-xs text-slate-500">
                        📱 {mobileCount} mobile · 💻 {desktopCount} ordinateur
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Données techniques anonymes (aucun nom). Un appareil ne
                      peut envoyer qu&apos;une seule réponse.
                    </p>
                    <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2 font-medium">Date</th>
                            <th className="px-3 py-2 font-medium">Appareil</th>
                            <th className="px-3 py-2 font-medium">Adresse IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {session.responses.map((r) => (
                            <tr key={r.id}>
                              <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                                {new Date(r.createdAt).toLocaleString("fr-FR")}
                              </td>
                              <td className="px-3 py-2 text-slate-700">
                                {deviceLabel(r.userAgent)}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs text-slate-500">
                                {r.ipAddress || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                {/* Colonne latérale : partage */}
                <div>
                  <ShareCard slug={session.slug} baseUrl={baseUrl} />
                </div>
              </div>
            </>
          )}

          {/* Attestation de formation */}
          <div className="mt-8">
            <AttestationCard
              sessionId={session.id}
              slug={session.slug}
              baseUrl={baseUrl}
              attestation={session.attestation}
              accounts={session.attestation?.accounts ?? []}
              feedback={{ ok: attOk === "1", err: attErr }}
            />
          </div>

          {/* Zone dangereuse */}
          <section className="mt-12 rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="text-sm font-semibold text-red-700">
              Supprimer la session
            </h2>
            <p className="mt-1 text-xs text-red-600">
              Cette action supprime définitivement la session et toutes ses
              réponses. Pensez à exporter les données avant.
            </p>
            <form action={deleteSessionAction} className="mt-3">
              <input type="hidden" name="id" value={session.id} />
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Supprimer définitivement
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function GroupRows({
  group,
  stats,
}: {
  group: string;
  stats: { key: string; label: string; group: string; moyenne: number; pourcent: number }[];
}) {
  const rows = stats.filter((s) => s.group === group);
  return (
    <>
      <tr className="bg-brand-50/50">
        <td
          colSpan={3}
          className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700"
        >
          {group}
        </td>
      </tr>
      {rows.map((s) => (
        <tr key={s.key}>
          <td className="px-3 py-2 text-slate-700">{s.label}</td>
          <td className="px-3 py-2 font-medium text-slate-900">
            {s.moyenne.toFixed(2)}
          </td>
          <td className="px-3 py-2 text-slate-500">
            {s.pourcent.toFixed(0)} %
          </td>
        </tr>
      ))}
    </>
  );
}
