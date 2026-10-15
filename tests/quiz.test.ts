import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanPlayerName, parseQuestions, quizStatus, scoreAnswers } from "../src/lib/quiz";

const questions = parseQuestions([
  { text: "Une réponse", options: ["A", "B", "C"], correct: [1] },
  { text: "Deux réponses", options: ["D", "E", "F"], correct: [0, 2] },
]);
test("QCM : les réponses multiples doivent être exactes, sans bonus en cochant tout", () => {
  assert.equal(scoreAnswers(questions, [[1], [2, 0]]).score, 2);
  assert.equal(scoreAnswers(questions, [[1], [0]]).score, 1);
  assert.equal(scoreAnswers(questions, [[0, 1, 2], [0, 1, 2]]).score, 0);
  assert.equal(scoreAnswers(questions, [[], []]).score, 0);
});
test("QCM : les choix falsifiés ou dupliqués sont refusés", () => {
  for (const answers of [[[1], [0, 0]], [[9], []], [["1"], []], [[]], null]) {
    assert.throws(() => scoreAnswers(questions, answers));
  }
});
test("QCM : validation des bonnes réponses et de la taille", () => {
  assert.throws(() => parseQuestions([]));
  assert.throws(() => parseQuestions([{ text: "Question", options: ["A", "B"], correct: [] }]));
  assert.throws(() => parseQuestions([{ text: "Question", options: ["A", "B"], correct: [2] }]));
  assert.throws(() => parseQuestions([{ text: "Question", options: ["A", "B"], correct: [0, 0] }]));
});
test("QCM : la date serveur ferme le quiz exactement à l'échéance", () => {
  const quiz = { status: "RUNNING", startedAt: new Date(1000), durationSeconds: 30 };
  assert.equal(quizStatus(quiz, 30999), "RUNNING");
  assert.equal(quizStatus(quiz, 31000), "CLOSED");
  assert.equal(quizStatus({ ...quiz, status: "LOBBY" }, 99999), "LOBBY");
});
test("QCM : les noms sont normalisés et bornés", () => {
  assert.equal(cleanPlayerName("  OUATTARA   Hamid "), "OUATTARA Hamid");
  assert.throws(() => cleanPlayerName(" "));
  assert.throws(() => cleanPlayerName("a".repeat(101)));
});
