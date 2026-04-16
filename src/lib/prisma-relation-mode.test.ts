import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Prisma datasource relation mode", () => {
  it('uses `relationMode = "prisma"` so SQLite tables are created without foreign keys', () => {
    const schema = readFileSync(
      new URL("../../prisma/schema.prisma", import.meta.url),
      "utf8",
    );

    expect(schema).toContain('relationMode = "prisma"');
  });
});
