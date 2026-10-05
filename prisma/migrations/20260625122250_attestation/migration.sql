-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "pdfData" BLOB NOT NULL,
    "fileName" TEXT NOT NULL,
    "nameX" REAL NOT NULL DEFAULT 0.5,
    "nameY" REAL NOT NULL DEFAULT 0.5,
    "fontSize" REAL NOT NULL DEFAULT 24,
    "align" TEXT NOT NULL DEFAULT 'center',
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attestation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttestationAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attestationId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "downloadedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AttestationAccount_attestationId_fkey" FOREIGN KEY ("attestationId") REFERENCES "Attestation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Attestation_sessionId_key" ON "Attestation"("sessionId");

-- CreateIndex
CREATE INDEX "AttestationAccount_attestationId_idx" ON "AttestationAccount"("attestationId");

-- CreateIndex
CREATE UNIQUE INDEX "AttestationAccount_attestationId_email_key" ON "AttestationAccount"("attestationId", "email");
