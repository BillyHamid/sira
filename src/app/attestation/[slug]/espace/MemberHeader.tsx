import { logoutParticipantAction } from "@/lib/attestation-actions";
import { Logo } from "@/components/Logo";

// Barre d'en-tête du dashboard espace membre : marque + identité + déconnexion.
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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <span className="flex items-center gap-3">
          <Logo iconClassName="h-7 w-7" textClassName="text-base" />
          <span className="hidden text-sm text-slate-400 sm:inline">
            | Espace membre
          </span>
        </span>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-800">
              {name}
            </p>
            <p className="text-xs text-slate-400">{email}</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
            {initials}
          </span>
          <form action={logoutParticipantAction}>
            <input type="hidden" name="slug" value={slug} />
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
