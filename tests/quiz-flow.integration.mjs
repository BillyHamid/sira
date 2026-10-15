// Test HTTP local uniquement. Ne jamais pointer vers une base de production.
import "dotenv/config";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import Database from "better-sqlite3";

if (!process.env.DATABASE_URL?.startsWith("file:")) throw new Error("SQLite local requis.");
const db = new Database(process.env.DATABASE_URL.replace(/^file:/, ""));
const id = randomUUID();
const slug = `quiz-test-${id}`;
const origin = "http://127.0.0.1:3000";
const questions = JSON.stringify([{ text: "Compte de trésorerie ?", options: ["Banque", "Capital", "Stock"], correct: [0] },
  { text: "Actifs ?", options: ["Banque", "Stock", "Capital"], correct: [0, 1] }]);
async function call(method, body, cookie = "", query = "") {
  const response = await fetch(`${origin}/api/quiz/${slug}${query}`, { method,
    headers: { Origin: origin, "Content-Type": "application/json", Cookie: cookie },
    ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
try {
  db.prepare('INSERT INTO Quiz (id,slug,title,questions,durationSeconds) VALUES (?,?,?,?,300)').run(id, slug, "Quiz technique", questions);
  assert.equal((await call("GET")).status, 404, "Brouillon invisible");
  assert.equal((await call("GET", null, "", "?admin=1")).status, 401, "Classement admin protégé");
  db.prepare("UPDATE Quiz SET status='LOBBY' WHERE id=?").run(id);
  const lobby = await call("GET");
  assert.deepEqual(lobby.data.questions, [], "Questions cachées avant le départ");
  assert.equal((await call("POST", { action: "join", name: " " })).status, 400);
  const joined = await call("POST", { action: "join", name: "TEST Émilie" });
  assert.equal(joined.status, 200);
  const cookie = joined.cookie;
  assert.ok(cookie);
  const unfinished = await call("POST", { action: "join", name: "Copie sauvegardée" });
  assert.equal((await call("POST", { action: "submit", answers: [[0], [0, 1]] }, cookie)).status, 409);
  db.prepare("UPDATE Quiz SET status='RUNNING', startedAt=? WHERE id=?").run(new Date(Date.now() + 8000).toISOString(), id);
  assert.deepEqual((await call("GET", null, cookie)).data.questions, [], "Questions cachées pendant le compte à rebours");
  assert.equal((await call("POST", { action: "submit", answers: [[0], [0, 1]] }, cookie)).status, 409);
  db.prepare("UPDATE Quiz SET startedAt=? WHERE id=?").run(new Date(Date.now() - 1000).toISOString(), id);
  const running = await call("GET", null, cookie);
  assert.equal(running.data.questions.length, 2);
  assert.ok(!JSON.stringify(running.data.questions).includes('"correct"'), "Bonnes réponses absentes du JSON");
  assert.equal((await call("POST", { action: "join", name: "Arrivée tardive" })).status, 409);
  assert.equal((await call("POST", { action: "submit", answers: [[0], [1, 1]] }, cookie)).status, 400);
  assert.equal((await call("POST", { action: "save", version: 2, answers: [[0], [0, 1]] }, cookie)).status, 200);
  await call("POST", { action: "save", version: 1, answers: [[], []] }, cookie);
  assert.equal(db.prepare('SELECT score FROM QuizPlayer WHERE quizId=? AND name=?').get(id, "TEST Émilie").score, 2, "Autosave obsolète ignoré");
  const response = await call("POST", { action: "submit", answers: [[0], [0, 1]] }, cookie);
  assert.equal(response.status, 200);
  const recorded = db.prepare('SELECT score,elapsedMs FROM QuizPlayer WHERE quizId=? AND name=?').get(id, "TEST Émilie");
  assert.equal(recorded.score, 2);
  assert.ok(recorded.elapsedMs >= 1000);
  await call("POST", { action: "submit", answers: [[], []] }, cookie);
  assert.equal(db.prepare('SELECT score FROM QuizPlayer WHERE quizId=? AND name=?').get(id, "TEST Émilie").score, 2, "Copie verrouillée");
  assert.equal((await call("POST", { action: "save", version: 1, answers: [[0], []] }, unfinished.cookie)).status, 200);
  assert.equal((await call("GET", null, cookie)).data.player.score, undefined, "Score caché avant clôture");

  // 100 participants simulés avec leurs jetons privés : requêtes HTTP concurrentes par vagues de 20.
  const tokens = Array.from({ length: 100 }, () => randomUUID());
  const insert = db.prepare('INSERT INTO QuizPlayer (id,quizId,name,tokenHash) VALUES (?,?,?,?)');
  tokens.forEach((token, i) => insert.run(randomUUID(), id, `Simulation ${i}`, createHash("sha256").update(token).digest("hex")));
  for (let start = 0; start < 100; start += 20) {
    const results = await Promise.all(tokens.slice(start, start + 20).map((token) => call("POST", { action: "submit", answers: [[0], []] }, `quiz_${id}=${token}`)));
    assert.ok(results.every((r) => r.status === 200), "Les 100 copies sont acceptées");
  }
  db.prepare("UPDATE Quiz SET startedAt=? WHERE id=?").run(new Date(Date.now() - 301000).toISOString(), id);
  const closed = await call("GET", null, cookie);
  assert.equal(closed.data.status, "CLOSED");
  assert.equal(closed.data.ranking.length, 102);
  assert.equal(closed.data.ranking[0].name, "TEST Émilie");
  assert.equal(closed.data.player.score, 2);
  assert.deepEqual(closed.data.questions[1].correct, [0, 1]);
  const timedOut = closed.data.ranking.find((p) => p.name === "Copie sauvegardée");
  assert.equal(timedOut.score, 1);
  assert.equal(timedOut.elapsedMs, 300000, "Copie non validée : temps maximal");
  assert.equal((await call("POST", { action: "submit", answers: [[0], [0, 1]] }, unfinished.cookie)).status, 409);
  console.log("Quiz HTTP validé : accès, départ, réponses cachées, sauvegarde ordonnée, score, copie unique, 100 copies, podium et expiration.");
} finally {
  db.prepare('DELETE FROM QuizPlayer WHERE quizId=?').run(id);
  db.prepare('DELETE FROM Quiz WHERE id=?').run(id);
  db.close();
}
