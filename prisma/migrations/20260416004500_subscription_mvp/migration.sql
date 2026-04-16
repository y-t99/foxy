-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "name" TEXT NOT NULL,
    "price" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "product_platforms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "product_uuid" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platform_product_id" TEXT NOT NULL,
    "platform_price_id" TEXT NOT NULL,
    CONSTRAINT "product_platforms_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "products" ("uuid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriptions" (
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
    "latest_payment_at" DATETIME,
    CONSTRAINT "subscriptions_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "products" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "users" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription_platforms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "subscription_uuid" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platform_customer_id" TEXT NOT NULL,
    "platform_subscription_id" TEXT NOT NULL,
    CONSTRAINT "subscription_platforms_subscription_uuid_fkey" FOREIGN KEY ("subscription_uuid") REFERENCES "subscriptions" ("uuid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_uuid_key" ON "products"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "product_platforms_uuid_key" ON "product_platforms"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "product_platforms_product_uuid_platform_key" ON "product_platforms"("product_uuid", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "product_platforms_platform_platform_product_id_key" ON "product_platforms"("platform", "platform_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_platforms_platform_platform_price_id_key" ON "product_platforms"("platform", "platform_price_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_uuid_key" ON "subscriptions"("uuid");

-- CreateIndex
CREATE INDEX "subscriptions_user_uuid_idx" ON "subscriptions"("user_uuid");

-- CreateIndex
CREATE INDEX "subscriptions_product_uuid_idx" ON "subscriptions"("product_uuid");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_platforms_uuid_key" ON "subscription_platforms"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_platforms_subscription_uuid_key" ON "subscription_platforms"("subscription_uuid");

-- CreateIndex
CREATE INDEX "subscription_platforms_platform_platform_customer_id_idx" ON "subscription_platforms"("platform", "platform_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_platforms_platform_platform_subscription_id_key" ON "subscription_platforms"("platform", "platform_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_events_event_id_key" ON "stripe_events"("event_id");
