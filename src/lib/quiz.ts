export type QuizQuestion = { text: string; options: string[]; correct: number[] };
export type QuizAnswers = number[][];

export function parseQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 40) throw new Error("Ajoutez entre 1 et 40 questions.");
  return value.map((q) => {
    if (!q || typeof q.text !== "string" || !q.text.trim() || q.text.length > 500 ||
      !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6 ||
      q.options.some((o: unknown) => typeof o !== "string" || !o.trim() || o.length > 300) ||
      !Array.isArray(q.correct) || !q.correct.length ||
      new Set(q.correct).size !== q.correct.length ||
      q.correct.some((n: unknown) => !Number.isInteger(n) || Number(n) < 0 || Number(n) >= q.options.length)) {
      throw new Error("Chaque question nécessite 2 à 6 choix et au moins une bonne réponse.");
    }
    return { text: q.text.trim(), options: q.options.map((o: string) => o.trim()), correct: q.correct };
  });
}

export function scoreAnswers(questions: QuizQuestion[], value: unknown): { answers: QuizAnswers; score: number } {
  if (!Array.isArray(value) || value.length !== questions.length) throw new Error("Réponses invalides.");
  let score = 0;
  const answers = questions.map((q, i) => {
    const choice = value[i];
    if (!Array.isArray(choice) || new Set(choice).size !== choice.length || choice.some((n) =>
      !Number.isInteger(n) || n < 0 || n >= q.options.length)) throw new Error("Choix invalide.");
    if (choice.length === q.correct.length && q.correct.every((n) => choice.includes(n))) score++;
    return choice as number[];
  });
  return { answers, score };
}

export function quizStatus(quiz: { status: string; startedAt: Date | null; durationSeconds: number }, now = Date.now()) {
  if (quiz.status === "RUNNING" && quiz.startedAt && now >= quiz.startedAt.getTime() + quiz.durationSeconds * 1000) return "CLOSED";
  return quiz.status;
}

// Le nom sert uniquement à l'affichage. L'identité d'une tentative repose sur son jeton privé.
export function cleanPlayerName(value: unknown) {
  if (typeof value !== "string") throw new Error("Indiquez votre nom et prénom.");
  const name = value.replace(/\s+/g, " ").trim();
  if (name.length < 3 || name.length > 100) throw new Error("Le nom doit contenir entre 3 et 100 caractères.");
  return name;
}
