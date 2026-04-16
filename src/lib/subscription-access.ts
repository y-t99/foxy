type SubscriptionAccessInput = {
  cancelAtPeriodEnd?: boolean | null;
  currentPeriodEnd?: Date | null;
  now?: Date;
  status?: string | null;
};

export function hasSubscriptionAccess({
  currentPeriodEnd,
  now = new Date(),
  status,
}: SubscriptionAccessInput) {
  if (status !== "active" || !currentPeriodEnd) {
    return false;
  }

  return currentPeriodEnd.getTime() > now.getTime();
}
