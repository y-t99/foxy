/*
  Warnings:

  - You are about to drop the `stripe_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "stripe_events";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "webhook_events" (
    "source" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "receive_status" TEXT NOT NULL,
    "received_at" DATETIME NOT NULL,
    "signature" TEXT NOT NULL,
    "headers_json" TEXT NOT NULL,
    "payload_json" TEXT NOT NULL,

    PRIMARY KEY ("source", "event_id")
);
