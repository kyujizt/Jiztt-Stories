function extractPathnameSegments(path) {
  const splitUrl = path.split("/").filter((segment) => segment !== "");

  console.log("Extracted pathname segments:", splitUrl);

  return {
    resource: splitUrl[0] || null,
    id: splitUrl[1] || null,
  };
}

function constructRouteFromSegments(pathSegments) {
  let pathname = "";

  if (pathSegments.resource) {
    pathname = `/${pathSegments.resource}`;
  }

  return pathname || "/";
}

export function getActivePathname() {
  const hash = window.location.hash.slice(1).toLowerCase();
  const pathname = hash || "/";
  console.log("Active pathname:", pathname);
  return pathname;
}

export function getActiveRoute() {
  const pathname = getActivePathname();
  console.log("Active pathname for route:", pathname);

  const urlSegments = extractPathnameSegments(pathname);
  console.log("Extracted segments for route:", urlSegments);

  return constructRouteFromSegments(urlSegments);
}

export function parseActivePathname() {
  const pathname = getActivePathname();
  const segments = extractPathnameSegments(pathname);
  console.log("Parsed active pathname:", segments);
  return segments;
}

export function getRoute(pathname) {
  const urlSegments = extractPathnameSegments(pathname);
  console.log("Constructed route for pathname:", pathname);
  return constructRouteFromSegments(urlSegments);
}

export function parsePathname(pathname) {
  const segments = extractPathnameSegments(pathname);
  console.log("Parsed pathname for resource and id:", segments);
  return segments;
}
