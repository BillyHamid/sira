import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatParticipantName, generateAttestation } from "@/lib/attestation-pdf";

export const dynamic = "force-dynamic";

// L'organisateur récupère une copie sans utiliser le droit de téléchargement du participant.
export async function GET(request: Request) {
  if (!(await isAuthenticated())) return Response.json({ error: "Connexion administrateur requise." }, { status: 401 });
  const accountId = new URL(request.url).searchParams.get("accountId");
  if (!accountId) return Response.json({ error: "Participant manquant." }, { status: 400 });
  const account = await prisma.attestationAccount.findUnique({ where: { id: accountId }, include: { attestation: true } });
  if (!account) return Response.json({ error: "Participant introuvable." }, { status: 404 });
  try {
    const pdf = await generateAttestation(account.attestation, account);
    const name = formatParticipantName(account).replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    return new Response(new Uint8Array(pdf), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="attestation_${name}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    console.error("[admin attestation download]", error);
    return Response.json({ error: "Impossible de générer cette attestation. Vérifiez le modèle PDF." }, { status: 500 });
  }
}
