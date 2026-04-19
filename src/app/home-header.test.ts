import { describe, expect, it } from "vitest";
import { getHomeHeaderState } from "./home-header";

describe("home header state", () => {
  it("shows guest actions when no session user is present", () => {
    expect(getHomeHeaderState(null)).toEqual({
      ctaHref: "/register",
      ctaLabel: "Try foxy",
      dashboardHref: "/login",
      dashboardLabel: "Log in",
      identityLabel: null,
      isSignedIn: false,
    });
  });

  it("shows signed-in identity when a session user is present", () => {
    expect(
      getHomeHeaderState({
        email: "alex@example.com",
        name: "Alex",
      }),
    ).toEqual({
      ctaHref: "/dashboard",
      ctaLabel: "Open dashboard",
      dashboardHref: "/dashboard",
      dashboardLabel: "Dashboard",
      identityLabel: "Alex",
      isSignedIn: true,
    });
  });

  it("falls back to email when the session user has no name", () => {
    expect(
      getHomeHeaderState({
        email: "alex@example.com",
      }),
    ).toEqual({
      ctaHref: "/dashboard",
      ctaLabel: "Open dashboard",
      dashboardHref: "/dashboard",
      dashboardLabel: "Dashboard",
      identityLabel: "alex@example.com",
      isSignedIn: true,
    });
  });
});
