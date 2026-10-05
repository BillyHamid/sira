// Données de démonstration : une session de formation TIC avec quelques réponses.
// Lancer avec : npm run seed
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  // Évite les doublons si on relance le seed.
  const existing = await prisma.session.findUnique({
    where: { slug: "demo-tic" },
  });
  if (existing) {
    await prisma.session.delete({ where: { id: existing.id } });
  }

  const session = await prisma.session.create({
    data: {
      slug: "demo-tic",
      titre: "Formation TIC (démonstration)",
      organisme: "BOX AFRICA",
      formateur: "YAMEOGO Sylvain",
      lieu: "Ouagadougou",
      dateDebut: "16 au 17/05/2025",
    },
  });

  const userAgents = [
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Safari/605.1.15",
  ];
  const commentaires = [
    "Formation très enrichissante, formateur à l'écoute.",
    "Durée un peu courte pour tout assimiler.",
    null,
    "Excellents supports pédagogiques, merci !",
    null,
    "Plus d'exercices pratiques seraient appréciés.",
    null,
    "Objectifs atteints, je recommande.",
  ];

  for (let i = 0; i < userAgents.length; i++) {
    await prisma.response.create({
      data: {
        sessionId: session.id,
        commentaire: commentaires[i],
        deviceId: `demo-device-${i}`,
        userAgent: userAgents[i],
        ipAddress: `196.28.${rnd(1, 254)}.${rnd(1, 254)}`,
        methodePedagogique: rnd(3, 5),
        contenuProgramme: rnd(3, 5),
        competenceFormateur: rnd(4, 5),
        qualiteAnimation: rnd(3, 5),
        duree: rnd(2, 4),
        applicationPro: rnd(3, 5),
        atteinteObjectifs: rnd(3, 5),
        supportPedagogique: rnd(3, 5),
      },
    });
  }

  console.log(`✔ Session de démo créée : /eval/${session.slug} (${userAgents.length} réponses)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
