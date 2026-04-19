export type NoticeTone = "caution" | "success";

export function shouldClearCheckoutState({
  checkout,
  hasAccess,
}: {
  checkout?: string;
  hasAccess: boolean;
}) {
  return checkout === "success" && hasAccess;
}

export function getDashboardNotice({
  billing,
  checkout,
  hasAccess,
}: {
  billing?: string;
  checkout?: string;
  hasAccess: boolean;
}) {
  if (checkout === "success" && !hasAccess) {
    return {
      text: "Payment received. Access refreshes as soon as Stripe sends the subscription webhook.",
      tone: "success" as const satisfies NoticeTone,
    };
  }

  if (checkout === "cancelled") {
    return {
      text: "Checkout was cancelled. You can start again whenever you are ready.",
      tone: "caution" as const satisfies NoticeTone,
    };
  }

  if (billing === "config") {
    return {
      text: "Stripe billing is not configured in this environment yet. Update local `.env`, then reload the dashboard.",
      tone: "caution" as const satisfies NoticeTone,
    };
  }

  if (billing === "price_recurring") {
    return {
      text: "The configured Stripe price is not recurring. Replace `STRIPE_PRICE_ID` with a recurring monthly price before using subscription checkout.",
      tone: "caution" as const satisfies NoticeTone,
    };
  }

  if (billing === "price_product") {
    return {
      text: "The configured Stripe price does not belong to the configured product. Check `STRIPE_PRODUCT_ID` and `STRIPE_PRICE_ID` in `.env`.",
      tone: "caution" as const satisfies NoticeTone,
    };
  }

  if (billing === "stripe_api") {
    return {
      text: "Stripe rejected the billing request. Double-check your local Stripe key, product, and price configuration.",
      tone: "caution" as const satisfies NoticeTone,
    };
  }

  return null;
}
