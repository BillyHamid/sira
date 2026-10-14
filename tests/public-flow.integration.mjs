// Test HTTP local : crée uniquement une session technique, puis la supprime.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";

const db = new Database((process.env.DATABASE_URL || "file:./dev.db").replace(/^file:/, ""));
const id = randomUUID();
const slug = `verification-${id}`;
const origin = "http://localhost:3000";
try {
  db.prepare("INSERT INTO Session (id, slug, titre, formateur) VALUES (?, ?, ?, ?)").run(id, slug, "Vérification technique temporaire", "Test technique");
  let home = await (await fetch(origin)).text();
  assert.ok(home.includes(`/formations/${slug}`), "La session ouverte doit apparaître");
  const presentation = await fetch(`${origin}/formations/${slug}`);
  assert.equal(presentation.status, 200);
  assert.ok((await presentation.text()).includes(`/eval/${slug}`));
  const thanks = await fetch(`${origin}/eval/${slug}/merci`, { redirect: "manual" });
  assert.equal(thanks.status, 307, "Pas de confirmation sans évaluation enregistrée");
  db.prepare("UPDATE Session SET active = false WHERE id = ?").run(id);
  home = await (await fetch(origin)).text();
  assert.ok(!home.includes(`/formations/${slug}`), "La session fermée doit disparaître");
  const closed = await (await fetch(`${origin}/formations/${slug}`)).text();
  assert.ok(closed.includes("Cette session est fermée"));
  assert.ok(!closed.includes(`href=\"/eval/${slug}\"`));
  const evaluation = await (await fetch(`${origin}/eval/${slug}`)).text();
  assert.ok(!evaluation.includes("Envoyer mon évaluation"));
  console.log("Parcours public validé : visibilité ouverture/fermeture, présentation, formulaire fermé, confirmation protégée.");
} finally {
  db.prepare("DELETE FROM Session WHERE id = ?").run(id);
  db.close();
}
