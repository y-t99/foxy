import { getRequiredEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type SubscriptionProductKey = "basic" | "pro";

export type SubscriptionProductConfig = {
  env: {
    priceId: string;
    productId: string;
  };
  key: SubscriptionProductKey;
  level: number;
  name: string;
  platform: "stripe";
  price: string;
};

export const SUBSCRIPTION_PRODUCTS = [
  {
    env: {
      priceId: "STRIPE_PRICE_ID",
      productId: "STRIPE_PRODUCT_ID",
    },
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
    key: "pro",
    level: 2,
    name: "Pro Plan",
    platform: "stripe",
    price: "$20.00 USD",
  },
] as const satisfies readonly SubscriptionProductConfig[];

export const DEFAULT_SUBSCRIPTION_PRODUCT_KEY: SubscriptionProductKey = "basic";

export function getSubscriptionProductByKey(productKey: string) {
  return (
    SUBSCRIPTION_PRODUCTS.find((product) => product.key === productKey) ?? null
  );
}

export async function ensureSubscriptionProduct(productKey: string) {
  const productConfig = getSubscriptionProductByKey(productKey);

  if (!productConfig) {
    throw new Error(`Unknown subscription product: ${productKey}`);
  }

  const platformProductId = getRequiredEnv(productConfig.env.productId);
  const platformPriceId = getRequiredEnv(productConfig.env.priceId);

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
