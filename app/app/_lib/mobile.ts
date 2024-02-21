export function isOnMobile(): boolean {
  console.log({ w: window.innerWidth, h: window.innerHeight });
  // Heuristic: if one of the dimensions is less than 450, we're on mobile.
  if (typeof window === "undefined") {
    // We're probably in SSR.
    return false;
  }
  return window.innerWidth < 450 || window.innerHeight < 450;
}
