import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParticipantAccountId } from "@/lib/participant-auth";
import { generateAttestation, formatParticipantName } from "@/lib/attestation-pdf";

// Génère et renvoie l'attestation du participant connecté — une seule fois.
// Le verrou "downloadedAt" est posé en transaction avant la génération : un
// deuxième appel (même double-clic) est refusé.
export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/attestation/[slug]/download">
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
  // Le compte doit appartenir à cette attestation.
  if (!account || account.attestationId !== att.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Verrou "une seule fois" : pose downloadedAt seulement s'il est encore nul.
  const lock = await prisma.attestationAccount.updateMany({
    where: { id: account.id, downloadedAt: null },
    data: { downloadedAt: new Date() },
  });
  if (lock.count === 0) {
    return NextResponse.json(
      { error: "Attestation déjà téléchargée" },
      { status: 403 }
    );
  }

  const pdf = await generateAttestation(att, account);

  const safeName = formatParticipantName(account)
    .replace(/[^a-z0-9]+/gi, "_")
    .toLowerCase();

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="attestation_${safeName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
