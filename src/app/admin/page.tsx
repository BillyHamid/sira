import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSessionAction } from "@/lib/actions";
import { computeStats, appreciation } from "@/lib/scoring";
import AdminHeader from "./AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const { error } = await searchParams;

  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    include: { responses: true },
  });

  const allResponses = sessions.flatMap((s) => s.responses);
  const global = computeStats(allResponses);

  return (
    <>
      <AdminHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">
          {/* Statistiques globales */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Sessions" value={String(sessions.length)} />
            <StatCard
              label="Réponses totales"
              value={String(allResponses.length)}
            />
            <StatCard
              label="Note moyenne"
              value={
                global.total > 0
                  ? `${global.moyenneGlobale.toFixed(2)} / 5`
                  : "—"
              }
            />
            <StatCard
              label="Satisfaction"
              value={
                global.total > 0
                  ? `${global.pourcentGlobal.toFixed(0)} %`
                  : "—"
              }
              hint={global.total > 0 ? appreciation(global.moyenneGlobale) : undefined}
            />
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Liste des sessions */}
            <section className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-800">
                Sessions de formation
              </h2>
              <div className="mt-4 space-y-3">
                {sessions.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    Aucune session pour l&apos;instant. Créez-en une à droite
                    pour obtenir un lien à partager.
                  </p>
                )}
                {sessions.map((s) => {
                  const stats = computeStats(s.responses);
                  return (
                    <Link
                      key={s.id}
                      href={`/admin/sessions/${s.id}`}
                      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-400 hover:shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {s.titre}
                          </p>
                          <p className="text-sm text-slate-500">
                            {s.formateur}
                            {s.dateDebut ? ` · ${s.dateDebut}` : ""}
                            {s.lieu ? ` · ${s.lieu}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            s.active
                              ? "bg-brand-100 text-brand-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {s.active ? "Ouverte" : "Fermée"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                        <span>
                          <strong>{s.responses.length}</strong> réponse
                          {s.responses.length > 1 ? "s" : ""}
                        </span>
                        <span>
                          Moyenne :{" "}
                          <strong>
                            {stats.total > 0
                              ? `${stats.moyenneGlobale.toFixed(2)}/5`
                              : "—"}
                          </strong>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Création d'une session */}
            <section>
              <h2 className="text-lg font-semibold text-slate-800">
                Nouvelle session
              </h2>
              <form
                action={createSessionAction}
                className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                {error === "champs" && (
                  <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    L&apos;intitulé et le formateur sont obligatoires.
                  </div>
                )}
                <Field name="titre" label="Intitulé de la formation" required placeholder="Ex : Formation TIC" />
                <Field name="formateur" label="Formateur (Nom & Prénom)" required placeholder="Ex : YAMEOGO Sylvain" />
                <Field name="organisme" label="Organisme formateur" defaultValue="BOX AFRICA" />
                <Field name="dateDebut" label="Date / période" placeholder="Ex : 16 au 17/05/2025" />
                <Field name="lieu" label="Lieu" placeholder="Ex : Ouagadougou" />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Créer la session
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="text-xs text-brand-600">{hint}</p>}
    </div>
  );
}

function Field({
  name,
  label,
  required,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />
    </div>
  );
}
