import assert from "node:assert/strict";
import { test } from "node:test";
import { EVENT_QUESTIONS, readEventSurvey, validateEventSurvey } from "../src/lib/event-survey";
import { computeStats } from "../src/lib/scoring";

function fixture() {
  return { version: "odoo-event-v1", profile: { entreprise: "Exemple", nom: "TEST", prenom: "Participant", poste: "", telephone: "", email: "test@example.com" },
    answers: Object.fromEntries(EVENT_QUESTIONS.map((q) => [q.key, "non"])), meetingPeriod: "" };
}
test("questionnaire : douze réponses Non restent des réponses complètes", () => {
  const survey = validateEventSurvey(fixture());
  assert.equal(Object.keys(survey.answers).length, 12);
  assert.ok(Object.values(survey.answers).every((a) => a === "non"));
  assert.deepEqual(readEventSurvey(JSON.stringify(survey)), survey);
});
test("questionnaire : refus des réponses manquantes ou falsifiées et des profils invalides", () => {
  const missing = fixture(); delete missing.answers.plateforme;
  assert.throws(() => validateEventSurvey(missing));
  const invalid = fixture(); invalid.answers.plateforme = "peut-être";
  assert.throws(() => validateEventSurvey(invalid));
  const name = fixture(); name.profile.nom = " ";
  assert.throws(() => validateEventSurvey(name));
  const email = fixture(); email.profile.email = "incorrect";
  assert.throws(() => validateEventSurvey(email));
  assert.equal(readEventSurvey("invalid"), null);
});
test("questionnaire : la période de rencontre n'est retenue que si Oui", () => {
  const value = fixture(); value.meetingPeriod = "Semaine prochaine";
  assert.equal(validateEventSurvey(value).meetingPeriod, "");
  value.answers.rencontre = "oui";
  assert.equal(validateEventSurvey(value).meetingPeriod, "Semaine prochaine");
});
test("statistiques : le Oui/Non ne modifie pas les moyennes historiques", () => {
  const notes = { methodePedagogique: 4, contenuProgramme: 4, competenceFormateur: 4,
    qualiteAnimation: 4, duree: 4, applicationPro: 4, atteinteObjectifs: 4, supportPedagogique: 4 };
  const current = { ...notes, surveyData: JSON.stringify(fixture()) };
  const stats = computeStats([notes, current]);
  assert.equal(stats.total, 1);
  assert.equal(stats.moyenneGlobale, 4);
  assert.equal(computeStats([current]).total, 0);
});

test("parcours par blocs : plusieurs besoins et leurs précisions sont conservés", () => {
  const input = { ...fixture(), version: "odoo-event-v2", otherNeeds: "oui", needsDetails: "Audit sécurité et accompagnement IT.", projectDetails: "Nouveau logiciel financier." };
  input.answers.cybersecurite = "oui"; input.answers.services = "oui"; input.answers.modernisation = "oui";
  const result = validateEventSurvey(input);
  assert.equal(result.answers.cybersecurite, "oui");
  assert.equal(result.answers.services, "oui");
  assert.equal(result.needsDetails, input.needsDetails);
  assert.equal(result.projectDetails, input.projectDetails);
});
test("parcours par blocs : Oui exige des précisions, Non supprime les anciennes précisions", () => {
  const input = { ...fixture(), version: "odoo-event-v2", otherNeeds: "oui", needsDetails: "", projectDetails: "" };
  assert.throws(() => validateEventSurvey(input));
  input.answers.cybersecurite = "oui";
  assert.throws(() => validateEventSurvey(input));
  input.needsDetails = "Besoins sécurité."; input.answers.modernisation = "oui";
  assert.throws(() => validateEventSurvey(input));
  input.projectDetails = "Projet ERP."; input.otherNeeds = "non"; input.answers.modernisation = "non";
  const result = validateEventSurvey(input);
  assert.equal(result.answers.cybersecurite, "non");
  assert.equal(result.needsDetails, "");
  assert.equal(result.projectDetails, "");
});
