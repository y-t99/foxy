import { getRequiredEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

type StripeProductRef = string | { id: string } | null | undefined;

type StripePriceProductLike = {
  product: StripeProductRef;
};

export type SubscriptionProductKey =
  | "basic"
  | "basic_annual"
  | "pro"
  | "pro_annual";

export type SubscriptionProductConfig = {
  env: {
    priceId?: string;
    productId?: string;
  };
  intervalMonths: number;
  key: SubscriptionProductKey;
  level: number;
  name: string;
  platform: "stripe";
  price: string;
  stripePriceId?: string;
};

export const SUBSCRIPTION_PRODUCTS: readonly SubscriptionProductConfig[] = [
  {
    env: {
      priceId: "STRIPE_PRICE_ID",
      productId: "STRIPE_PRODUCT_ID",
    },
    intervalMonths: 1,
    key: "basic",
    level: 1,
    name: "Basic Plan",
    platform: "stripe",
    price: "$10.00",
  },
  {
    env: {
      priceId: "STRIPE_PRO_PRICE_ID",
      productId: "STRIPE_PRO_PRODUCT_ID",
    },
    intervalMonths: 1,
    key: "pro",
    level: 2,
    name: "Pro Plan",
    platform: "stripe",
    price: "$20.00 USD",
  },
  {
    env: {},
    intervalMonths: 12,
    key: "basic_annual",
    level: 1,
    name: "Basic Plan Annual",
    platform: "stripe",
    price: "$100.00 USD / year",
    stripePriceId: "price_1TRnklRxCAAlii2EMOddBstc",
  },
  {
    env: {},
    intervalMonths: 12,
    key: "pro_annual",
    level: 2,
    name: "Pro Plan Annual",
    platform: "stripe",
    price: "$200.00 USD / year",
    stripePriceId: "price_1TRnlMRxCAAlii2EICpMtBjB",
  },
];

export const DEFAULT_SUBSCRIPTION_PRODUCT_KEY: SubscriptionProductKey = "basic";

export function getSubscriptionProductByKey(productKey: string) {
  return (
    SUBSCRIPTION_PRODUCTS.find((product) => product.key === productKey) ?? null
  );
}

export function isSubscriptionProductUpgradeTarget({
  currentProduct,
  targetProduct,
}: {
  currentProduct: Pick<SubscriptionProductConfig, "intervalMonths" | "level">;
  targetProduct: Pick<SubscriptionProductConfig, "intervalMonths" | "level">;
}) {
  return (
    targetProduct.level > currentProduct.level ||
    (targetProduct.level === currentProduct.level &&
      targetProduct.intervalMonths > currentProduct.intervalMonths)
  );
}

export function getSubscriptionProductPlatformPriceId(
  productConfig: SubscriptionProductConfig,
) {
  if (productConfig.stripePriceId) {
    return productConfig.stripePriceId;
  }

  if (productConfig.env.priceId) {
    return getRequiredEnv(productConfig.env.priceId);
  }

  throw new Error(`Missing Stripe price mapping for ${productConfig.key}`);
}

export function getSubscriptionProductConfiguredPlatformProductId(
  productConfig: SubscriptionProductConfig,
) {
  if (!productConfig.env.productId) {
    return null;
  }

  return getRequiredEnv(productConfig.env.productId);
}

export function resolveStripeProductIdFromPrice(price: StripePriceProductLike) {
  if (!price.product) {
    return null;
  }

  return typeof price.product === "string" ? price.product : price.product.id;
}

async function getSubscriptionProductPlatformProductId({
  productConfig,
  stripePrice,
}: {
  productConfig: SubscriptionProductConfig;
  stripePrice?: StripePriceProductLike;
}) {
  const configuredProductId =
    getSubscriptionProductConfiguredPlatformProductId(productConfig);

  if (configuredProductId) {
    return configuredProductId;
  }

  const price =
    stripePrice ??
    (await getStripe().prices.retrieve(
      getSubscriptionProductPlatformPriceId(productConfig),
    ));
  const resolvedProductId = resolveStripeProductIdFromPrice(price);

  if (!resolvedProductId) {
    throw new Error(`Missing Stripe product mapping for ${productConfig.key}`);
  }

  return resolvedProductId;
}

export async function ensureSubscriptionProduct(
  productKey: string,
  options: { stripePrice?: StripePriceProductLike } = {},
) {
  const productConfig = getSubscriptionProductByKey(productKey);

  if (!productConfig) {
    throw new Error(`Unknown subscription product: ${productKey}`);
  }

  const platformPriceId = getSubscriptionProductPlatformPriceId(productConfig);
  const platformProductId = await getSubscriptionProductPlatformProductId({
    productConfig,
    stripePrice: options.stripePrice,
  });

  const existingPlatform = await prisma.productPlatform.findUnique({
    include: { product: true },
    where: {
      platform_platformPriceId: {
        platform: productConfig.platform,
        platformPriceId,
      },
    },
  });

  if (existingPlatform) {
    await prisma.productPlatform.update({
      data: { platformProductId },
      where: { uuid: existingPlatform.uuid },
    });

    return prisma.product.update({
      data: {
        level: productConfig.level,
        name: productConfig.name,
        price: productConfig.price,
      },
      include: {
        platforms: {
          where: { platform: productConfig.platform },
        },
      },
      where: { uuid: existingPlatform.product.uuid },
    });
  }

  return prisma.product.create({
    data: {
      level: productConfig.level,
      name: productConfig.name,
      platforms: {
        create: {
          platform: productConfig.platform,
          platformPriceId,
          platformProductId,
        },
      },
      price: productConfig.price,
    },
    include: {
      platforms: {
        where: { platform: productConfig.platform },
      },
    },
  });
}
