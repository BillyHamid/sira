"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { isAuthenticated } from "./auth";
import { parseQuestions } from "./quiz";

export async function saveQuiz(_previous: { error: string }, form: FormData): Promise<{ error: string }> {
  if (!(await isAuthenticated())) return { error: "Connexion admin requise." };
  let id: string;
  try {
    const title = String(form.get("title") ?? "").trim();
    const durationSeconds = Number(form.get("durationSeconds"));
    if (!title || title.length > 160 || !Number.isInteger(durationSeconds) || durationSeconds < 30 || durationSeconds > 7200) {
      return { error: "Un titre et une durée de 30 à 7 200 secondes sont requis." };
    }
    const questions = parseQuestions(JSON.parse(String(form.get("questions"))));
    const sessionId = String(form.get("sessionId") ?? "") || null;
    if (sessionId && !(await prisma.session.findUnique({ where: { id: sessionId }, select: { id: true } }))) return { error: "Formation introuvable." };
    const existingId = String(form.get("id") ?? "");
    const data = { title, durationSeconds, questions: JSON.stringify(questions), sessionId };
    if (existingId) {
      const result = await prisma.quiz.updateMany({ where: { id: existingId, status: "DRAFT" }, data });
      if (!result.count) return { error: "Seul un brouillon peut être modifié." };
      id = existingId;
    } else {
      const quiz = await prisma.quiz.create({ data: { ...data, slug: randomBytes(9).toString("hex") } });
      id = quiz.id;
    }
  } catch (error) {
    return { error: error instanceof SyntaxError ? "Questions invalides." : error instanceof Error ? error.message : "Enregistrement impossible." };
  }
  revalidatePath("/admin/quizzes");
  redirect(`/admin/quizzes/${id}`);
}

export async function controlQuiz(form: FormData) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const id = String(form.get("id"));
  const command = String(form.get("command"));
  // Transitions atomiques : un double clic ne redémarre jamais le chronomètre.
  if (command === "open") await prisma.quiz.updateMany({ where: { id, status: "DRAFT" }, data: { status: "LOBBY" } });
  if (command === "start") await prisma.quiz.updateMany({ where: { id, status: "LOBBY" }, data: { status: "RUNNING", startedAt: new Date(Date.now() + 8000) } });
  if (command === "close") await prisma.quiz.updateMany({ where: { id, status: { in: ["LOBBY", "RUNNING"] } }, data: { status: "CLOSED" } });
  revalidatePath(`/admin/quizzes/${id}`);
  revalidatePath("/admin/quizzes");
}
