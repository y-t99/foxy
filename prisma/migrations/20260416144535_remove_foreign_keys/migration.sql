-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_product_platforms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "product_uuid" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platform_product_id" TEXT NOT NULL,
    "platform_price_id" TEXT NOT NULL
);
INSERT INTO "new_product_platforms" ("created_at", "created_by", "id", "platform", "platform_price_id", "platform_product_id", "product_uuid", "updated_at", "updated_by", "uuid") SELECT "created_at", "created_by", "id", "platform", "platform_price_id", "platform_product_id", "product_uuid", "updated_at", "updated_by", "uuid" FROM "product_platforms";
DROP TABLE "product_platforms";
ALTER TABLE "new_product_platforms" RENAME TO "product_platforms";
CREATE UNIQUE INDEX "product_platforms_uuid_key" ON "product_platforms"("uuid");
CREATE UNIQUE INDEX "product_platforms_product_uuid_platform_key" ON "product_platforms"("product_uuid", "platform");
CREATE UNIQUE INDEX "product_platforms_platform_platform_product_id_key" ON "product_platforms"("platform", "platform_product_id");
CREATE UNIQUE INDEX "product_platforms_platform_platform_price_id_key" ON "product_platforms"("platform", "platform_price_id");
CREATE TABLE "new_subscription_platforms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "subscription_uuid" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platform_customer_id" TEXT NOT NULL,
    "platform_subscription_id" TEXT NOT NULL
);
INSERT INTO "new_subscription_platforms" ("created_at", "created_by", "id", "platform", "platform_customer_id", "platform_subscription_id", "subscription_uuid", "updated_at", "updated_by", "uuid") SELECT "created_at", "created_by", "id", "platform", "platform_customer_id", "platform_subscription_id", "subscription_uuid", "updated_at", "updated_by", "uuid" FROM "subscription_platforms";
DROP TABLE "subscription_platforms";
ALTER TABLE "new_subscription_platforms" RENAME TO "subscription_platforms";
CREATE UNIQUE INDEX "subscription_platforms_uuid_key" ON "subscription_platforms"("uuid");
CREATE UNIQUE INDEX "subscription_platforms_subscription_uuid_key" ON "subscription_platforms"("subscription_uuid");
CREATE INDEX "subscription_platforms_platform_platform_customer_id_idx" ON "subscription_platforms"("platform", "platform_customer_id");
CREATE UNIQUE INDEX "subscription_platforms_platform_platform_subscription_id_key" ON "subscription_platforms"("platform", "platform_subscription_id");
CREATE TABLE "new_subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "status" TEXT NOT NULL,
    "product_uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "current_period_start" DATETIME,
    "current_period_end" DATETIME,
    "canceled_at" DATETIME,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "latest_payment_at" DATETIME
);
INSERT INTO "new_subscriptions" ("cancel_at_period_end", "canceled_at", "created_at", "created_by", "current_period_end", "current_period_start", "id", "latest_payment_at", "product_uuid", "status", "updated_at", "updated_by", "user_uuid", "uuid") SELECT "cancel_at_period_end", "canceled_at", "created_at", "created_by", "current_period_end", "current_period_start", "id", "latest_payment_at", "product_uuid", "status", "updated_at", "updated_by", "user_uuid", "uuid" FROM "subscriptions";
DROP TABLE "subscriptions";
ALTER TABLE "new_subscriptions" RENAME TO "subscriptions";
CREATE UNIQUE INDEX "subscriptions_uuid_key" ON "subscriptions"("uuid");
CREATE INDEX "subscriptions_user_uuid_idx" ON "subscriptions"("user_uuid");
CREATE INDEX "subscriptions_product_uuid_idx" ON "subscriptions"("product_uuid");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
