-- AlterTable
ALTER TABLE "products" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "subscription_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "subscription_uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "result" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_logs_uuid_key" ON "subscription_logs"("uuid");

-- CreateIndex
CREATE INDEX "subscription_logs_subscription_uuid_idx" ON "subscription_logs"("subscription_uuid");

-- CreateIndex
CREATE INDEX "subscription_logs_user_uuid_idx" ON "subscription_logs"("user_uuid");

-- CreateIndex
CREATE INDEX "subscription_logs_action_status_platform_idx" ON "subscription_logs"("action", "status", "platform");
