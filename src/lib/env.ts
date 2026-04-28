export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const placeholderFragments = ["change-me", "replace-with", "replace_me"];

export function isPlaceholderEnvValue(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const normalizedValue = value.toLowerCase();

  return placeholderFragments.some((fragment) =>
    normalizedValue.includes(fragment),
  );
}

export function getStripeCheckoutConfigStatus() {
  const requiredVariables = [
    "STRIPE_SECRET_KEY",
    "STRIPE_PRODUCT_ID",
    "STRIPE_PRICE_ID",
    "STRIPE_PRO_PRODUCT_ID",
    "STRIPE_PRO_PRICE_ID",
  ] as const;
  const missing = requiredVariables.filter((name) => {
    const value = process.env[name];

    return !value || isPlaceholderEnvValue(value);
  });

  return {
    isReady: missing.length === 0,
    missing,
  };
}

export function assertStripeCheckoutConfigured() {
  const status = getStripeCheckoutConfigStatus();

  if (!status.isReady) {
    throw new Error(
      `Stripe billing is not configured. Update ${status.missing.join(", ")} in .env.`,
    );
  }
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  );
}
