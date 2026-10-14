import assert from "node:assert/strict";
import { test } from "node:test";
import { PDFDocument } from "pdf-lib";
import { generateAttestation } from "../src/lib/attestation-pdf";
import { readAttestationPlacement } from "../src/lib/attestation-placement";

test("la création sans coordonnées ne positionne pas le nom à zéro", () => {
  const result = readAttestationPlacement(new FormData());
  assert.equal(result.nameX, 0.5);
  assert.equal(result.nameY, 0.35);
});

test("modifier uniquement le mot de passe conserve le placement existant", () => {
  const existing = { nameX: 0.42, nameY: 0.33, fontSize: 32, align: "left" };
  const data = new FormData();
  data.set("password", "new-password");
  assert.deepEqual(readAttestationPlacement(data, existing), existing);
});

test("génère un PDF valide pour un nom français avec accents", async () => {
  const template = await PDFDocument.create();
  template.addPage();
  const pdf = await generateAttestation({
    pdfData: await template.save(), nameX: 0.5, nameY: 0.5,
    fontSize: 24, align: "center",
  }, { nom: "Kouamé", prenom: "Émilie" });
  assert.equal((await PDFDocument.load(pdf)).getPageCount(), 1);
});

test("un modèle corrompu produit une erreur récupérable par la route", async () => {
  await assert.rejects(generateAttestation({
    pdfData: new Uint8Array([1, 2, 3]), nameX: 0.5, nameY: 0.5,
    fontSize: 24, align: "center",
  }, { nom: "Test", prenom: "Test" }));
});
