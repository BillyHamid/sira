-- AlterTable
ALTER TABLE "Response" ADD COLUMN "deviceId" TEXT;
ALTER TABLE "Response" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "Response" ADD COLUMN "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "Response_sessionId_deviceId_idx" ON "Response"("sessionId", "deviceId");
