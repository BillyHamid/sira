// Définition centralisée des critères d'évaluation et de l'échelle de notation.
// Reproduit fidèlement la fiche papier BOX AFRICA.

export type CriterionKey =
  | "methodePedagogique"
  | "contenuProgramme"
  | "competenceFormateur"
  | "qualiteAnimation"
  | "duree"
  | "applicationPro"
  | "atteinteObjectifs"
  | "supportPedagogique";

export interface Criterion {
  key: CriterionKey;
  label: string;
  group: string;
}

export const CRITERIA: Criterion[] = [
  // Organisme formateur
  { key: "methodePedagogique", label: "Méthode pédagogique", group: "Organisme formateur" },
  { key: "contenuProgramme", label: "Contenu du programme", group: "Organisme formateur" },
  { key: "competenceFormateur", label: "Compétence du formateur", group: "Organisme formateur" },
  { key: "qualiteAnimation", label: "Qualité d'animation du formateur", group: "Organisme formateur" },
  // Action de formation
  { key: "duree", label: "Durée", group: "Action de formation" },
  { key: "applicationPro", label: "Possibilité d'application professionnelle", group: "Action de formation" },
  { key: "atteinteObjectifs", label: "Atteinte des objectifs de la formation", group: "Action de formation" },
  { key: "supportPedagogique", label: "Support pédagogique", group: "Action de formation" },
];

export const CRITERIA_GROUPS: string[] = [...new Set(CRITERIA.map((c) => c.group))];

// Échelle de notation : 1=Faible / 2=Moyen / 3=Assez bien / 4=Bien / 5=Très bien
export const SCALE: { value: number; label: string }[] = [
  { value: 1, label: "Faible" },
  { value: 2, label: "Moyen" },
  { value: 3, label: "Assez bien" },
  { value: 4, label: "Bien" },
  { value: 5, label: "Très bien" },
];

export const SCALE_MAX = 5;
