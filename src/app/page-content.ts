export type HomeOverviewItem = {
  description: string;
  eyebrow: string;
  title: string;
};

export type DashboardSummaryItem = {
  label: string;
  tone: "default" | "success" | "warning";
};

export type DashboardRecordItem = {
  label: string;
};

export const homeOverviewItems: HomeOverviewItem[] = [
  {
    description:
      "See what the product does without scanning a long landing page. The promise stays short, and the next step stays obvious.",
    eyebrow: "How it works",
    title: "Understand the tool in one pass",
  },
  {
    description:
      "Generation, review, and account context stay together so the product feels guided rather than technical.",
    eyebrow: "What you manage",
    title: "Generate content, then review the output",
  },
];

export const dashboardSummaryItems: DashboardSummaryItem[] = [
  {
    label: "Access",
    tone: "success",
  },
  {
    label: "Billing state",
    tone: "default",
  },
  {
    label: "Current period",
    tone: "warning",
  },
];

export const dashboardRecordItems: DashboardRecordItem[] = [
  {
    label: "Account email",
  },
  {
    label: "Platform",
  },
  {
    label: "Product",
  },
];

export const dashboardDetailSections = [
  "Generation flow",
  "Workspace record",
] as const;
