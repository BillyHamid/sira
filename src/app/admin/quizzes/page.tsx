import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quizStatus } from "@/lib/quiz";
import QuizEditor from "@/components/QuizEditor";
import AdminHeader from "../AdminHeader";

export const dynamic = "force-dynamic";
export default async function QuizzesPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const [quizzes, sessions] = await Promise.all([
    prisma.quiz.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { players: true } }, session: { select: { titre: true } } } }),
    prisma.session.findMany({ select: { id: true, titre: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return <><AdminHeader /><main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10"><div><Link href="/admin" className="text-sm text-slate-500">← Administration</Link><h1 className="mt-4 text-4xl font-black">Quiz en direct</h1><p className="mt-3 text-slate-600">Créez vos QCM, réunissez les participants et révélez votre podium.</p></div><section className="space-y-3"><h2 className="text-xl font-bold">Vos quiz</h2>{!quizzes.length && <p className="rounded-xl border border-dashed p-6 text-slate-500">Créez votre première partie ci-dessous.</p>}{quizzes.map((q) => <Link key={q.id} href={`/admin/quizzes/${q.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div><h3 className="font-bold">{q.title}</h3><p className="text-sm text-slate-500">{q.session?.titre ?? "Quiz indépendant"} · {q._count.players} inscrits</p></div><span className="rounded-full bg-cyan-50 px-3 py-1 text-sm text-cyan-800">{({ DRAFT: "Brouillon", LOBBY: "Inscriptions ouvertes", RUNNING: "En cours", CLOSED: "Terminé" } as Record<string, string>)[quizStatus(q)]}</span></Link>)}</section><section><h2 className="mb-6 text-2xl font-bold">Nouveau quiz</h2><QuizEditor sessions={sessions} /></section></main></>;
}
