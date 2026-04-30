import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createSubscriptionUpgradeSession,
  SubscriptionUpgradeError,
} from "@/lib/subscription-upgrade";

export const runtime = "nodejs";

function errorStatus(error: SubscriptionUpgradeError) {
  if (error.issue === "stripe_api") {
    return 502;
  }

  return 409;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    target_product_uuid?: unknown;
  } | null;
  const targetProductUuid = body?.target_product_uuid;

  if (typeof targetProductUuid !== "string" || targetProductUuid.length === 0) {
    return NextResponse.json(
      { error: "target_product_uuid is required." },
      { status: 400 },
    );
  }

  try {
    const upgrade = await createSubscriptionUpgradeSession({
      targetProductUuid,
      userUuid: session.user.id,
    });

    return NextResponse.json({
      checkout_url: upgrade.checkoutUrl,
      subscription_change_uuid: upgrade.subscriptionChangeUuid,
    });
  } catch (error) {
    if (error instanceof SubscriptionUpgradeError) {
      return NextResponse.json(
        { error: error.issue },
        { status: errorStatus(error) },
      );
    }

    throw error;
  }
}
