import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Renvoie le PDF modèle d'une attestation, pour l'aperçu du positionnement côté admin.
export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get("id");
  if (!sessionId) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  }

  const att = await prisma.attestation.findUnique({ where: { sessionId } });
  if (!att) {
    return NextResponse.json({ error: "Aucune attestation" }, { status: 404 });
  }

  const body = new Uint8Array(att.pdfData);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${att.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
