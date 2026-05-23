/** Kontak publik dari env (server). Dipakai Footer & landing. */

function websiteDisplayLabel(href, explicitLabel) {
  if (explicitLabel?.trim()) return explicitLabel.trim();
  if (!href?.trim()) return "";
  try {
    const u = new URL(href.trim());
    return u.hostname.replace(/^www\./, "") || href.trim();
  } catch {
    return href.trim();
  }
}

export function getSiteContact() {
  const phone =
    process.env.FOOTER_CONTACT_PHONE?.trim() || "(0289) 123456";
  const email =
    process.env.FOOTER_CONTACT_EMAIL?.trim() || "pramuka@smkalfurqon.sch.id";
  const websiteUrlRaw = process.env.FOOTER_WEBSITE_URL?.trim() || "";
  const websiteHrefDefault = "https://smk.al-furqon.id/";
  const websiteHref = websiteUrlRaw || websiteHrefDefault;
  const websiteLabel =
    process.env.FOOTER_WEBSITE_LABEL?.trim() ||
    websiteDisplayLabel(websiteHref) ||
    "smk.al-furqon.id";
  const addressLine =
    process.env.FOOTER_ADDRESS_LINE?.trim() ||
    "Jl. Raya Bantarkawung, Brebes, Jawa Tengah 52274";
  return { phone, email, websiteHref, websiteLabel, addressLine };
}
