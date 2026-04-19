type HomeHeaderUser = {
  email?: string | null;
  name?: string | null;
};

export function getHomeHeaderState(user: HomeHeaderUser | null) {
  if (!user) {
    return {
      ctaHref: "/register",
      ctaLabel: "Try foxy",
      dashboardHref: "/login",
      dashboardLabel: "Log in",
      identityLabel: null,
      isSignedIn: false,
    };
  }

  return {
    ctaHref: "/dashboard",
    ctaLabel: "Open dashboard",
    dashboardHref: "/dashboard",
    dashboardLabel: "Dashboard",
    identityLabel: user.name?.trim() || user.email?.trim() || "Signed in",
    isSignedIn: true,
  };
}
