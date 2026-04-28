import { describe, expect, it } from "vitest";
import {
  getDashboardNotice,
  shouldClearCheckoutState,
} from "./notice";

describe("dashboard checkout notice", () => {
  it("keeps the success notice visible while access is still pending", () => {
    expect(
      getDashboardNotice({
        checkout: "success",
        hasAccess: false,
      }),
    ).toEqual({
      text: "Payment received. Access refreshes as soon as Stripe sends the subscription webhook.",
      tone: "success",
    });
  });

  it("removes the success notice once subscription access is active", () => {
    expect(
      getDashboardNotice({
        checkout: "success",
        hasAccess: true,
      }),
    ).toBeNull();
  });

  it("clears the success query state after access is active", () => {
    expect(
      shouldClearCheckoutState({
        checkout: "success",
        hasAccess: true,
      }),
    ).toBe(true);
  });

  it("shows a pending upgrade notice without changing access assumptions", () => {
    expect(
      getDashboardNotice({
        hasAccess: true,
        upgrade: "pending",
      }),
    ).toEqual({
      text: "Upgrade difference payment started. Your current plan stays active until payment and upgrade completion are confirmed.",
      tone: "success",
    });
  });

  it("shows a cancellation notice for abandoned upgrade checkout", () => {
    expect(
      getDashboardNotice({
        hasAccess: true,
        upgrade: "cancelled",
      }),
    ).toEqual({
      text: "Upgrade payment was cancelled. Your current plan remains active.",
      tone: "caution",
    });
  });

  it("shows a manual handling notice when payment succeeded but upgrade failed", () => {
    expect(
      getDashboardNotice({
        hasAccess: true,
        upgrade: "upgrade_failed",
      }),
    ).toEqual({
      text: "Upgrade payment was received, but the subscription update did not complete. Your current plan remains active while support reviews it.",
      tone: "caution",
    });
  });
});
