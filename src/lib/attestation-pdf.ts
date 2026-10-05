// Génération de l'attestation personnalisée : on charge le PDF modèle de l'admin
// et on incruste le nom du participant à l'emplacement défini (positionnement visuel).
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

type AttestationLike = {
  pdfData: Uint8Array | Buffer;
  nameX: number; // fraction 0..1 de la largeur de page (origine haut-gauche)
  nameY: number; // fraction 0..1 de la hauteur de page (origine haut-gauche)
  fontSize: number; // points PDF
  align: string; // "center" | "left"
};

type AccountLike = {
  nom: string;
  prenom: string;
};

// Format affiché sur l'attestation : NOM Prénom (nom en majuscules).
export function formatParticipantName(account: AccountLike): string {
  return `${account.nom.toUpperCase()} ${account.prenom}`.trim();
}

export async function generateAttestation(
  attestation: AttestationLike,
  account: AccountLike,
  options: { watermark?: boolean } = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(attestation.pdfData);
  const page = doc.getPages()[0];
  const { width: W, height: H } = page.getSize();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const text = formatParticipantName(account);
  const size = attestation.fontSize;
  const textWidth = font.widthOfTextAtSize(text, size);

  // L'aperçu admin utilise l'origine haut-gauche ; pdf-lib l'origine bas-gauche.
  // nameX/nameY sont des fractions ; on convertit en points.
  let x = attestation.nameX * W;
  if (attestation.align === "center") {
    x -= textWidth / 2;
  }
  // nameY repère le haut du texte depuis le haut de la page → on passe à la baseline.
  const y = H - attestation.nameY * H - size;

  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Filigrane d'aperçu : empêche d'utiliser le visionneur PDF pour récupérer un
  // document propre sans passer par le téléchargement unique.
  if (options.watermark) {
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const wmText = "APERÇU — NON VALIDE";
    const wmSize = Math.min(W, H) / 11;
    const wmWidth = bold.widthOfTextAtSize(wmText, wmSize);
    // Quelques répétitions diagonales pour couvrir la page.
    for (let i = -1; i <= 1; i++) {
      page.drawText(wmText, {
        x: W / 2 - (wmWidth / 2) * Math.cos(Math.PI / 4) - i * 60,
        y: H / 2 - (wmWidth / 2) * Math.sin(Math.PI / 4) + i * (H / 3),
        size: wmSize,
        font: bold,
        color: rgb(0.85, 0.2, 0.2),
        rotate: degrees(45),
        opacity: 0.22,
      });
    }
  }

  return doc.save();
}
