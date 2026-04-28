import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    orderBy: { updatedAt: "desc" },
    where: { userUuid: session.user.id },
  });

  if (!subscription) {
    return NextResponse.json({ error: "No subscription." }, { status: 404 });
  }

  return NextResponse.json({
    cancel_at_period_end: subscription.cancelAtPeriodEnd,
    current_period_end: subscription.currentPeriodEnd,
    current_period_start: subscription.currentPeriodStart,
    product_uuid: subscription.productUuid,
    status: subscription.status,
    subscription_uuid: subscription.uuid,
  });
}
