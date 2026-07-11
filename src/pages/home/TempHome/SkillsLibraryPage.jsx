import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, LayoutDashboard, FileText, LayoutGrid, List, Info } from "lucide-react";
import { cn } from "../../../utils/cn";
import { formatSkillName } from "./utils/formatSkillName";
import { SKILLS_CATALOG } from "../../../skills/skillsCatalog";

// Connector logos (src/assets/integrations). Glob handles filenames with spaces.
const CONNECTOR_ICON_MODULES = import.meta.glob("../../../assets/integrations/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
const CONNECTOR_ICON_BY_FILE = Object.fromEntries(
  Object.entries(CONNECTOR_ICON_MODULES).map(([path, url]) => [path.split("/").pop().toLowerCase(), url])
);
const CONNECTOR_FILE = {
  "6sense": "6sense.svg", GA4: "GA4.svg", Gong: "Gong.svg", "Google Ads": "Google Ads.svg",
  HubSpot: "HubSpot.svg", "LinkedIn Ads": "LinkedIn.svg", "LinkedIn Sales Navigator": "LinkedIn.svg",
  "Meta Ads": "Meta Ads.svg", Outreach: "Outreach.svg", Salesforce: "Salesforce.svg",
};
const connectorIcon = (name) => {
  const file = CONNECTOR_FILE[name];
  return file ? CONNECTOR_ICON_BY_FILE[file.toLowerCase()] || null : null;
};

function Connectors({ tags }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {(tags || []).slice(0, 5).map((name) => {
        const url = connectorIcon(name);
        return url ? (
          <img key={name} src={url} alt={name} title={name} className="w-[16px] h-[16px] rounded object-contain" loading="lazy" />
        ) : (
          <span key={name} title={name} className="px-2 py-0.5 text-[12px] rounded border bg-white text-[var(--text-secondary)] border-[var(--border-primary)] whitespace-nowrap">{name}</span>
        );
      })}
      {tags?.length > 5 && <span className="text-[12px] text-[var(--text-muted)]" title={tags.slice(5).join(", ")}>+{tags.length - 5}</span>}
    </div>
  );
}

const TABLE_COLS = "220px minmax(0,1fr) 120px 160px 90px 32px";

