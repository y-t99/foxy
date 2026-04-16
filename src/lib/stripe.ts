import Stripe from "stripe";
import { assertStripeCheckoutConfigured, getRequiredEnv } from "@/lib/env";

let stripeClient: Stripe | undefined;

export function getStripe() {
  assertStripeCheckoutConfigured();

  stripeClient ??= new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });

  return stripeClient;
}
