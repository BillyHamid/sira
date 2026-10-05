"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CriterionKey } from "@/lib/criteria";
import type { CriterionStat } from "@/lib/scoring";

// Libellés courts pour le radar (les libellés complets sont trop longs en cercle).
const SHORT: Record<CriterionKey, string> = {
  methodePedagogique: "Méthode",
  contenuProgramme: "Contenu",
  competenceFormateur: "Compétence",
  qualiteAnimation: "Animation",
  duree: "Durée",
  applicationPro: "Application",
  atteinteObjectifs: "Objectifs",
  supportPedagogique: "Support",
};

// Bleu de marque Box.academy et nuances.
const BRAND = "#1c9ce5";
const BRAND_LIGHT = "#45afec";

// Échelle de bleus (clair → foncé) pour la répartition des notes 1 → 5.
const NOTE_COLORS = ["#b0ddf9", "#7cc7f4", "#45afec", "#1c9ce5", "#1069a3"];

/* ------------------------------------------------------------------ */
/* Jauge circulaire de satisfaction globale                            */
/* ------------------------------------------------------------------ */
export function GaugeChart({
  pourcent,
  note,
}: {
  pourcent: number;
  note: number;
}) {
  const value = Math.round(pourcent);
  const color = BRAND;

  return (
    <div className="relative mx-auto h-[220px] w-full max-w-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="74%"
          outerRadius="100%"
          data={[{ value }]}
          startAngle={90}
          endAngle={-270}
        >
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.65} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: "#f1f5f9" }}
            dataKey="value"
            cornerRadius={30}
            fill="url(#gaugeGrad)"
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-slate-900">{value}%</span>
        <span className="text-sm font-medium text-slate-500">
          {note.toFixed(2)} / 5
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Radar : profil des 8 critères                                       */
/* ------------------------------------------------------------------ */
export function RadarProfile({ data }: { data: CriterionStat[] }) {
  const chartData = data.map((c) => ({
    critere: SHORT[c.key as CriterionKey] ?? c.label,
    note: Number(c.moyenne.toFixed(2)),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={chartData}
          outerRadius="68%"
          margin={{ top: 18, right: 36, bottom: 18, left: 36 }}
        >
          <defs>
            <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND_LIGHT} stopOpacity={0.55} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0.25} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="critere"
            tick={{ fontSize: 11, fill: "#475569" }}
          />
          <PolarRadiusAxis
            domain={[0, 5]}
            tickCount={6}
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            axisLine={false}
          />
          <Radar
            dataKey="note"
            stroke={BRAND}
            strokeWidth={2}
            fill="url(#radarGrad)"
            dot={{ r: 3, fill: BRAND }}
          />
          <Tooltip formatter={(v) => [`${v} / 5`, "Moyenne"]} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Histogramme horizontal par critère (dégradé + valeurs)             */
/* ------------------------------------------------------------------ */
export function CriteriaChart({ data }: { data: CriterionStat[] }) {
  const chartData = data.map((c) => ({
    name: c.label,
    moyenne: Number(c.moyenne.toFixed(2)),
  }));

  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 12, right: 40, top: 4, bottom: 4 }}
          barCategoryGap={10}
        >
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={BRAND_LIGHT} />
              <stop offset="100%" stopColor={BRAND} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f6" />
          <XAxis type="number" domain={[0, 5]} tickCount={6} fontSize={12} />
          <YAxis
            type="category"
            dataKey="name"
            width={185}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => [`${v} / 5`, "Moyenne"]}
            cursor={{ fill: "rgba(5,150,105,0.06)" }}
          />
          <Bar dataKey="moyenne" radius={[0, 8, 8, 0]} fill="url(#barGrad)" barSize={18}>
            <LabelList
              dataKey="moyenne"
              position="right"
              formatter={(v) => Number(v).toFixed(2)}
              fontSize={11}
              fill="#475569"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Donut : répartition des notes globales (1 à 5)                      */
/* ------------------------------------------------------------------ */
export function DistributionDonut({
  data,
  total,
}: {
  data: { note: number; count: number }[];
  total: number;
}) {
  const colors = NOTE_COLORS;
  const pieData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: `Note ${d.note}`,
      note: d.note,
      value: d.count,
    }));

  return (
    <div className="relative h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
          >
            {pieData.map((d) => (
              <Cell key={d.note} fill={colors[d.note - 1]} />
            ))}
            <LabelList
              dataKey="value"
              position="outside"
              fontSize={12}
              fill="#475569"
            />
          </Pie>
          <Tooltip
            formatter={(v) => [`${v} réponse(s)`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-slate-900">{total}</span>
        <span className="text-xs font-medium text-slate-500">réponses</span>
      </div>
    </div>
  );
}

// Légende réutilisable pour le donut (rendue hors du graphe).
export function DistributionLegend() {
  const items = [
    { note: 1, label: "Faible", color: NOTE_COLORS[0] },
    { note: 2, label: "Moyen", color: NOTE_COLORS[1] },
    { note: 3, label: "Assez bien", color: NOTE_COLORS[2] },
    { note: 4, label: "Bien", color: NOTE_COLORS[3] },
    { note: 5, label: "Très bien", color: NOTE_COLORS[4] },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.note} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: i.color }}
          />
          {i.note} · {i.label}
        </span>
      ))}
    </div>
  );
}
