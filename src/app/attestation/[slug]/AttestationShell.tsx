import { Logo } from "@/components/Logo";
import { BrandBackdrop } from "@/components/BrandBackdrop";
import { Icon } from "./ui-base";

const STEPS = [
  { title: "Accès", text: "Mot de passe de la formation" },
  { title: "Compte", text: "Vos informations" },
  { title: "Attestation", text: "Aperçu et téléchargement" },
];

// Mise en page des écrans d'accès à l'attestation : panneau de marque sombre
// (formation + étapes) à gauche, contenu à droite. Empilé sur mobile.
export function AttestationShell({
  titre,
  organisme,
  formateur,
  dateDebut,
  lieu,
  step,
  children,
}: {
  titre: string;
  organisme: string;
  formateur: string;
  dateDebut?: string | null;
  lieu?: string | null;
  step: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col lg:grid lg:grid-cols-[5fr_6fr]">
      {/* Panneau de marque */}
      <aside className="relative isolate overflow-hidden bg-linear-to-br from-slate-950 via-brand-900 to-brand-700 px-6 py-8 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div className="bg-grid absolute inset-0 -z-10 opacity-70 [mask-image:linear-gradient(to_bottom_right,black,transparent_75%)]" />
        <BrandBackdrop />

        <Logo tone="light" iconClassName="h-8 w-8" textClassName="text-lg" />

        <div
          className="animate-fade-up mt-6 [animation-delay:150ms] lg:mt-0"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-brand-100 backdrop-blur">
            <Icon name="award" className="h-3.5 w-3.5" />
            Attestation de formation
          </p>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:mt-4 lg:text-[2.6rem]">
            {titre}
          </h1>
          <p className="mt-1.5 text-sm text-brand-100/80 lg:hidden">
            {[organisme, formateur, dateDebut, lieu].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-2 hidden text-sm text-brand-100/80 lg:block">
            {organisme}
          </p>

          <dl className="mt-6 hidden space-y-3 text-sm lg:block">
            <Detail icon="user" label="Formateur" value={formateur} />
            {dateDebut && (
              <Detail icon="calendar" label="Période" value={dateDebut} />
            )}
            {lieu && <Detail icon="pin" label="Lieu" value={lieu} />}
          </dl>
        </div>

        {/* Étapes */}
        <ol className="animate-fade-up mt-6 grid grid-cols-3 gap-3 [animation-delay:350ms] lg:mt-0 lg:grid-cols-1 lg:gap-0">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const state =
              n < step ? "done" : n === step ? "current" : "todo";
            return (
              <li
                key={s.title}
                className="relative flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4 lg:pb-5 lg:last:pb-0"
              >
                {n < STEPS.length && (
                  <span
                    className={`absolute left-4 top-9 hidden h-[calc(100%-2rem)] w-px lg:block ${
                      state === "done" ? "bg-brand-300" : "bg-white/15"
                    }`}
                  />
                )}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                    state === "done"
                      ? "bg-brand-400 text-slate-950"
                      : state === "current"
                        ? "anim-step-pulse bg-white text-brand-800 ring-4 ring-white/20"
                        : "border border-white/25 text-white/60"
                  }`}
                >
                  {state === "done" ? (
                    <Icon name="check" className="h-4 w-4" />
                  ) : (
                    n
                  )}
                </span>
                <span>
                  <span
                    className={`block text-sm font-semibold ${
                      state === "todo" ? "text-white/60" : "text-white"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="hidden text-xs text-brand-100/70 lg:block">
                    {s.text}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* Contenu */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="animate-fade-up w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: "user" | "calendar" | "pin";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-200 ring-1 ring-white/10">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <div>
        <dt className="text-xs uppercase tracking-wide text-brand-100/60">
          {label}
        </dt>
        <dd className="font-medium text-white">{value}</dd>
      </div>
    </div>
  );
}
