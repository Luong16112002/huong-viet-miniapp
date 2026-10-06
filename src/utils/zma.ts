export const ZALO_APP_ID = "1150623612345860288";

export function getBasePath() {
  return resolveBasePath(window.location.pathname, window.BASE_PATH);
}

// Preview environments can serve the app at / even with TESTING_LOCAL or
// DEVELOPMENT in the query. A basename must always match the actual URL.
export function resolveBasePath(pathname: string, configuredBase?: string) {
  const hostedApp = pathname.match(/^\/zapps\/([^/]+)(?:\/|$)/);
  if (hostedApp && !["undefined", "null"].includes(hostedApp[1])) {
    return `/zapps/${hostedApp[1]}`;
  }
  if (typeof configuredBase === "string") {
    const base = configuredBase.replace(/\/+$/, "");
    if (base.startsWith("/") && base !== "/zapps/undefined" && base !== "/zapps/null" &&
      (pathname === base || pathname.startsWith(`${base}/`))) return base;
  }
  return "";
}
