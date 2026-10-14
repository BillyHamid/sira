"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import {
  checkPassword,
  createAdminSession,
  destroyAdminSession,
  isAuthenticated,
} from "./auth";
import { CRITERIA } from "./criteria";
import { confirmEvaluation } from "./evaluation-progress";

// --- Génération d'un slug court et unique pour l'URL publique ---
function randomSlug(length = 7): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // sans caractères ambigus
  let s = "";
  for (let i = 0; i < length; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

async function uniqueSlug(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = randomSlug();
    const existing = await prisma.session.findUnique({ where: { slug } });
    if (!existing) return slug;
  }
  return randomSlug(10);
}

// ============================== ADMIN AUTH ==============================

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    redirect("/admin/login?error=1");
  }
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

// ============================== SESSIONS ==============================

async function requireAdmin() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function createSessionAction(formData: FormData) {
  await requireAdmin();

  const titre = String(formData.get("titre") ?? "").trim();
  const formateur = String(formData.get("formateur") ?? "").trim();
  const organisme = String(formData.get("organisme") ?? "").trim() || "BOX AFRICA";
  const lieu = String(formData.get("lieu") ?? "").trim() || null;
  const dateDebut = String(formData.get("dateDebut") ?? "").trim() || null;

  if (!titre || !formateur) {
    redirect("/admin?error=champs");
  }

  const slug = await uniqueSlug();
  const session = await prisma.session.create({
    data: { slug, titre, formateur, organisme, lieu, dateDebut },
  });

  revalidatePath("/admin");
  revalidatePath("/");
  redirect(`/admin/sessions/${session.id}?created=1`);
}

export async function toggleSessionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const session = await prisma.session.findUnique({ where: { id } });
  if (session) {
    await prisma.session.update({
      where: { id },
      data: { active: !session.active },
    });
  }
  revalidatePath(`/admin/sessions/${id}`);
  revalidatePath("/admin");
  revalidatePath("/");
  if (session) revalidatePath(`/formations/${session.slug}`);
}

export async function deleteSessionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.session.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

// ============================== RÉPONSE PUBLIQUE ==============================

export async function resumeEvaluationAction(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  const slug = String(formData.get("slug") ?? "");
  const deviceId = String(formData.get("deviceId") ?? "");
  if (!deviceId || deviceId.length > 128) return { success: false, error: "Votre réponse n’a pas été retrouvée sur cet appareil." };
  const session = await prisma.session.findUnique({ where: { slug } });
  if (!session) return { success: false, error: "Formation introuvable." };
  const response = await prisma.response.findFirst({ where: { sessionId: session.id, deviceId } });
  if (!response) return { success: false, error: "Votre réponse n’a pas été retrouvée sur cet appareil." };
  await confirmEvaluation(session.id, response.id);
  return { success: true };
}

export async function submitResponseAction(formData: FormData): Promise<
  { success: true } | { success: false; error: string }
> {
  const slug = String(formData.get("slug") ?? "");
  const session = await prisma.session.findUnique({ where: { slug } });

  if (!session || !session.active) {
    return { success: false, error: "Cette évaluation est fermée." };
  }

  // Lecture et validation des 8 notes (1..5)
  const notes: Record<string, number> = {};
  for (const c of CRITERIA) {
    const raw = Number(formData.get(c.key));
    if (!Number.isInteger(raw) || raw < 1 || raw > 5) {
      return { success: false, error: "Veuillez noter tous les critères de 1 à 5." };
    }
    notes[c.key] = raw;
  }

  const commentaire =
    String(formData.get("commentaire") ?? "").trim() || null;

  // Identifiant d'appareil anonyme (généré et stocké côté navigateur) → anti-doublon.
  const deviceId = String(formData.get("deviceId") ?? "").trim() || null;
  if (!deviceId || deviceId.length > 128 || (commentaire?.length ?? 0) > 5000) {
    return { success: false, error: "Vérifiez le formulaire (commentaire limité à 5 000 caractères), puis réessayez." };
  }
  if (deviceId) {
    const already = await prisma.response.findFirst({
      where: { sessionId: session.id, deviceId },
    });
    if (already) {
      await confirmEvaluation(session.id, already.id);
      // Réessai après une réponse réseau perdue : la réponse est déjà conservée.
      return { success: true };
    }
  }

  // Données techniques anonymes pour l'audit (côté admin uniquement).
  const h = await headers();
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    null;
  const userAgent = h.get("user-agent") || null;

  try {
    const response = await prisma.response.create({
    data: {
      sessionId: session.id,
      commentaire,
      deviceId,
      ipAddress,
      userAgent,
      methodePedagogique: notes.methodePedagogique,
      contenuProgramme: notes.contenuProgramme,
      competenceFormateur: notes.competenceFormateur,
      qualiteAnimation: notes.qualiteAnimation,
      duree: notes.duree,
      applicationPro: notes.applicationPro,
      atteinteObjectifs: notes.atteinteObjectifs,
      supportPedagogique: notes.supportPedagogique,
    },
    });
    await confirmEvaluation(session.id, response.id);
  } catch (error) {
    // L'index unique arbitre deux requêtes envoyées en même temps.
    if (typeof error === "object" && error !== null &&
        "code" in error && error.code === "P2002") {
      const saved = await prisma.response.findFirst({ where: { sessionId: session.id, deviceId } });
      if (!saved) throw error;
      await confirmEvaluation(session.id, saved.id);
      return { success: true };
    }
    throw error;
  }

  revalidatePath(`/admin/sessions/${session.id}`);
  return { success: true };
}
