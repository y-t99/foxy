import { describe, expect, it } from "vitest";
import {
  dashboardDetailSections,
  dashboardRecordItems,
  dashboardSummaryItems,
  homeOverviewItems,
} from "./page-content";

describe("page content", () => {
  it("defines editorial overview sections for the home foyer", () => {
    expect(homeOverviewItems.map((item) => item.eyebrow)).toEqual([
      "How it works",
      "What you manage",
    ]);
    expect(homeOverviewItems.map((item) => item.title)).toEqual([
      "Understand the tool in one pass",
      "Generate content, then review the output",
    ]);
  });

  it("defines the dashboard summary labels for the overview header", () => {
    expect(dashboardSummaryItems.map((item) => item.label)).toEqual([
      "Access",
      "Billing state",
      "Current period",
    ]);
  });

  it("defines workspace record labels for the dashboard detail section", () => {
    expect(dashboardRecordItems.map((item) => item.label)).toEqual([
      "Account email",
      "Platform",
      "Product",
    ]);
  });

  it("defines calm document-style dashboard detail sections", () => {
    expect(dashboardDetailSections).toEqual(["Generation flow", "Workspace record"]);
  });
});
