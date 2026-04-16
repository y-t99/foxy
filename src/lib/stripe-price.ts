type StripeObjectRef = string | { id: string } | null | undefined;

type StripePriceLike = {
  product: StripeObjectRef;
  recurring: object | null;
};

export type StripeSubscriptionPriceIssue =
  | "price_product"
  | "price_recurring";

function stripeObjectId(value: StripeObjectRef) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

export function getStripeSubscriptionPriceIssue({
  expectedProductId,
  price,
}: {
  expectedProductId: string;
  price: StripePriceLike;
}): StripeSubscriptionPriceIssue | null {
  if (!price.recurring) {
    return "price_recurring";
  }

  if (stripeObjectId(price.product) !== expectedProductId) {
    return "price_product";
  }

  return null;
}
