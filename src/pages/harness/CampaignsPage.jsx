/**
 * Campaigns — the start-from-campaigns surface (UX concept).
 *
 * Synced from the ad platforms and joined to HubSpot: the marketer sees
 * campaigns and their real performance with nothing to build. Pipeline and
 * cost-per-opp are CRM-grounded on purpose — the platform's own numbers are
 * what the proof strip on the detail page corrects.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlass, CaretRight, CheckCircle, Warning } from "@phosphor-icons/react";
import { Button } from "@/ui";
import { apiGet } from "../../api";
import { cn } from "../../utils/cn";
import SourceIcon from "../../components/SourceIcon";
import { fmtMoney } from "./bits";

const COLS = "minmax(0,1.7fr) 120px 86px 96px 92px 130px 120px 28px";

function HeaderCell({ label, right }) {
  return (
    <span className={cn("px-2 text-[12px] font-medium leading-[19px] whitespace-nowrap text-[var(--color-text-secondary)]", right && "text-right")}>
      {label}
    </span>
  );
}

function IcpBar({ pct }) {
  const tone = pct >= 75 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-rose-500";
  return (
    <span className="flex items-center gap-2 px-2">
      <span className="flex-1 h-1.5 rounded-full bg-[var(--color-grey-100)] overflow-hidden">
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-[12px] tabular-nums text-[var(--text-primary)] w-8 text-right">{pct}%</span>
    </span>
  );
}

function Row({ c, onOpen }) {
  return (
    <div
      onClick={onOpen}
      className="grid items-center w-full px-3 min-h-[58px] py-2.5 shrink-0 bg-white border border-[var(--color-grey-100)] rounded-lg hover:bg-[var(--color-primary-50)] hover:shadow-[0_4px_12px_-2px_rgba(16,24,40,0.10)] transition-all cursor-pointer"
      style={{ gridTemplateColumns: COLS }}
    >
      <span className="flex items-center min-w-0 px-2">
        <span className="text-[12px] font-medium text-[var(--text-primary)] leading-snug truncate">{c.name}</span>
      </span>

      <span className="flex items-center gap-1.5 min-w-0 px-2">
        <SourceIcon name={c.channel} size={14} />
        <span className="text-[12px] text-[#757A97] truncate">{c.channel}</span>
      </span>

      <span className="px-2 text-[12px] text-right tabular-nums text-[var(--text-primary)]">{fmtMoney(c.spend30d)}</span>
      <span className="px-2 text-[12px] text-right tabular-nums text-[var(--text-primary)]">{fmtMoney(c.pipeline)}</span>
      <span className="px-2 text-[12px] text-right tabular-nums text-[var(--text-primary)]">
        {c.opps > 0 ? fmtMoney(Math.round(c.spend30d / c.opps)) : "—"}
      </span>

      <IcpBar pct={c.icpMatch} />

      <span className="px-2">
        {c.openFindings > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-rose-600 font-medium">
            <Warning size={13} weight="fill" />
            {c.openFindings} finding{c.openFindings === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600">
            <CheckCircle size={13} weight="fill" /> Healthy
          </span>
        )}
      </span>

      <span className="flex justify-center text-[var(--text-muted)]">
        <CaretRight size={15} />
      </span>
    </div>
  );
}

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["harness-campaigns"],
    queryFn: () => apiGet("/api/harness/campaigns"),
  });
  const campaigns = data?.campaigns || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) => !q || `${c.name} ${c.channel} ${c.objective}`.toLowerCase().includes(q));
  }, [campaigns, search]);

  return (
    <div className="flex flex-col w-full h-full overflow-x-auto">
      <div className="flex flex-col w-full h-full min-w-[900px]">
        <div className="flex w-full px-6 items-center h-[60px] shrink-0 border-b border-[var(--color-grey-100)] bg-white">
          <span className="text-[16px] leading-[24px] font-medium">Campaigns</span>
        </div>

        <div className="w-full p-4 flex overflow-x-auto bg-[var(--color-grey-50)]" style={{ height: "calc(100% - 60px)" }}>
          <div className="flex flex-col bg-white rounded-xl h-full w-full overflow-hidden min-w-[900px]">
            <div className="flex items-center justify-between h-14 shrink-0 w-full border-b border-[var(--color-grey-100)] bg-white">
              <div className="px-8 flex gap-2.5 items-center">
                <span className="font-medium text-[14px]">All campaigns</span>
                <span className="text-xs text-white bg-[var(--color-primary-500)] px-1.5 py-0.5 rounded-md tabular-nums">
                  {filtered.length}
                </span>
              </div>
              <div className="flex gap-3 items-center pr-4">
                <div className="flex flex-1 items-center w-80 border border-grey-200 rounded-lg bg-white focus-within:border-primary-500 hover:border-primary-300 py-2 px-3 transition-colors">
                  <span className="mr-1.5 text-grey-500"><MagnifyingGlass size={16} /></span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search campaigns"
                    aria-label="Search campaigns"
                    className="w-full min-w-0 resize-none outline-none border-none bg-transparent text-xs text-grey-900 placeholder:text-[var(--text-secondary)]"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  label="Create new"
                  onClick={() => navigate("/home", { state: { seed: "Create a new campaign" } })}
                />
              </div>
            </div>

            <div className="w-full flex-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col w-full px-4 py-4 gap-2">
                <div className="grid w-full items-center px-3 py-2" style={{ gridTemplateColumns: COLS }}>
                  <HeaderCell label="Campaign" />
                  <HeaderCell label="Channel" />
                  <HeaderCell label="Spend" right />
                  <HeaderCell label="Pipeline" right />
                  <HeaderCell label="Cost / opp" right />
                  <HeaderCell label="ICP match" />
                  <HeaderCell label="Findings" />
                  <span />
                </div>

                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 h-[58px] bg-white border border-[var(--color-grey-100)] rounded-lg">
                      <div className="h-3.5 w-1/3 rounded bg-[var(--color-grey-100)] animate-pulse" />
                    </div>
                  ))
                ) : (
                  filtered.map((c) => <Row key={c.id} c={c} onOpen={() => navigate(`/campaigns/${c.id}`)} />)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
