type StatusStripItem = {
  label: string;
  tone?: "default" | "success" | "warning";
  value: string;
};

type StatusStripProps = {
  items: StatusStripItem[];
};

const valueToneClass = {
  default: "text-[var(--color-foreground)]",
  success: "text-[var(--color-success)]",
  warning: "text-[var(--color-foreground)]",
} as const;

export function StatusStrip({ items }: StatusStripProps) {
  return (
    <dl className="grid gap-0 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] sm:grid-cols-3 lg:grid-cols-1">
      {items.map((item, index) => (
        <div
          className={`px-5 py-5 ${
            index > 0
              ? "border-t border-[var(--color-line)] sm:border-l sm:border-t-0 lg:border-l-0 lg:border-t"
              : ""
          }`}
          key={item.label}
        >
          <dt className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
            {item.label}
          </dt>
          <dd
            className={`mt-3 text-lg font-semibold tracking-[-0.02em] ${
              valueToneClass[item.tone ?? "default"]
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
