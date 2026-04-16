/*
  Warnings:

  - The primary key for the `webhook_events` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `id` to the `webhook_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `webhook_events` table without a default value. This is not possible if the table is not empty.
  - The required column `uuid` was added to the `webhook_events` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_webhook_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "source" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "receive_status" TEXT NOT NULL,
    "received_at" DATETIME NOT NULL,
    "signature" TEXT NOT NULL,
    "headers_json" TEXT NOT NULL,
    "payload_json" TEXT NOT NULL
);
INSERT INTO "new_webhook_events" (
    "uuid",
    "created_at",
    "updated_at",
    "source",
    "event_id",
    "event_type",
    "receive_status",
    "received_at",
    "signature",
    "headers_json",
    "payload_json"
)
SELECT
    lower(hex(randomblob(16))),
    COALESCE("received_at", CURRENT_TIMESTAMP),
    COALESCE("received_at", CURRENT_TIMESTAMP),
    "source",
    "event_id",
    "event_type",
    "receive_status",
    "received_at",
    "signature",
    "headers_json",
    "payload_json"
FROM "webhook_events";
DROP TABLE "webhook_events";
ALTER TABLE "new_webhook_events" RENAME TO "webhook_events";
CREATE UNIQUE INDEX "webhook_events_uuid_key" ON "webhook_events"("uuid");
CREATE UNIQUE INDEX "webhook_events_source_event_id_key" ON "webhook_events"("source", "event_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
