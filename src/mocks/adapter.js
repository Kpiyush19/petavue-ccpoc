// Custom axios adapter that resolves requests against the mock handler table
// instead of hitting the network. Installed on both axios instances when
// VITE_MOCK is on. Unmatched routes resolve to a safe empty body (200) so the
// UI degrades gracefully rather than throwing.

import handlers from "./handlers";

function parseUrl(config) {
  // config.url may be absolute (Petavue instance has a baseURL) or relative.
  // We only care about the pathname + query for matching.
  let url = config.url || "";
  if (config.baseURL && !/^https?:\/\//i.test(url)) {
    url = config.baseURL.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
  let pathname = url;
  let search = "";
  try {
    const u = new URL(url, "http://mock.local");
    pathname = u.pathname;
    search = u.search;
  } catch {
    const qIdx = url.indexOf("?");
    if (qIdx >= 0) {
      pathname = url.slice(0, qIdx);
      search = url.slice(qIdx);
    }
  }
  const query = Object.fromEntries(new URLSearchParams(search));
  return { pathname, query };
}

function parseBody(config) {
  if (config.data == null) return null;
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data);
    } catch {
      return config.data;
    }
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    return config.data;
  }
  return config.data;
}

export default async function mockAdapter(config) {
  const method = (config.method || "get").toUpperCase();
  const { pathname, query } = parseUrl(config);
  const body = parseBody(config);

  let data;
  let matched = false;

  for (const route of handlers) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (!match) continue;
    matched = true;
    const params = match.slice(1);
    // eslint-disable-next-line no-await-in-loop
    data = await route.handler({ match, params, body, query, config });
    break;
  }

  if (!matched) {
    // eslint-disable-next-line no-console
    console.debug(`[mock] unhandled ${method} ${pathname} → {}`);
    data = {};
  }

  // Small artificial latency so loading states render naturally.
  await new Promise((r) => setTimeout(r, 80));

  return {
    data,
    status: 200,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    config,
    request: {},
  };
}
