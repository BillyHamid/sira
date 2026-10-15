import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseQuestions, quizStatus } from "@/lib/quiz";
import { controlQuiz } from "@/lib/quiz-actions";
import { getShareBaseUrl } from "@/lib/share-url";
import QuizEditor from "@/components/QuizEditor";
import QuizLive from "@/components/QuizLive";
import AdminHeader from "../../AdminHeader";

export const dynamic = "force-dynamic";
export default async function QuizAdminPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz) notFound();
  const status = quizStatus(quiz);
  const sessions = status === "DRAFT" ? await prisma.session.findMany({ select: { id: true, titre: true } }) : [];
  const command = status === "DRAFT" ? "open" : status === "LOBBY" ? "start" : status === "RUNNING" ? "close" : null;
  const label = status === "DRAFT" ? "Ouvrir les inscriptions" : status === "LOBBY" ? "Donner le départ à tous" : "Clôturer et célébrer le gagnant";
  return <><AdminHeader /><main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10"><div><Link href="/admin/quizzes" className="text-sm text-slate-500">← Tous les quiz</Link><h1 className="mt-4 text-4xl font-black">{quiz.title}</h1><p className="mt-3 text-slate-600">{JSON.parse(quiz.questions).length} questions · {quiz.durationSeconds} secondes · Un point par réponse exacte.</p></div>
    <div className="flex flex-wrap gap-3 print:hidden">{command && <form action={controlQuiz}><input type="hidden" name="id" value={id} /><button name="command" value={command} className="rounded-xl bg-cyan-700 px-6 py-3 font-bold text-white">{label}</button></form>}{status === "LOBBY" && <p className="max-w-lg self-center text-sm text-slate-600">Attendez que tous les participants soient inscrits avant de donner le départ. Les inscriptions fermeront au lancement.</p>}</div>
    <QuizLive slug={quiz.slug} shareUrl={`${await getShareBaseUrl()}/quiz/${quiz.slug}`} />
    {status === "DRAFT" && <details className="rounded-2xl border p-5"><summary className="cursor-pointer font-bold">Modifier les questions avant l’ouverture</summary><div className="mt-6"><QuizEditor sessions={sessions} initial={{ ...quiz, questions: parseQuestions(JSON.parse(quiz.questions)) }} /></div></details>}
  </main></>;
}
