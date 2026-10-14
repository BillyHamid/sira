import { logoutParticipantAction } from "@/lib/attestation-actions";
import { Logo } from "@/components/Logo";
import { Icon } from "../ui-base";

// Barre d'en-tête de l'espace membre : marque + identité + déconnexion.
export function MemberHeader({
  slug,
  initials,
  name,
  email,
}: {
  slug: string;
  initials: string;
  name: string;
  email: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <span className="flex items-center gap-3">
          <Logo iconClassName="h-7 w-7" textClassName="text-base" />
          <span className="hidden rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 sm:inline">
            Espace membre
          </span>
        </span>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-800">
              {name}
            </p>
            <p className="text-xs text-slate-400">{email}</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white ring-2 ring-white shadow">
            {initials}
          </span>
          <form action={logoutParticipantAction}>
            <input type="hidden" name="slug" value={slug} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Icon name="logout" className="h-4 w-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
