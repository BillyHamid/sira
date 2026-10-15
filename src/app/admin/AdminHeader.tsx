import Link from "next/link";
import { logoutAction } from "@/lib/actions";
import { Logo } from "@/components/Logo";

export default function AdminHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/admin" className="flex items-center gap-3">
          <Logo iconClassName="h-7 w-7" textClassName="text-base" />
          <span className="hidden text-sm text-slate-400 sm:inline">
            | Administration des évaluations
          </span>
        </Link>
        <Link href="/admin/quizzes" className="rounded-lg px-3 py-2 text-sm font-semibold text-cyan-800">Quiz live</Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
