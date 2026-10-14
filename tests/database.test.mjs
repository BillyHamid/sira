import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import Database from "better-sqlite3";

test("migrations : 100 réponses distinctes, doublon refusé et téléchargement réautorisé", () => {
  const db = new Database(":memory:");
  try {
    const root = new URL("../prisma/migrations/", import.meta.url);
    for (const directory of readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      db.exec(readFileSync(new URL(`${directory.name}/migration.sql`, root), "utf8"));
    }
    db.prepare("INSERT INTO Session (id, slug, titre, formateur) VALUES (?, ?, ?, ?)").run("s", "test", "Test", "Test");
    const insert = db.prepare(`INSERT INTO Response (id, sessionId, deviceId,
      methodePedagogique, contenuProgramme, competenceFormateur, qualiteAnimation,
      duree, applicationPro, atteinteObjectifs, supportPedagogique)
      VALUES (?, 's', ?, 5, 5, 5, 5, 5, 5, 5, 5)`);
    for (let i = 0; i < 100; i++) insert.run(`r${i}`, `d${i}`);
    assert.throws(() => insert.run("duplicate", "d0"), /UNIQUE constraint/);
    assert.equal(db.prepare("SELECT COUNT(*) AS total FROM Response").get().total, 100);
    db.prepare("INSERT INTO Attestation (id, sessionId, pdfData, fileName, passwordHash) VALUES ('att', 's', ?, 'test.pdf', 'hash')").run(Buffer.from("test"));
    db.exec("INSERT INTO AttestationAccount (id, attestationId, nom, prenom, email, telephone, passwordHash) VALUES ('a', 'att', 'Test', 'Test', 'test@example.com', '123', 'hash')");
    const lock = db.prepare("UPDATE AttestationAccount SET downloadedAt = CURRENT_TIMESTAMP WHERE id = 'a' AND downloadedAt IS NULL");
    assert.equal(lock.run().changes, 1);
    assert.equal(lock.run().changes, 0);
    db.exec("UPDATE AttestationAccount SET downloadedAt = NULL WHERE id = 'a'");
    assert.equal(lock.run().changes, 1);
  } finally { db.close(); }
});
