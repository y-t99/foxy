import { getRequiredEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const BASIC_PRODUCT = {
  name: "Basic Plan",
  price: "$10.00",
  platform: "stripe",
};

export async function ensureBasicProduct() {
  const platformProductId = getRequiredEnv("STRIPE_PRODUCT_ID");
  const platformPriceId = getRequiredEnv("STRIPE_PRICE_ID");

  const existingPlatform = await prisma.productPlatform.findUnique({
    include: { product: true },
    where: {
      platform_platformPriceId: {
        platform: BASIC_PRODUCT.platform,
        platformPriceId,
      },
    },
  });

  if (existingPlatform) {
    return existingPlatform.product;
  }

  return prisma.product.create({
    data: {
      name: BASIC_PRODUCT.name,
      platforms: {
        create: {
          platform: BASIC_PRODUCT.platform,
          platformPriceId,
          platformProductId,
        },
      },
      price: BASIC_PRODUCT.price,
    },
  });
}
