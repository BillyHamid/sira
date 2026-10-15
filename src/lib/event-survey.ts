export const EVENT_QUESTIONS = [
  { key: "plateforme", text: "La présentation vous a-t-elle permis de comprendre la plateforme Odoo et ses capacités ?", group: "Votre expérience Odoo" },
  { key: "modules", text: "La démonstration des modules métiers Odoo vous a-t-elle été utile ?", group: "Votre expérience Odoo" },
  { key: "casUsage", text: "Les cas d’usage présentés sont-ils pertinents pour votre activité ?", group: "Votre expérience Odoo" },
  { key: "echanges", text: "Êtes-vous satisfait de la qualité des interventions et des échanges ?", group: "Votre expérience Odoo" },
  { key: "expertise", text: "Êtes-vous satisfait de l’expertise des formateurs et intervenants ?", group: "Votre expérience Odoo" },
  { key: "cybersecurite", text: "Avez-vous un besoin à adresser prochainement en cybersécurité (performance, intrusion) ?", group: "Vos besoins" },
  { key: "services", text: "Avez-vous un besoin en services managés (mise en régie, assistance) ?", group: "Vos besoins" },
  { key: "formation", text: "Avez-vous un besoin en renforcement de capacités (formations, coaching IT) ?", group: "Vos besoins" },
  { key: "digitalisation", text: "Avez-vous un besoin en digitalisation métiers ou BI (applications, automatisation, IA appliquée) ?", group: "Vos besoins" },
  { key: "infrastructure", text: "Avez-vous un besoin en infrastructures IT (serveurs, réseaux, datacenter) ?", group: "Vos besoins" },
  { key: "modernisation", text: "Votre organisation envisage-t-elle un projet de modernisation de sa gestion financière ?", group: "Vos projets" },
  { key: "rencontre", text: "Souhaitez-vous une rencontre personnalisée avec Box.africa ?", group: "Restons en contact" },
] as const;

export const PROFILE_FIELDS = [
  { key: "entreprise", label: "Entité / Entreprise", required: false },
  { key: "nom", label: "Nom", required: true },
  { key: "prenom", label: "Prénom(s)", required: true },
  { key: "poste", label: "Fonction / Poste", required: false },
  { key: "telephone", label: "Téléphone portable", required: false },
  { key: "email", label: "Mail professionnel", required: false },
] as const;

export const NEED_OPTIONS = [
  { key: "cybersecurite", label: "Cybersécurité (performance, intrusion)" },
  { key: "services", label: "Services managés (mise en régie, assistance)" },
  { key: "formation", label: "Renforcement de capacités (formations, coaching IT)" },
  { key: "digitalisation", label: "Digitalisation métiers et BI (applications, automatisation, IA appliquée)" },
  { key: "infrastructure", label: "Infrastructures IT (serveurs, réseaux, datacenter)" },
] as const;

export type EventSurvey = {
  version: "odoo-event-v1" | "odoo-event-v2";
  profile: Record<(typeof PROFILE_FIELDS)[number]["key"], string>;
  answers: Record<string, "oui" | "non">;
  meetingPeriod: string;
  otherNeeds?: "oui" | "non";
  needsDetails?: string;
  projectDetails?: string;
};

export function validateEventSurvey(input: unknown): EventSurvey {
  if (!input || typeof input !== "object") throw new Error("Questionnaire invalide.");
  const value = input as Partial<EventSurvey>;
  if (!["odoo-event-v1", "odoo-event-v2"].includes(value.version ?? "") || !value.profile || !value.answers) throw new Error("Questionnaire invalide.");
  const profile = {} as EventSurvey["profile"];
  for (const field of PROFILE_FIELDS) {
    const text = value.profile[field.key];
    if (typeof text !== "string" || text.length > 200 || (field.required && !text.trim())) throw new Error(`Vérifiez le champ « ${field.label} ».`);
    profile[field.key] = text.trim();
  }
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) throw new Error("Vérifiez votre adresse email.");
  const answers: EventSurvey["answers"] = {};
  for (const q of EVENT_QUESTIONS) {
    const answer = value.answers[q.key];
    if (answer !== "oui" && answer !== "non") throw new Error("Répondez Oui ou Non à chaque question.");
    answers[q.key] = answer;
  }
  if (typeof value.meetingPeriod !== "string" || value.meetingPeriod.length > 200) throw new Error("Période souhaitée invalide.");
  const result: EventSurvey = { version: value.version!, profile, answers, meetingPeriod: answers.rencontre === "oui" ? value.meetingPeriod.trim() : "" };
  if (value.version === "odoo-event-v2") {
    if (value.otherNeeds !== "oui" && value.otherNeeds !== "non") throw new Error("Indiquez si vous avez d’autres problématiques.");
    result.otherNeeds = value.otherNeeds;
    for (const key of ["needsDetails", "projectDetails"] as const) {
      if (typeof value[key] !== "string" || value[key].length > 3000) throw new Error("Les précisions sont limitées à 3 000 caractères.");
    }
    if (value.otherNeeds === "oui") {
      if (!NEED_OPTIONS.some((n) => answers[n.key] === "oui")) throw new Error("Choisissez au moins une problématique.");
      if (!value.needsDetails!.trim()) throw new Error("Décrivez vos problématiques en quelques lignes.");
      result.needsDetails = value.needsDetails!.trim();
    } else {
      NEED_OPTIONS.forEach((n) => { answers[n.key] = "non"; });
      result.needsDetails = "";
    }
    if (answers.modernisation === "oui" && !value.projectDetails!.trim()) throw new Error("Décrivez votre projet de modernisation en quelques lignes.");
    result.projectDetails = answers.modernisation === "oui" ? value.projectDetails!.trim() : "";
  }
  return result;
}

export function readEventSurvey(json: string | null | undefined): EventSurvey | null {
  if (!json) return null;
  try { return validateEventSurvey(JSON.parse(json)); } catch { return null; }
}
