import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { cleanPlayerName, parseQuestions, quizStatus, scoreAnswers } from "@/lib/quiz";

export const dynamic = "force-dynamic";
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
type Context = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: Context) {
  const { slug } = await context.params;
  const quiz = await prisma.quiz.findUnique({ where: { slug } });
  if (!quiz) return reply({ error: "Quiz introuvable." }, 404);
  const adminRequested = new URL(request.url).searchParams.get("admin") === "1";
  const admin = adminRequested && await isAuthenticated();
  if (adminRequested && !admin) return reply({ error: "Connexion admin requise." }, 401);
  if (quiz.status === "DRAFT" && !admin) return reply({ error: "Ce quiz n’est pas encore ouvert." }, 404);
  const status = quizStatus(quiz);
  const token = (await cookies()).get(`quiz_${quiz.id}`)?.value;
  const player = token ? await prisma.quizPlayer.findFirst({ where: { quizId: quiz.id, tokenHash: hash(token) },
    select: { id: true, name: true, finishedAt: true, score: true, elapsedMs: true } }) : null;
  const questions = parseQuestions(JSON.parse(quiz.questions));
  const count = await prisma.quizPlayer.count({ where: { quizId: quiz.id } });
  const finished = await prisma.quizPlayer.count({ where: { quizId: quiz.id, finishedAt: { not: null } } });
  const candidates = admin || status === "CLOSED" ? await prisma.quizPlayer.findMany({
    where: { quizId: quiz.id, ...(status === "CLOSED" ? { answers: { not: null } } : { finishedAt: { not: null } }) },
    select: { id: true, name: true, score: true, elapsedMs: true },
    orderBy: [{ score: "desc" }, { elapsedMs: "asc" }, { id: "asc" }],
  }) : [];
  const ranking = candidates.map((p) => ({ ...p, elapsedMs: p.elapsedMs ?? quiz.durationSeconds * 1000 }))
    .sort((a, b) => b.score - a.score || a.elapsedMs - b.elapsedMs || a.id.localeCompare(b.id));
  return reply({ title: quiz.title, status, serverNow: Date.now(),
    startedAt: quiz.startedAt?.getTime() ?? null, durationSeconds: quiz.durationSeconds,
    total: questions.length, count, finished: status === "CLOSED" ? ranking.length : finished, ranking,
    player: player ? { id: player.id, name: player.name, finished: !!player.finishedAt,
      ...(status === "CLOSED" ? { score: player.score, elapsedMs: player.elapsedMs } : {}) } : null,
    questions: player && (status === "CLOSED" || (status === "RUNNING" && quiz.startedAt && Date.now() >= quiz.startedAt.getTime())) ? questions.map((q) => ({
      text: q.text, options: q.options, multiple: q.correct.length > 1,
      ...(status === "CLOSED" ? { correct: q.correct } : {}),
    })) : [],
  });
}

export async function POST(request: Request, context: Context) {
  // Next peut normaliser request.url vers localhost en développement ; Host reste celui du navigateur.
  const target = new URL(request.url);
  const expectedOrigin = `${target.protocol}//${request.headers.get("host") ?? target.host}`;
  if (request.headers.get("origin") !== expectedOrigin) return reply({ error: "Origine refusée." }, 403);
  const text = await request.text();
  if (text.length > 16000) return reply({ error: "Requête trop volumineuse." }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return reply({ error: "Requête invalide." }, 400); }
  if (!body || typeof body !== "object") return reply({ error: "Requête invalide." }, 400);
  const { slug } = await context.params;
  const quiz = await prisma.quiz.findUnique({ where: { slug } });
  if (!quiz) return reply({ error: "Quiz introuvable." }, 404);
  const store = await cookies();
  const token = store.get(`quiz_${quiz.id}`)?.value;
  const player = token ? await prisma.quizPlayer.findFirst({ where: { quizId: quiz.id, tokenHash: hash(token) } }) : null;
  if (body.action === "join") {
    if (player) return reply({ ok: true });
    if (quizStatus(quiz) !== "LOBBY") return reply({ error: "Les inscriptions sont fermées." }, 409);
    let name;
    try { name = cleanPlayerName(body.name); } catch (e) { return reply({ error: (e as Error).message }, 400); }
    const secret = randomBytes(32).toString("hex");
    const joined = await prisma.$transaction(async (tx) => {
      // Verrouille la transition du lobby : aucun nouvel inscrit après le départ.
      const gate = await tx.quiz.updateMany({ where: { id: quiz.id, status: "LOBBY" }, data: { status: "LOBBY" } });
      if (!gate.count) return false;
      await tx.quizPlayer.create({ data: { quizId: quiz.id, name, tokenHash: hash(secret) } });
      return true;
    });
    if (!joined) return reply({ error: "Les inscriptions sont fermées." }, 409);
    store.set(`quiz_${quiz.id}`, secret, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 86400 * 7 });
    return reply({ ok: true });
  }
  if (!["submit", "save"].includes(body.action) || !player) return reply({ error: "Inscription requise." }, 401);
  if (player.finishedAt) return reply({ ok: true }); // Réessai réseau sans seconde tentative.
  const now = new Date();
  if (quiz.startedAt && now.getTime() < quiz.startedAt.getTime()) return reply({ error: "Le départ n’a pas encore été donné." }, 409);
  if (quizStatus(quiz, now.getTime()) !== "RUNNING" || !quiz.startedAt) return reply({ error: "Le temps est écoulé ou le quiz est fermé." }, 409);
  try {
    const result = scoreAnswers(parseQuestions(JSON.parse(quiz.questions)), body.answers);
    const version = body.action === "save" ? Number(body.version) : 0;
    if (body.action === "save" && (!Number.isSafeInteger(version) || version <= 0)) return reply({ error: "Sauvegarde invalide." }, 400);
    // Comparaison optimiste : un ancien autosave arrivé en retard n'écrase pas un choix plus récent.
    let current = player;
    for (let retry = 0; retry < 3; retry++) {
      if (current.finishedAt) return reply({ ok: true });
      if (body.action === "save" && current.answers && (JSON.parse(current.answers).version ?? 0) >= version) return reply({ ok: true });
      const saved = await prisma.quizPlayer.updateMany({ where: {
        id: player.id, finishedAt: null, answers: current.answers,
        quiz: { status: "RUNNING", startedAt: { gt: new Date(Date.now() - quiz.durationSeconds * 1000) } },
      }, data: {
        answers: JSON.stringify({ values: result.answers, version }), score: result.score,
        ...(body.action === "submit" ? { elapsedMs: Math.max(0, now.getTime() - quiz.startedAt.getTime()), finishedAt: now } : {}),
      } });
      if (saved.count) return reply({ ok: true });
      const latest = await prisma.quizPlayer.findUnique({ where: { id: player.id } });
      if (!latest || quizStatus(quiz) !== "RUNNING") return reply({ error: "Le quiz est fermé." }, 409);
      current = latest;
    }
    return reply({ error: "Réessayez l’envoi de votre copie." }, 409);
  } catch (e) { return reply({ error: (e as Error).message }, 400); }
}
