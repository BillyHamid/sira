-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "organisme" TEXT NOT NULL DEFAULT 'BOX AFRICA',
    "formateur" TEXT NOT NULL,
    "lieu" TEXT,
    "dateDebut" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Response_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_slug_key" ON "Session"("slug");

-- CreateIndex
CREATE INDEX "Response_sessionId_idx" ON "Response"("sessionId");
