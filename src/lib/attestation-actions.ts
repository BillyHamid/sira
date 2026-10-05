"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { isAuthenticated } from "./auth";
import {
  hashPassword,
  verifyPassword,
  createParticipantSession,
  destroyParticipantSession,
  createGatePass,
  hasGatePass,
} from "./participant-auth";

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 Mo

async function requireAdmin() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}

// ============================== ADMIN ==============================

// Crée ou met à jour l'attestation d'une session : PDF modèle, mot de passe
// temporaire, et placement du nom. Fichier/mot de passe optionnels en mise à jour.
export async function saveAttestationAction(formData: FormData) {
  await requireAdmin();

  const sessionId = String(formData.get("sessionId") ?? "");
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { attestation: true },
  });
  if (!session) redirect("/admin");

  const existing = session.attestation;
  const back = `/admin/sessions/${sessionId}`;

  // Placement (avec valeurs par défaut raisonnables si absent).
  const nameX = clamp01(Number(formData.get("nameX")), 0.5);
  const nameY = clamp01(Number(formData.get("nameY")), 0.5);
  const fontSizeRaw = Number(formData.get("fontSize"));
  const fontSize =
    Number.isFinite(fontSizeRaw) && fontSizeRaw > 0 ? fontSizeRaw : 24;
  const align = String(formData.get("align") ?? "center") === "left" ? "left" : "center";

  // Fichier PDF (optionnel en mise à jour).
  const file = formData.get("file");
  let pdfData: Uint8Array<ArrayBuffer> | undefined;
  let fileName: string | undefined;
  if (file instanceof File && file.size > 0) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      redirect(`${back}?attErr=type`);
    }
    if (file.size > MAX_PDF_BYTES) {
      redirect(`${back}?attErr=taille`);
    }
    pdfData = new Uint8Array(await file.arrayBuffer());
    fileName = file.name;
  }

  // Mot de passe temporaire (optionnel en mise à jour).
  const password = String(formData.get("password") ?? "").trim();
  const passwordHash = password ? hashPassword(password) : undefined;

  if (!existing) {
    // Création : fichier ET mot de passe obligatoires.
    if (!pdfData || !fileName) redirect(`${back}?attErr=fichier`);
    if (!passwordHash) redirect(`${back}?attErr=motdepasse`);
    await prisma.attestation.create({
      data: {
        sessionId,
        pdfData: pdfData!,
        fileName: fileName!,
        nameX,
        nameY,
        fontSize,
        align,
        passwordHash: passwordHash!,
      },
    });
  } else {
    await prisma.attestation.update({
      where: { sessionId },
      data: {
        nameX,
        nameY,
        fontSize,
        align,
        ...(pdfData && fileName ? { pdfData, fileName } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
  }

  revalidatePath(back);
  redirect(`${back}?attOk=1`);
}

export async function toggleAttestationAction(formData: FormData) {
  await requireAdmin();
  const sessionId = String(formData.get("sessionId") ?? "");
  const att = await prisma.attestation.findUnique({ where: { sessionId } });
  if (att) {
    await prisma.attestation.update({
      where: { sessionId },
      data: { active: !att.active },
    });
  }
  revalidatePath(`/admin/sessions/${sessionId}`);
}

export async function deleteAttestationAction(formData: FormData) {
  await requireAdmin();
  const sessionId = String(formData.get("sessionId") ?? "");
  await prisma.attestation
    .delete({ where: { sessionId } })
    .catch(() => undefined);
  revalidatePath(`/admin/sessions/${sessionId}`);
  redirect(`/admin/sessions/${sessionId}`);
}

// ============================== PUBLIC (PARTICIPANT) ==============================

// Étape 1 : vérifier le mot de passe temporaire partagé → pose le cookie de passage.
export async function gateAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  const session = await prisma.session.findUnique({
    where: { slug },
    include: { attestation: true },
  });
  const att = session?.attestation;
  if (!att || !att.active) redirect(`/attestation/${slug}?err=indispo`);

  if (!verifyPassword(password, att.passwordHash)) {
    redirect(`/attestation/${slug}?err=motdepasse`);
  }
  await createGatePass(session!.id, att.passwordHash);
  redirect(`/attestation/${slug}`);
}

// Étape 2a : inscription. Crée le compte, ouvre la session, va à l'espace.
export async function registerParticipantAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const session = await prisma.session.findUnique({
    where: { slug },
    include: { attestation: true },
  });
  const att = session?.attestation;
  if (!att || !att.active) redirect(`/attestation/${slug}?err=indispo`);

  // On exige le passage par le portail (mot de passe temporaire).
  if (!(await hasGatePass(session!.id, att.passwordHash))) {
    redirect(`/attestation/${slug}`);
  }

  const nom = String(formData.get("nom") ?? "").trim();
  const prenom = String(formData.get("prenom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nom || !prenom || !email || !telephone || password.length < 4) {
    redirect(`/attestation/${slug}?err=champs&tab=register`);
  }

  const already = await prisma.attestationAccount.findUnique({
    where: { attestationId_email: { attestationId: att.id, email } },
  });
  if (already) {
    redirect(`/attestation/${slug}?err=existe&tab=login`);
  }

  const account = await prisma.attestationAccount.create({
    data: {
      attestationId: att.id,
      nom,
      prenom,
      email,
      telephone,
      passwordHash: hashPassword(password),
    },
  });
  await createParticipantSession(account.id);
  redirect(`/attestation/${slug}/espace`);
}

// Étape 2b : reconnexion (email + mot de passe perso).
export async function loginParticipantAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const session = await prisma.session.findUnique({
    where: { slug },
    include: { attestation: true },
  });
  const att = session?.attestation;
  if (!att) redirect(`/attestation/${slug}?err=indispo`);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const account = await prisma.attestationAccount.findUnique({
    where: { attestationId_email: { attestationId: att.id, email } },
  });
  if (!account || !verifyPassword(password, account.passwordHash)) {
    redirect(`/attestation/${slug}?err=identifiants&tab=login`);
  }
  await createParticipantSession(account.id);
  redirect(`/attestation/${slug}/espace`);
}

export async function logoutParticipantAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  await destroyParticipantSession();
  redirect(`/attestation/${slug}`);
}

// --- util ---
function clamp01(v: number, fallback: number): number {
  if (!Number.isFinite(v)) return fallback;
  return Math.min(1, Math.max(0, v));
}
