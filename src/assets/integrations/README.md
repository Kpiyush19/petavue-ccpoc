# Integration logos

Drop brand logo files here (SVG preferred, PNG fine), named after the source:

```
src/assets/integrations/
  apollo.svg
  hubspot.svg
  salesforce.svg
  snowflake.svg
```

Then wire them into the "Sync Details" popup in
`src/components/dashboards/ccdashboard/components/CCDashboardView.jsx`:

```js
// at the top of the file
import apollo from "@/assets/integrations/apollo.svg";
import hubspot from "@/assets/integrations/hubspot.svg";
import salesforce from "@/assets/integrations/salesforce.svg";
import snowflake from "@/assets/integrations/snowflake.svg";

// in DEFAULT_INTEGRATIONS, set the `logo` field:
const DEFAULT_INTEGRATIONS = [
  { name: "Apollo",     synced: "Today, 9:12 AM",     color: "#5C5CFF", logo: apollo },
  { name: "HubSpot",    synced: "Today, 7:30 AM",     color: "#FF7A59", logo: hubspot },
  { name: "Salesforce", synced: "Yesterday, 5:15 PM", color: "#00A1E0", logo: salesforce },
  { name: "Snowflake",  synced: "2 days ago",         color: "#29B5E8", logo: snowflake },
];
```

The popup renders `logo` as a 24×24 image when present, and falls back to the
colored monogram badge when `logo` is `null`.
```
