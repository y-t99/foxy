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
});
