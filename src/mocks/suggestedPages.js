// Pages Petavue drafts without being asked, because something in the ad
// accounts or search data says the site is missing one. Each arrives on a
// recommendation (rec-lp-02 for the comparison page) and is built from the
// workspace's published components the first time it is shown. `{brand}`
// becomes the workspace's brand. The competitor is invented, like the brand.

export const SUGGESTED_PAGES = [
  {
    id: "sg-compare", kind: "Comparison", name: "{brand} vs Castline",
    signal: "214 searches a month for “Castline alternative” reach your site, and no page answers them.",
    sections: ["header-simple", "hero-split", "compare-table", "testimonial", "cta-banner", "footer-columns"],
    copy: {
      "hero-split": { headline: "{brand} or Castline: which forecast can you defend?", lead: "Both forecast revenue. {brand} rebuilds the number every night from your CRM and gives the reason behind every deal at risk.", button: "See the difference" },
      "compare-table": { rival: "Castline", headline: "{brand} and Castline, side by side" },
      "cta-banner": { headline: "Run both on last quarter and compare", button: "Book a demo" },
      "header-simple": { button: "Book a demo" },
    },
    note: "I drafted this because people are searching for a **Castline alternative** and landing on your homepage. It puts the comparison first and ends on one button. I used only claims that are already in your components; check the table against what you know about Castline before you publish.",
  },
];
