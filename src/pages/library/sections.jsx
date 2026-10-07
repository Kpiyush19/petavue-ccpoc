/* The landing-page sections in the library. Each is a real section drawn at
   1200px wide and styled only through the design-system variables (--lp-*),
   so the same markup follows any workspace's brand. The content is sample
   copy for the mock workspace; `copy` carries the pieces rewritten in chat
   (headline, lead, button). Styles are in sections.css. */
import useDesignStore from "./useDesignStore";
import "./sections.css";

const useBrand = () => useDesignStore((s) => s.design.brand);

// The uploaded logo when there is one, otherwise a mark and the brand name.
export function Logo() {
  const brand = useBrand();
  const logo = useDesignStore((s) => s.design.logo);
  if (logo) return <img className="lp-logo__img" src={logo} alt={brand} />;
  return (
    <span className="lp-logo">
      <span className="lp-logo__mark" />
      {brand}
    </span>
  );
}

/* A product image, drawn: a small forecast chart. */
export function ProductShot() {
  const bars = [38, 52, 47, 64, 71, 86];
  return (
    <div className="lp-shot">
      <div className="lp-shot__head">
        <span className="lp-shot__title">Q4 forecast</span>
        <span className="lp-shot__chip">On track</span>
      </div>
      <div className="lp-shot__figure">$4.82M</div>
      <div className="lp-shot__bars">
        {bars.map((h, i) => (
          <span key={i} className={`lp-shot__bar${i === bars.length - 1 ? " lp-shot__bar--now" : ""}`} style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="lp-shot__rows">
        <span /><span /><span />
      </div>
    </div>
  );
}

export function HeaderSimple({ copy = {} }) {
  return (
    <header className="lp-section lp-header">
      <Logo />
      <nav className="lp-header__links">
        <span>Product</span><span>Solutions</span><span>Pricing</span><span>Customers</span>
      </nav>
      <div className="lp-header__actions">
        <span className="lp-link">Sign in</span>
        <span className="lp-btn" data-piece="button">{copy.button || "Book a demo"}</span>
      </div>
    </header>
  );
}

export function HeroSplit({ copy = {} }) {
  const brand = useBrand();
  return (
    <section className="lp-section lp-hero">
      <div className="lp-hero__copy">
        <span className="lp-eyebrow">Revenue forecasting</span>
        <h1 className="lp-h1" data-piece="headline">{copy.headline || "Forecast revenue you can defend in the boardroom"}</h1>
        <p className="lp-lead" data-piece="lead">{copy.lead || `${brand} reads your pipeline every night and tells you what will close, what will slip, and why.`}</p>
        <div className="lp-actions">
          <span className="lp-btn lp-btn--lg" data-piece="button">{copy.button || "Book a demo"}</span>
          <span className="lp-btn lp-btn--lg lp-btn--ghost">See how it works</span>
        </div>
        <span className="lp-note">Set up in a day. No change to your CRM.</span>
      </div>
      <ProductShot />
    </section>
  );
}

/* The whole demo page in one section: the pitch on the left, the form on the
   right, both on the first screen. */
export function HeroDemo({ copy = {} }) {
  const brand = useBrand();
  return (
    <section className="lp-section lp-hero lp-hero--demo">
      <div className="lp-hero__copy">
        <span className="lp-eyebrow">Book a demo</span>
        <h1 className="lp-h1" data-piece="headline">{copy.headline || `See ${brand} on your own pipeline`}</h1>
        <p className="lp-lead" data-piece="lead">{copy.lead || "A 30-minute call. We connect a read-only copy of your CRM and walk through this quarter together."}</p>
        <ul className="lp-list">
          <li>Your forecast, rebuilt deal by deal</li>
          <li>The five deals most at risk</li>
          <li>No preparation needed</li>
        </ul>
      </div>
      <div className="lp-form lp-form--card">
        {["Full name", "Work email", "Company", "Sales team size"].map((f) => (
          <label key={f} className="lp-form__field">
            <span className="lp-form__label">{f}</span>
            <span className="lp-input" />
          </label>
        ))}
        <span className="lp-btn lp-btn--lg lp-btn--block" data-piece="button">{copy.button || "Book a demo"}</span>
        <span className="lp-note">We reply within one working day.</span>
      </div>
    </section>
  );
}

export function HeroForm({ copy = {} }) {
  return (
    <section className="lp-section lp-hero lp-hero--center">
      <span className="lp-eyebrow">Free forecast review</span>
      <h1 className="lp-h1" data-piece="headline">{copy.headline || "See where this quarter's number is at risk"}</h1>
      <p className="lp-lead" data-piece="lead">{copy.lead || "Connect your CRM and get a deal-by-deal risk report in ten minutes."}</p>
      <div className="lp-capture">
        <span className="lp-input">Work email</span>
        <span className="lp-btn lp-btn--lg" data-piece="button">{copy.button || "Get my report"}</span>
      </div>
      <span className="lp-note">No credit card. Read-only access.</span>
    </section>
  );
}

export function LogoCloud({ copy = {} }) {
  return (
    <section className="lp-section lp-logos">
      <span className="lp-logos__label" data-piece="headline">{copy.headline || "Trusted by revenue teams at"}</span>
      <div className="lp-logos__row">
        {["Northfield", "Calloway", "Brightline", "Osprey", "Fennel & Co", "Harbor"].map((n) => (
          <span key={n} className="lp-logos__name">{n}</span>
        ))}
      </div>
    </section>
  );
}

export function StatsBand({ copy = {} }) {
  const stats = [
    ["92%", "forecast accuracy"],
    ["3.4×", "faster board preparation"],
    ["11 days", "saved each quarter"],
    ["400+", "revenue teams"],
  ];
  return (
    <section className="lp-section lp-stats">
      {stats.map(([n, l]) => (
        <div key={l} className="lp-stats__item">
          <span className="lp-stats__num">{n}</span>
          <span className="lp-stats__label">{l}</span>
        </div>
      ))}
    </section>
  );
}

export function Testimonial({ copy = {} }) {
  const brand = useBrand();
  return (
    <section className="lp-section lp-quote">
      <p className="lp-quote__text">
        “We stopped arguing about whose number was right. {brand} showed us the nine deals that decided the quarter, three weeks before it ended.”
      </p>
      <div className="lp-quote__by">
        <span className="lp-quote__avatar">DR</span>
        <span>
          <span className="lp-quote__name">Dana Reyes</span>
          <span className="lp-quote__role">VP Revenue Operations, Calloway</span>
        </span>
      </div>
    </section>
  );
}

export function FeatureGrid({ copy = {} }) {
  const items = [
    ["Deal-level risk", "Every open deal gets a likelihood to close and the reason behind it."],
    ["Nightly forecast", "The number updates itself from your CRM, with what changed since yesterday."],
    ["Board-ready report", "One page for finance: commit, best case, and the gap to plan."],
  ];
  return (
    <section className="lp-section lp-features">
      <h2 className="lp-h2" data-piece="headline">{copy.headline || "Everything behind the number"}</h2>
      <div className="lp-features__grid">
        {items.map(([t, d]) => (
          <div key={t} className="lp-features__card">
            <span className="lp-features__icon" />
            <span className="lp-features__title">{t}</span>
            <span className="lp-features__text">{d}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeatureSplit({ copy = {} }) {
  return (
    <section className="lp-section lp-split">
      <ProductShot />
      <div className="lp-split__copy">
        <span className="lp-eyebrow">Deal inspection</span>
        <h2 className="lp-h2" data-piece="headline">{copy.headline || "Know which deals decide the quarter"}</h2>
        <p className="lp-lead" data-piece="lead">{copy.lead || "Every open deal is ranked by how much it moves the forecast, so reviews start with the ones that matter."}</p>
        <ul className="lp-list">
          <li>Flags deals with no activity in 14 days</li>
          <li>Shows who on the buying committee has gone quiet</li>
          <li>Explains every change to the forecast</li>
        </ul>
      </div>
    </section>
  );
}

export function PricingThree({ copy = {} }) {
  const plans = [
    { name: "Team", price: "$1,200", note: "per month", lines: ["Up to 25 sellers", "Nightly forecast", "Email support"] },
    { name: "Business", price: "$2,900", note: "per month", lines: ["Up to 100 sellers", "Deal-level risk", "Board report", "Slack alerts"], best: true },
    { name: "Enterprise", price: "Custom", note: "annual contract", lines: ["Unlimited sellers", "Single sign-on", "Dedicated analyst"] },
  ];
  return (
    <section className="lp-section lp-pricing">
      <h2 className="lp-h2" data-piece="headline">{copy.headline || "Pricing that follows your team"}</h2>
      <div className="lp-pricing__grid">
        {plans.map((p) => (
          <div key={p.name} className={`lp-pricing__plan${p.best ? " lp-pricing__plan--best" : ""}`}>
            {p.best && <span className="lp-pricing__badge">Most chosen</span>}
            <span className="lp-pricing__name">{p.name}</span>
            <span className="lp-pricing__price">{p.price}</span>
            <span className="lp-pricing__note">{p.note}</span>
            <ul className="lp-list">{p.lines.map((l) => <li key={l}>{l}</li>)}</ul>
            <span className={`lp-btn${p.best ? "" : " lp-btn--ghost"}`}>{p.name === "Enterprise" ? "Talk to sales" : "Start a trial"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LeadForm({ copy = {} }) {
  const brand = useBrand();
  return (
    <section className="lp-section lp-lead-form">
      <div className="lp-lead-form__copy">
        <h2 className="lp-h2" data-piece="headline">{copy.headline || `See ${brand} on your own pipeline`}</h2>
        <p className="lp-lead" data-piece="lead">{copy.lead || "A 30-minute call. We connect a read-only copy of your CRM and walk through this quarter together."}</p>
        <ul className="lp-list">
          <li>Your forecast, rebuilt deal by deal</li>
          <li>The five deals most at risk</li>
          <li>No preparation needed</li>
        </ul>
      </div>
      <div className="lp-form">
        {["Full name", "Work email", "Company", "Sales team size"].map((f) => (
          <label key={f} className="lp-form__field">
            <span className="lp-form__label">{f}</span>
            <span className="lp-input" />
          </label>
        ))}
        <span className="lp-btn lp-btn--lg lp-btn--block" data-piece="button">{copy.button || "Book a demo"}</span>
      </div>
    </section>
  );
}

export function RoiCalculator({ copy = {} }) {
  const brand = useBrand();
  const inputs = [
    ["Sellers on your team", "60", 55],
    ["Average deal size", "$48,000", 40],
    ["Deals slipping each quarter", "14", 30],
  ];
  return (
    <section className="lp-section lp-roi">
      <div className="lp-roi__inputs">
        <h2 className="lp-h2" data-piece="headline">{copy.headline || "What slipped deals cost you"}</h2>
        {inputs.map(([label, value, pct]) => (
          <div key={label} className="lp-roi__row">
            <div className="lp-roi__row-head">
              <span>{label}</span>
              <span className="lp-roi__value">{value}</span>
            </div>
            <span className="lp-roi__track"><span className="lp-roi__fill" style={{ width: `${pct}%` }} /></span>
          </div>
        ))}
      </div>
      <div className="lp-roi__result">
        <span className="lp-roi__result-label">Recovered each year</span>
        <span className="lp-roi__result-num">$806,400</span>
        <span className="lp-roi__result-note">If {brand} catches 30% of slipping deals in time.</span>
        <span className="lp-btn lp-btn--lg lp-btn--block" data-piece="button">{copy.button || "Get the full breakdown"}</span>
      </div>
    </section>
  );
}

export function CtaBanner({ copy = {} }) {
  return (
    <section className="lp-section lp-cta">
      <h2 className="lp-h2" data-piece="headline">{copy.headline || "Walk into the next forecast call with the answer"}</h2>
      <span className="lp-btn lp-btn--lg lp-btn--invert" data-piece="button">{copy.button || "Book a demo"}</span>
    </section>
  );
}

export function Faq({ copy = {} }) {
  const brand = useBrand();
  const items = [
    ["How long does setup take?", `Most teams are live in a day. ${brand} reads your CRM as it is, with no fields to add.`],
    ["Which CRMs do you support?"],
    [`Does ${brand} change anything in our CRM?`],
    ["How is the forecast calculated?"],
  ];
  return (
    <section className="lp-section lp-faq">
      <h2 className="lp-h2" data-piece="headline">{copy.headline || "Questions teams ask first"}</h2>
      <div className="lp-faq__list">
        {items.map(([q, a]) => (
          <div key={q} className="lp-faq__item">
            <div className="lp-faq__q"><span>{q}</span><span className="lp-faq__sign">{a ? "−" : "+"}</span></div>
            {a && <p className="lp-faq__a">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function FooterColumns({ copy = {} }) {
  const brand = useBrand();
  const cols = [
    ["Product", ["Forecast", "Deal risk", "Board report", "Integrations"]],
    ["Solutions", ["Sales leaders", "Revenue operations", "Finance"]],
    ["Company", ["About", "Customers", "Careers"]],
    ["Resources", ["Guides", "Security", "Help centre"]],
  ];
  return (
    <footer className="lp-section lp-footer">
      <div className="lp-footer__top">
        <div className="lp-footer__brand">
          <Logo />
          <span className="lp-footer__tag">Revenue forecasting for B2B teams.</span>
        </div>
        {cols.map(([title, links]) => (
          <div key={title} className="lp-footer__col">
            <span className="lp-footer__title">{title}</span>
            {links.map((l) => <span key={l}>{l}</span>)}
          </div>
        ))}
      </div>
      <div className="lp-footer__legal">
        <span>© 2026 {brand}, Inc.</span>
        <span>Privacy · Terms</span>
      </div>
    </footer>
  );
}

export const SECTIONS = {
  HeaderSimple, HeroSplit, HeroDemo, HeroForm, LogoCloud, StatsBand, Testimonial, FeatureGrid,
  FeatureSplit, PricingThree, LeadForm, RoiCalculator, CtaBanner, Faq, FooterColumns,
};
