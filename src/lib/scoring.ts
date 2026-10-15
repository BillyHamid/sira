// Calculs de scoring et de statistiques à partir des réponses.
import { CRITERIA, CriterionKey, SCALE_MAX } from "./criteria";

// Forme minimale d'une réponse nécessaire aux calculs (les 8 critères notés).
export type ScorableResponse = Record<CriterionKey, number> & { surveyData?: string | null };

// Moyenne des 8 critères d'une réponse, sur 5.
export function responseAverage(r: ScorableResponse): number {
  const sum = CRITERIA.reduce((acc, c) => acc + (r[c.key] ?? 0), 0);
  return sum / CRITERIA.length;
}

// Convertit une note /5 en pourcentage.
export function toPercent(noteSur5: number): number {
  return (noteSur5 / SCALE_MAX) * 100;
}

export interface CriterionStat {
  key: CriterionKey;
  label: string;
  group: string;
  moyenne: number; // /5
  pourcent: number; // %
}

export interface SessionStats {
  total: number; // nombre de réponses
  moyenneGlobale: number; // /5
  pourcentGlobal: number; // %
  parCritere: CriterionStat[];
  // distribution des notes globales arrondies (1..5)
  distribution: { note: number; count: number }[];
}

export function computeStats(responses: ScorableResponse[]): SessionStats {
  responses = responses.filter((r) => !r.surveyData);
  const total = responses.length;

  const parCritere: CriterionStat[] = CRITERIA.map((c) => {
    const moyenne =
      total === 0
        ? 0
        : responses.reduce((acc, r) => acc + (r[c.key] ?? 0), 0) / total;
    return {
      key: c.key,
      label: c.label,
      group: c.group,
      moyenne,
      pourcent: toPercent(moyenne),
    };
  });

  const moyenneGlobale =
    total === 0
      ? 0
      : responses.reduce((acc, r) => acc + responseAverage(r), 0) / total;

  // Distribution : on arrondit la moyenne de chaque réponse à l'entier le plus proche.
  const buckets = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ]);
  for (const r of responses) {
    const note = Math.round(responseAverage(r));
    const clamped = Math.min(5, Math.max(1, note));
    buckets.set(clamped, (buckets.get(clamped) ?? 0) + 1);
  }
  const distribution = [...buckets.entries()]
    .map(([note, count]) => ({ note, count }))
    .sort((a, b) => a.note - b.note);

  return {
    total,
    moyenneGlobale,
    pourcentGlobal: toPercent(moyenneGlobale),
    parCritere,
    distribution,
  };
}

// Libellé qualitatif d'une note /5 (réutilise l'échelle de la fiche).
export function appreciation(noteSur5: number): string {
  if (noteSur5 >= 4.5) return "Très bien";
  if (noteSur5 >= 3.5) return "Bien";
  if (noteSur5 >= 2.5) return "Assez bien";
  if (noteSur5 >= 1.5) return "Moyen";
  if (noteSur5 > 0) return "Faible";
  return "—";
}
