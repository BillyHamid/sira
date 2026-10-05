import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParticipantAccountId } from "@/lib/participant-auth";
import { generateAttestation } from "@/lib/attestation-pdf";

// Aperçu filigrané de l'attestation du participant connecté, affiché inline dans
// son espace. Ne consomme PAS le téléchargement unique (downloadedAt intact).
export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/attestation/[slug]/preview">
) {
  const { slug } = await ctx.params;

  const accountId = await getParticipantAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { slug },
    include: { attestation: true },
  });
  const att = session?.attestation;
  if (!att) {
    return NextResponse.json({ error: "Attestation introuvable" }, { status: 404 });
  }

  const account = await prisma.attestationAccount.findUnique({
    where: { id: accountId },
  });
  if (!account || account.attestationId !== att.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const pdf = await generateAttestation(att, account, { watermark: true });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"apercu_attestation.pdf\"",
      "Cache-Control": "no-store",
    },
  });
}
