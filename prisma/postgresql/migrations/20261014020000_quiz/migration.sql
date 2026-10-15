CREATE TABLE "Quiz" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sessionId" TEXT,
  "questions" TEXT NOT NULL,
  "durationSeconds" INTEGER NOT NULL DEFAULT 300,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "startedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Quiz_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "QuizPlayer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "quizId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "answers" TEXT,
  "score" INTEGER NOT NULL DEFAULT 0,
  "elapsedMs" INTEGER,
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuizPlayer_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Quiz_slug_key" ON "Quiz"("slug");
CREATE UNIQUE INDEX "QuizPlayer_tokenHash_key" ON "QuizPlayer"("tokenHash");
CREATE INDEX "QuizPlayer_quizId_finishedAt_idx" ON "QuizPlayer"("quizId", "finishedAt");
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizPlayer" ENABLE ROW LEVEL SECURITY;