export default function SkillsLibraryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("grid"); // grid | table

  const skills = useMemo(
    () =>
      SKILLS_CATALOG.map((s) => ({
        id: s.slug,
        name: s.name,
        description: s.description,
        output_type: s.type === "memo" ? "memo" : "dashboard",
        tags: s.connectors,
        time: s.time,
      })),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return skills.filter((s) => {
      if (filter !== "all" && s.output_type !== filter) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q);
    });
  }, [skills, query, filter]);

  const open = (id) => navigate(`/skills/${id}`);

  return (
    <div className="flex flex-col w-full h-full overflow-x-auto">
      <div className="flex flex-col w-full h-full min-w-[900px]">
        {/* Top header — 60px, consistent with Workflows / Workbooks / Dashboards */}
        <div className="flex w-full px-6 items-center justify-between h-[60px] shrink-0 border-b border-[var(--color-grey-100)] bg-white">
          <span className="text-[16px] leading-[24px] font-medium">Skills</span>
        </div>

        {/* Grey framed content with a white list panel */}
        <div className="w-full p-4 flex bg-[var(--color-grey-50)]" style={{ height: "calc(100% - 60px)" }}>
          <div className="flex flex-col bg-white rounded-xl h-full w-full overflow-hidden border border-grey-100">

            {/* Panel sub-header: title + count · search · filter · view toggle */}
            <div className="flex items-center justify-between gap-3 h-14 shrink-0 w-full border-b border-[var(--color-grey-100)] px-4">
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-medium text-[14px] text-[var(--text-primary)]">{filter === "dashboard" ? "Dashboards" : filter === "memo" ? "Memos" : "Library"}</span>
                <span className="text-[12px] text-white bg-[var(--color-primary-500)] px-1.5 py-0.5 rounded-md tabular-nums">{filtered.length}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 h-8 w-80 px-3 bg-white border border-[#d4d9ea] rounded-lg focus-within:border-primary-500 transition-colors">
                  <Search size={15} className="text-[var(--text-muted)] shrink-0" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search skills…"
                    className="flex-1 text-[14px] bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[#adb2ce]" />
                </div>

                <div className="flex items-center gap-1 h-8 p-0.5 bg-grey-100 rounded-lg shrink-0">
                  {[{ id: "all", label: "All" }, { id: "dashboard", label: "Dashboard" }, { id: "memo", label: "Memo" }].map((f) => (
                    <button key={f.id} onClick={() => setFilter(f.id)}
                      className={cn("flex items-center h-7 px-2.5 text-[12px] font-medium rounded-md border-none cursor-pointer transition-colors",
                        filter === f.id ? "bg-white text-[var(--text-primary)] shadow-sm" : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-0.5 p-0.5 bg-grey-100 rounded-lg shrink-0">
                  {[{ id: "grid", Icon: LayoutGrid }, { id: "table", Icon: List }].map(({ id, Icon }) => (
                    <button key={id} onClick={() => setView(id)} aria-label={`${id} view`}
                      className={cn("flex items-center justify-center w-7 h-7 rounded-md border-none cursor-pointer transition-colors",
                        view === id ? "bg-white text-primary-600 shadow-sm" : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]")}>
                      <Icon size={15} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Important callout: these skills are pre-built; drafts get made final in chat.
                Styled as a distinct primary callout so it reads as a message, not body copy. */}
            <div className="flex items-start gap-2.5 px-4 py-3 border-b border-primary-100 bg-primary-50">
              <Info size={15} className="text-primary-600 shrink-0 mt-0.5" />
              <p className="text-[12px] text-[var(--text-secondary)] leading-snug">
                <span className="font-medium text-[var(--text-primary)]">These skills are pre-built by Petavue.</span> Activate one to build a draft on your data, then verify &amp; publish it in chat to make it final. Need a custom skill?{" "}
                <a href="mailto:support@petavue.com" className="font-medium text-primary-600 hover:text-primary-700 hover:underline">Contact Petavue support →</a>
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <p className="text-[14px] text-[var(--text-muted)]">No skills match “{query}”.</p>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-3 gap-6 p-4">
                  {filtered.map((skill) => {
                    const isMemo = skill.output_type === "memo";
                    const OutputIcon = isMemo ? FileText : LayoutDashboard;
                    return (
                      <div key={skill.id} onClick={() => open(skill.id)}
                        className="group flex flex-col gap-2 h-full p-5 bg-white border border-grey-100 rounded-lg cursor-pointer transition-[background-color,box-shadow] duration-150 hover:bg-primary-50 hover:shadow-[0_4px_12px_-2px_rgba(16,24,40,0.10)]">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className={cn("flex items-center gap-1 text-[12px] font-medium uppercase", isMemo ? "text-amber-700" : "text-blue-700")}>
                            <OutputIcon size={12} />{isMemo ? "Memo" : "Dashboard"}
                          </span>
                          {skill.time && <span className="text-[12px] font-medium text-[var(--color-green)] whitespace-nowrap">{skill.time}</span>}
                        </div>
                        <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.2px] text-[var(--text-primary)]">{formatSkillName(skill.name)}</h3>
                        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">{skill.description}</p>
                        <div className="flex items-center justify-between gap-3 mt-auto pt-4">
                          <Connectors tags={skill.tags} />
                          <span className="flex items-center gap-1 text-[12px] font-medium text-[var(--text-muted)] group-hover:text-primary-500 transition-colors whitespace-nowrap shrink-0">
                            Explore <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-4">
                  {/* Column header */}
                  <div className="grid gap-3 items-center px-3 pb-1 text-[12px] font-medium text-[var(--color-grey-500)]" style={{ gridTemplateColumns: TABLE_COLS }}>
                    <span>Skill</span><span>Description</span><span>Type</span><span>Connects</span><span>Build time</span><span />
                  </div>
                  {/* Rows — spaced bordered cards, single line, hover lift (like the workbook list) */}
                  {filtered.map((skill) => {
                    const isMemo = skill.output_type === "memo";
                    const OutputIcon = isMemo ? FileText : LayoutDashboard;
                    return (
                      <div key={skill.id} onClick={() => open(skill.id)}
                        className="group grid gap-3 items-center h-[56px] px-3 bg-white border border-[var(--color-grey-100)] rounded-lg cursor-pointer transition-[background-color,box-shadow] duration-150 hover:bg-primary-50 hover:shadow-[0_4px_12px_-2px_rgba(16,24,40,0.10)]" style={{ gridTemplateColumns: TABLE_COLS }}>
                        <span className="min-w-0 truncate text-[12px] text-[var(--text-primary)]">{formatSkillName(skill.name)}</span>
                        <span className="min-w-0 truncate text-[12px] text-[var(--text-muted)]">{skill.description}</span>
                        <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", isMemo ? "text-amber-700" : "text-blue-700")}>
                          <OutputIcon size={13} />{isMemo ? "Memo" : "Dashboard"}
                        </span>
                        <Connectors tags={skill.tags} />
                        <span className="text-[12px] text-[var(--text-secondary)] whitespace-nowrap">{skill.time}</span>
                        <ArrowRight size={15} className="text-[var(--text-muted)] group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all justify-self-end" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
