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
}

export async function deleteSessionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.session.delete({ where: { id } });
  revalidatePath("/admin");
  redirect("/admin");
}

// ============================== RÉPONSE PUBLIQUE ==============================

export async function submitResponseAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const session = await prisma.session.findUnique({ where: { slug } });

  if (!session || !session.active) {
    redirect(`/eval/${slug}?error=fermee`);
  }

  // Lecture et validation des 8 notes (1..5)
  const notes: Record<string, number> = {};
  for (const c of CRITERIA) {
    const raw = Number(formData.get(c.key));
    if (!Number.isInteger(raw) || raw < 1 || raw > 5) {
      redirect(`/eval/${slug}?error=incomplet`);
    }
    notes[c.key] = raw;
  }

  const commentaire =
    String(formData.get("commentaire") ?? "").trim() || null;

  // Identifiant d'appareil anonyme (généré et stocké côté navigateur) → anti-doublon.
  const deviceId = String(formData.get("deviceId") ?? "").trim() || null;
  if (deviceId) {
    const already = await prisma.response.findFirst({
      where: { sessionId: session.id, deviceId },
    });
    if (already) {
      redirect(`/eval/${slug}?error=deja`);
    }
  }

  // Données techniques anonymes pour l'audit (côté admin uniquement).
  const h = await headers();
  const ipAddress =
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    null;
  const userAgent = h.get("user-agent") || null;

  await prisma.response.create({
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

  revalidatePath(`/admin/sessions/${session.id}`);
  redirect(`/eval/${slug}/merci`);
}
