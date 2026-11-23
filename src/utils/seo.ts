interface PageMetadata {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "product";
  structuredData?: Record<string, unknown>;
}

function setMeta(
  attribute: "name" | "property",
  key: string,
  value: string | null
) {
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (!value) {
    existing?.remove();
    return;
  }
  const meta = existing || document.createElement("meta");
  meta.setAttribute(attribute, key);
  meta.content = value;
  if (!existing) document.head.appendChild(meta);
}

export function setPageMetadata({
  title,
  description,
  path = window.location.pathname,
  image,
  type = "website",
  structuredData,
}: PageMetadata) {
  const siteUrl = (
    import.meta.env.VITE_SITE_URL || window.location.origin
  ).replace(/\/+$/, "");
  const canonicalUrl = new URL(path, `${siteUrl}/`).toString();
  const compactDescription = description.replace(/\s+/g, " ").trim();
  const normalizedDescription =
    compactDescription.length > 160
      ? `${compactDescription.slice(0, 157).trimEnd()}...`
      : compactDescription;
  const imageUrl = image ? new URL(image, `${siteUrl}/`).toString() : null;

  document.title = title;
  let canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  setMeta("name", "description", normalizedDescription);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", normalizedDescription);
  setMeta("property", "og:type", type);
  setMeta("property", "og:url", canonicalUrl);
  setMeta("property", "og:image", imageUrl);
  setMeta("name", "twitter:card", imageUrl ? "summary_large_image" : "summary");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", normalizedDescription);
  setMeta("name", "twitter:image", imageUrl);

  const scriptId = "page-structured-data";
  const existingScript = document.getElementById(scriptId);
  if (!structuredData) {
    existingScript?.remove();
    return;
  }
  const script =
    existingScript instanceof HTMLScriptElement
      ? existingScript
      : document.createElement("script");
  script.id = scriptId;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(structuredData);
  if (!existingScript) document.head.appendChild(script);
}
