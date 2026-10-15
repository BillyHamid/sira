// Test HTTP local : copie admin, droits du participant et récupération du PDF sur mobile.
import "dotenv/config";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { PDFDocument } from "pdf-lib";

if (!process.env.DATABASE_URL?.startsWith("file:")) throw new Error("Test réservé à SQLite local.");
const db = new Database(process.env.DATABASE_URL.replace(/^file:/, ""));
const sessionId = randomUUID();
const attestationId = randomUUID();
const accountId = randomUUID();
const slug = `test-download-${sessionId}`;
const origin = "http://localhost:3000";
const secret = process.env.AUTH_SECRET || "change-me-secret";
const digest = (text) => createHash("sha256").update(text).digest("hex");
const admin = { Cookie: `admin_session=${digest(`${process.env.ADMIN_PASSWORD || "box-admin"}::${secret}`)}` };
const participant = { Cookie: `att_session=${accountId}.${digest(`${accountId}::${secret}`)}` };
const adminUrl = `${origin}/api/admin/attestation/download?accountId=${accountId}`;
try {
  const doc = await PDFDocument.create(); doc.addPage();
  db.prepare('INSERT INTO Session (id,slug,titre,formateur) VALUES (?,?,?,?)').run(sessionId, slug, "Test téléchargement", "Test technique");
  db.prepare('INSERT INTO Attestation (id,sessionId,pdfData,fileName,passwordHash) VALUES (?,?,?,?,?)').run(attestationId, sessionId, Buffer.from(await doc.save()), "test.pdf", "unused");
  db.prepare('INSERT INTO AttestationAccount (id,attestationId,nom,prenom,email,telephone,passwordHash) VALUES (?,?,?,?,?,?,?)').run(accountId, attestationId, "TEST", "Mobile", "test@example.com", "000", "unused");

  assert.equal((await fetch(adminUrl)).status, 401);
  assert.equal((await fetch(adminUrl, { headers: participant })).status, 401, "Le participant ne devient pas administrateur");
  assert.equal((await fetch(`${origin}/api/admin/attestation/download?accountId=inconnu`, { headers: admin })).status, 404);
  const copy = await fetch(adminUrl, { headers: admin });
  assert.equal(copy.status, 200);
  assert.ok(copy.headers.get("content-disposition").includes("attestation_test_mobile.pdf"));
  assert.equal((await PDFDocument.load(await copy.arrayBuffer())).getPageCount(), 1);
  assert.equal(db.prepare('SELECT downloadedAt FROM AttestationAccount WHERE id=?').get(accountId).downloadedAt, null, "La copie admin ne consomme aucun droit participant");

  const download = await fetch(`${origin}/api/attestation/${slug}/download`, { headers: participant });
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("content-type"), "application/pdf");
  assert.equal((await PDFDocument.load(await download.arrayBuffer())).getPageCount(), 1);
  assert.equal((await fetch(`${origin}/api/attestation/${slug}/download`, { headers: participant })).status, 403);
  const preview = await fetch(`${origin}/api/attestation/${slug}/preview`, { headers: participant });
  assert.equal(preview.status, 200, "Le PDF reste ouvrable et enregistrable après le premier téléchargement");
  assert.ok(preview.headers.get("content-disposition").startsWith('inline; filename="attestation_test_mobile.pdf"'));
  assert.equal((await PDFDocument.load(await preview.arrayBuffer())).getPageCount(), 1);
  const page = await fetch(`${origin}/attestation/${slug}/espace`, { headers: participant });
  const html = await page.text();
  assert.ok(html.includes("Enregistrer dans Fichiers"));
  assert.ok(html.includes("Ouvrir mon PDF"));
  assert.equal((await fetch(adminUrl, { headers: admin })).status, 200, "L’organisateur peut récupérer une copie déjà téléchargée");
  db.prepare('UPDATE Attestation SET active=0 WHERE id=?').run(attestationId);
  assert.equal((await fetch(`${origin}/api/attestation/${slug}/preview`, { headers: participant })).status, 404);
  assert.equal((await fetch(adminUrl, { headers: admin })).status, 200, "L’admin conserve la main sur une attestation désactivée");
  console.log("Attestations : accès admin protégé, copie admin indépendante, téléchargement unique et récupération inline personnalisée validés.");
} finally {
  db.prepare('DELETE FROM AttestationAccount WHERE attestationId=?').run(attestationId);
  db.prepare('DELETE FROM Attestation WHERE id=?').run(attestationId);
  db.prepare('DELETE FROM Session WHERE id=?').run(sessionId);
  db.close();
}
