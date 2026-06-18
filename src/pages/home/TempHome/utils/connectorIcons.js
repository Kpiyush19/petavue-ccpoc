// Maps a GTM connector name (as used in the skills catalog) to its brand logo
// URL from src/assets/integrations. Glob handles filenames with spaces.
const CONNECTOR_ICON_MODULES = import.meta.glob("../../../../assets/integrations/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
// Key by lower-cased filename so a case mismatch between glob keys and the
// CONNECTOR_FILE values (same file imported as salesforce.svg vs Salesforce.svg
// on a case-insensitive FS) still resolves.
const CONNECTOR_ICON_BY_FILE = Object.fromEntries(
  Object.entries(CONNECTOR_ICON_MODULES).map(([path, url]) => [path.split("/").pop().toLowerCase(), url])
);
const CONNECTOR_FILE = {
  "6sense": "6sense.svg",
  GA4: "GA4.svg",
  Gong: "Gong.svg",
  "Google Ads": "Google Ads.svg",
  HubSpot: "HubSpot.svg",
  "LinkedIn Ads": "LinkedIn.svg",
  "LinkedIn Sales Navigator": "LinkedIn.svg",
  "Meta Ads": "Meta Ads.svg",
  Outreach: "Outreach.svg",
  Salesforce: "Salesforce.svg",
};

export const connectorIcon = (name) => {
  const file = CONNECTOR_FILE[name];
  return file ? CONNECTOR_ICON_BY_FILE[file.toLowerCase()] || null : null;
};
