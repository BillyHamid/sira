-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
-- Accès via Prisma côté serveur ; aucune donnée personnelle ne doit être publique.
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "organisme" TEXT NOT NULL DEFAULT 'BOX AFRICA',
    "formateur" TEXT NOT NULL,
    "lieu" TEXT,
    "dateDebut" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "pdfData" BYTEA NOT NULL,
    "fileName" TEXT NOT NULL,
    "nameX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "nameY" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "fontSize" DOUBLE PRECISION NOT NULL DEFAULT 24,
    "align" TEXT NOT NULL DEFAULT 'center',
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttestationAccount" (
    "id" TEXT NOT NULL,
    "attestationId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttestationAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantName" TEXT,
    "methodePedagogique" INTEGER NOT NULL,
    "contenuProgramme" INTEGER NOT NULL,
    "competenceFormateur" INTEGER NOT NULL,
    "qualiteAnimation" INTEGER NOT NULL,
    "duree" INTEGER NOT NULL,
    "applicationPro" INTEGER NOT NULL,
    "atteinteObjectifs" INTEGER NOT NULL,
    "supportPedagogique" INTEGER NOT NULL,
    "commentaire" TEXT,
    "deviceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_slug_key" ON "Session"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Attestation_sessionId_key" ON "Attestation"("sessionId");

-- CreateIndex
CREATE INDEX "AttestationAccount_attestationId_idx" ON "AttestationAccount"("attestationId");

-- CreateIndex
CREATE UNIQUE INDEX "AttestationAccount_attestationId_email_key" ON "AttestationAccount"("attestationId", "email");

-- CreateIndex
CREATE INDEX "Response_sessionId_idx" ON "Response"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Response_sessionId_deviceId_key" ON "Response"("sessionId", "deviceId");

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttestationAccount" ADD CONSTRAINT "AttestationAccount_attestationId_fkey" FOREIGN KEY ("attestationId") REFERENCES "Attestation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase Data API : aucune politique d'accès public pour les tables métier.
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Response" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attestation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttestationAccount" ENABLE ROW LEVEL SECURITY;
