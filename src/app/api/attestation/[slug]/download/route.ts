import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParticipantAccountId } from "@/lib/participant-auth";
import { generateAttestation, formatParticipantName } from "@/lib/attestation-pdf";

// Génère et renvoie l'attestation du participant connecté — une seule fois.
// Le verrou atomique est posé après une génération réussie : un deuxième
// appel concurrent est refusé, une erreur de génération reste réessayable.
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
  if (!att || !att.active) {
    return NextResponse.json({ error: "Attestation introuvable" }, { status: 404 });
  }

  const account = await prisma.attestationAccount.findUnique({
    where: { id: accountId },
  });
  // Le compte doit appartenir à cette attestation.
  if (!account || account.attestationId !== att.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (account.downloadedAt) {
    return NextResponse.json({ error: "Attestation déjà téléchargée. Contactez l’organisateur si la réception a été interrompue." }, { status: 403 });
  }

  // Générer avant de consommer le droit : un PDF invalide reste réessayable.
  let pdf: Uint8Array;
  try {
    pdf = await generateAttestation(att, account);
  } catch (error) {
    console.error("[attestation generation]", error);
    return NextResponse.json(
      { error: "La génération a échoué. Vous pouvez réessayer ou contacter l’organisateur." },
      { status: 500 }
    );
  }

  // Mise à jour conditionnelle atomique : un seul appel concurrent gagne.
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
