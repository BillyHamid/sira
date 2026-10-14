-- Garantit l'idempotence des envois concurrents depuis un même appareil.
-- Si des doublons historiques existent, la migration échoue sans les supprimer.
CREATE UNIQUE INDEX "Response_sessionId_deviceId_key" ON "Response"("sessionId", "deviceId");
DROP INDEX "Response_sessionId_deviceId_idx";
