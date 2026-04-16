import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Webhook event schema", () => {
  it("stores Stripe callback events in the webhook_events table", () => {
    const schema = readFileSync(
      new URL("../../prisma/schema.prisma", import.meta.url),
      "utf8",
    );

    expect(schema).toContain("model WebhookEvent");
    expect(schema).toContain('@@map("webhook_events")');
    expect(schema).toContain("id            Int");
    expect(schema).toContain("uuid          String");
    expect(schema).toContain('createdAt     DateTime @default(now()) @map("created_at")');
    expect(schema).toContain('updatedAt     DateTime @updatedAt @map("updated_at")');
    expect(schema).toContain('createdBy     String?  @map("created_by")');
    expect(schema).toContain('updatedBy     String?  @map("updated_by")');
    expect(schema).toContain('eventType     String   @map("event_type")');
    expect(schema).toContain('receiveStatus String   @map("receive_status")');
    expect(schema).toContain('headersJson   String   @map("headers_json")');
    expect(schema).toContain('payloadJson   String   @map("payload_json")');
    expect(schema).toContain("@@unique([source, eventId])");
  });
});
