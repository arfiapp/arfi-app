const CIRCLE_API = "https://api.circle.com";

let patched = false;

/** Redirects Circle SDK requests to localhost proxy routes (prevents CORS issues) */
export function patchCircleFetch() {
  if (patched || typeof window === "undefined") return;
  patched = true;

  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (url.startsWith(`${CIRCLE_API}/v1/stablecoinKits`)) {
      const proxied = url.replace(CIRCLE_API, window.location.origin);
      return original(proxied, init);
    }

    return original(input, init);
  };
}
