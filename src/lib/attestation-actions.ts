"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { isAuthenticated } from "./auth";
import { PDFDocument } from "pdf-lib";
import { readAttestationPlacement } from "./attestation-placement";
import { hasCompletedEvaluation } from "./evaluation-progress";
import {
  hashPassword,
  verifyPassword,
  createParticipantSession,
  destroyParticipantSession,
  createGatePass,
  hasGatePass,
} from "./participant-auth";

const MAX_PDF_BYTES = 3 * 1024 * 1024; // Marge sous la limite des fonctions Vercel.

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
  const { nameX, nameY, fontSize, align } = readAttestationPlacement(formData, existing);

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
    try {
      const pdf = await PDFDocument.load(pdfData);
      if (pdf.getPageCount() < 1) redirect(`${back}?attErr=type`);
    } catch {
      redirect(`${back}?attErr=type`);
    }
    fileName = file.name;
  }

  // Mot de passe temporaire (optionnel en mise à jour).
  const password = String(formData.get("password") ?? "").trim();
  const passwordHash = password ? await hashPassword(password) : undefined;

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

// Récupération après un téléchargement interrompu : réservée à l'organisateur.
export async function resetAttestationDownloadAction(formData: FormData) {
  await requireAdmin();
  const accountId = String(formData.get("accountId") ?? "");
  const account = await prisma.attestationAccount.findUnique({
    where: { id: accountId },
    include: { attestation: { select: { sessionId: true, session: { select: { slug: true } } } } },
  });
  if (!account) return;
  await prisma.attestationAccount.update({
    where: { id: account.id },
    data: { downloadedAt: null },
  });
  revalidatePath(`/admin/sessions/${account.attestation.sessionId}`);
  revalidatePath(`/attestation/${account.attestation.session.slug}/espace`);
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

  if (!(await verifyPassword(password, att.passwordHash))) {
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

  if (!(await hasCompletedEvaluation(session!.id))) {
    redirect(`/eval/${slug}`);
  }

  // On exige le passage par le portail (mot de passe temporaire).
  if (!(await hasGatePass(session!.id, att.passwordHash))) {
    redirect(`/attestation/${slug}`);
  }

  const nom = String(formData.get("nom") ?? "").trim();
  const prenom = String(formData.get("prenom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telephone = String(formData.get("telephone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nom || !prenom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !telephone || password.length < 8 || password.length > 256 ||
      nom.length > 100 || prenom.length > 100 || email.length > 254 || telephone.length > 40) {
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
      passwordHash: await hashPassword(password),
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
  if (!att || !att.active) redirect(`/attestation/${slug}?err=indispo`);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const account = await prisma.attestationAccount.findUnique({
    where: { attestationId_email: { attestationId: att.id, email } },
  });
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    redirect(`/attestation/${slug}?err=identifiants&tab=login`);
  }
  if (!account.passwordHash.startsWith("scrypt:")) {
    await prisma.attestationAccount.update({
      where: { id: account.id },
      data: { passwordHash: await hashPassword(password) },
    });
  }
  await createParticipantSession(account.id);
  redirect(`/attestation/${slug}/espace`);
}

export async function logoutParticipantAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  await destroyParticipantSession();
  redirect(`/attestation/${slug}`);
}
