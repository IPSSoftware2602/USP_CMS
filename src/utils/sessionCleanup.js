export const getCookieNames = (cookieString = "") =>
  String(cookieString)
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => decodeURIComponent(chunk.split("=")[0] || ""))
    .filter(Boolean);

export const clearAllBrowserCookies = (doc = document) => {
  if (!doc || typeof doc.cookie !== "string") {
    return;
  }

  const domain =
    typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : null;

  const names = getCookieNames(doc.cookie);
  for (const name of names) {
    doc.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    if (domain) {
      doc.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
    }
  }
};
