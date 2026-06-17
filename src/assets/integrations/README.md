# Connector icons

Drop logo files here, one per connector. SVG preferred; PNG works too.

## Naming convention

The Skills page resolves icons by **kebab-case** filename. Use exactly these filenames so the page picks them up automatically when we wire icon rendering into the build script.

| Connector (as in JSON) | Filename | Used by N skills |
|---|---|---|
| Salesforce | `salesforce.svg` | 56 |
| HubSpot | `hubspot.svg` | 38 |
| LinkedIn Ads | `linkedin-ads.svg` | 20 |
| Outreach | `outreach.svg` | 18 |
| Google Ads | `google-ads.svg` | 17 |
| Meta Ads | `meta-ads.svg` | 13 |
| 6sense | `6sense.svg` | 13 |
| Gong | `gong.svg` | 11 |
| NetSuite | `netsuite.svg` | 7 |
| GA4 | `ga4.svg` | 2 |
| Webflow | `webflow.svg` | 1 |
| Splash | `splash.svg` | 1 |
| PartnerStack | `partnerstack.svg` | 1 |
| LinkedIn Sales Navigator | `linkedin-sales-navigator.svg` | 1 |

## Recommended size + style

- 24x24 viewBox SVG, monochrome OR brand-color
- Avoid baked-in padding — let CSS handle sizing
- If using monochrome, set `fill="currentColor"` so we can tint per-context (e.g. white on the dark Skills page)

## What's wired today

Right now connectors render as plain **text chips** on the Skills list cards and detail-page hero meta strip. Once enough icons are in this folder, we can swap the text chips for icon+label chips (e.g. on the detail page meta strip and on hover popovers).
