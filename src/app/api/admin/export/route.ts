import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CRITERIA } from "@/lib/criteria";
import { responseAverage } from "@/lib/scoring";
import { deviceLabel } from "@/lib/device";
import { EVENT_QUESTIONS, PROFILE_FIELDS, readEventSurvey } from "@/lib/event-survey";

// Échappe une valeur pour le format CSV.
function csvCell(value: string | number | null): string {
  const raw = value == null ? "" : String(value);
  const s = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[";\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({
    where: { id },
    include: { responses: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) {
    return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  }

  const headers = [
    "Date",
    "Format",
    ...PROFILE_FIELDS.map((f) => f.label),
    ...EVENT_QUESTIONS.map((q) => q.text),
    "Période de rencontre souhaitée",
    "Autres problématiques",
    "Grandes lignes des problématiques",
    "Description du projet de modernisation",
    ...CRITERIA.map((c) => c.label),
    "Moyenne /5",
    "Commentaire",
    "Appareil",
    "Adresse IP",
  ];

  const rows = session.responses.map((r) => {
    const survey = readEventSurvey(r.surveyData);
    const moyenne = responseAverage(r);
    return [
      new Date(r.createdAt).toLocaleString("fr-FR"),
      survey ? "Odoo Oui/Non" : "Anciennes notes /5",
      ...PROFILE_FIELDS.map((f) => survey?.profile[f.key] ?? ""),
      ...EVENT_QUESTIONS.map((q) => survey ? survey.answers[q.key] === "oui" ? "Oui" : "Non" : ""),
      survey?.meetingPeriod ?? "",
      survey?.otherNeeds ? survey.otherNeeds === "oui" ? "Oui" : "Non" : "",
      survey?.needsDetails ?? "",
      survey?.projectDetails ?? "",
      ...CRITERIA.map((c) => survey ? "" : r[c.key]),
      survey ? "" : moyenne.toFixed(2),
      r.commentaire ?? "",
      deviceLabel(r.userAgent),
      r.ipAddress ?? "",
    ];
  });

  // BOM pour qu'Excel reconnaisse l'UTF-8, séparateur ; (standard FR)
  const csv =
    "﻿" +
    [headers, ...rows]
      .map((line) => line.map(csvCell).join(";"))
      .join("\r\n");

  const safeName = session.titre.replace(/[^a-z0-9]+/gi, "_").toLowerCase();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="evaluations_${safeName}.csv"`,
    },
  });
}
