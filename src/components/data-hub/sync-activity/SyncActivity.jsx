import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetSyncSessions } from "./api/getSyncSessions";
import { useGetSyncSummary } from "./api/getSyncSummary";
import { useGetSourceIntegrations } from "./api/getSourceIntegrations";
import { CaretDown, CaretUp, Link as LinkIcon, ArrowsClockwise } from "@phosphor-icons/react";
import Skeleton from "./components/Skeleton";
import Tooltip from "@/components/Tooltip";
import {
  formatTime,
  formatDateTime,
  formatRecords,
  capitalize,
  getEmptyStateType,
  DATE_RANGE_OPTIONS,
  isAssociationObject,
  formatAssociationName,
  formatTableNameForTooltip
} from "./utils/syncFormatters";

const formatTimeWithTZ = (timestamp, timezone) => {
  if (!timestamp) return '-';

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';

  if (days === 0) {
    return `${formatTime(timestamp, timezone)} ${timezone}`;
  } else if (days === 1) {
    return `Yesterday at ${formatTime(timestamp, timezone)} ${timezone}`;
  } else {
    return `${formatDateTime(timestamp, timezone)} ${timezone}`;
  }
};

const STATUS_STYLES = {
  COMPLETED: {
    bg: "bg-[var(--pv-success-bg)]",
    text: "text-[var(--pv-success-text)]"
  },
  IN_PROGRESS: {
    bg: "bg-[var(--pv-primary-50)]",
    text: "text-[var(--pv-primary-500)]"
  },
  PENDING: {
    bg: "bg-[var(--pv-neutral-grey-100)]",
    text: "text-[var(--pv-neutral-grey-600)]"
  },
  FAILED: {
    bg: "bg-[var(--pv-error-bg)]",
    text: "text-[var(--pv-error-text)]"
  },
  SKIPPED: {
    bg: "bg-[var(--pv-warning-bg)]",
    text: "text-[var(--pv-warning-text)]"
  }
};

const StatusPill = ({ status, displayStatus, objects }) => {
  const config = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  const label = displayStatus || status || "Pending";

  // Build tooltip content for non-completed statuses
  let tooltipContent = null;
  if (
    objects &&
    (status === "PENDING" || status === "IN_PROGRESS" || status === "FAILED")
  ) {
    const relevantObjects = Object.entries(objects)
      .filter(([_, data]) => data.status === status)
      .map(([name]) => name);

    if (relevantObjects.length > 0) {
      tooltipContent = (
        <div className="space-y-1">
          <div className="font-medium mb-1">{label} Objects:</div>
          {relevantObjects.map((name) => (
            <div key={name}>• {name}</div>
          ))}
        </div>
      );
    }
  }

  const pill = (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-normal ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${status === "IN_PROGRESS" ? "animate-pulse" : ""}`}></span>
      {label}
    </span>
  );

  // Wrap in tooltip if there's content to show
  if (tooltipContent) {
    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <div className="inline-flex">{pill}</div>
      </Tooltip>
    );
  }

  return pill;
};

const DatasourceIcon = ({ session, integrations }) => {
  const isFivetran = session.sourceType === "fivetran";
  const searchKey = isFivetran ? session.datasource?.toLowerCase() : session.platform?.toLowerCase();

  const integration = integrations?.find(
    (i) => i.slug?.toLowerCase() === searchKey || i.name?.toLowerCase() === searchKey
  );

  if (integration?.logo) {
    const altText = isFivetran ? session.datasource || session.platform : session.platform;
    return <img src={integration.logo} alt={altText} width={20} />;
  }

  const label = isFivetran ? session.datasource || session.platform : session.platform;
  return (
    <div className="w-5 h-5 rounded bg-[var(--pv-primary-100)] flex items-center justify-center text-[10px] font-medium text-[var(--pv-primary-500)]">
      {(label || "?").charAt(0).toUpperCase()}
    </div>
  );
};

const getSessionDisplayLabel = (session) => {
  if (session.sourceType === "fivetran") {
    return session.datasource || session.platform;
  }
  return capitalize(session.platform);
};

const getDateKey = (timestamp) => {
  if (!timestamp) return "unknown";
  const date = new Date(timestamp);
  return date.toISOString().split("T")[0];
};

const getDateGroupLabel = (dateKey) => {
  if (dateKey === "unknown") return "Unknown Date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateKey + "T00:00:00");

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return targetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: today.getFullYear() !== targetDate.getFullYear() ? "numeric" : undefined
  });
};

const DateGroupHeader = ({ label }) => (
  <div className="flex items-center gap-3 mb-2 mt-4 first:mt-0">
    <span className="text-xs font-medium text-[var(--pv-neutral-grey-500)]">{label}</span>
    <div className="flex-1 h-px bg-[var(--pv-neutral-grey-200)]" />
  </div>
);

const SyncActivitySkeleton = () => {
  return (
    <div className="flex flex-col w-full">
      <div className="grid bg-[var(--pv-neutral-grey-50)] rounded-t-lg" style={{ gridTemplateColumns: "30% 20% 20% 15% 15%" }}>
        {["Platform", "Status", "Progress", "Time", ""].map((_, idx) => (
          <div key={idx} className="w-full p-2">
            <Skeleton width="60%" height={19} className="bg-[var(--pv-neutral-grey-200)]" />
          </div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, ind) => (
        <div className="grid h-[64px] items-center" style={{ gridTemplateColumns: "30% 20% 20% 15% 15%" }} key={ind}>
          {[1, 2, 3, 4, 5].map((_, idx) => (
            <div key={idx} className="w-full p-2">
              <Skeleton width={idx === 0 ? "70%" : "50%"} height={19} className="bg-[var(--pv-neutral-grey-200)]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const NoIntegrationsEmptyState = ({ integrationsPath = "/settings/integrations" }) => (
  <div className="bg-[var(--pv-neutral-grey-50)] rounded-lg p-8 text-center">
    <div className="flex justify-center mb-4">
      <LinkIcon size={40} className="text-[var(--pv-neutral-grey-400)]" />
    </div>
    <p className="text-sm font-medium text-[var(--pv-text-primary-text)] mb-2">Connect an integration</p>
    <p className="text-xs text-[var(--pv-neutral-grey-500)] mb-4">Connect a data source to start syncing your data automatically.</p>
    <Link
      to={integrationsPath}
      className="inline-flex items-center px-4 py-2 bg-[var(--pv-primary-500)] text-white text-xs font-medium rounded-lg hover:bg-[var(--pv-primary-700)] transition-colors"
    >
      Connect Integration
    </Link>
  </div>
);

const NoSessionsEmptyState = ({ rangeLabel }) => (
  <div className="bg-[var(--pv-neutral-grey-50)] rounded-lg p-8 text-center">
    <p className="text-sm font-medium text-[var(--pv-text-primary-text)] mb-2">No sync activity</p>
    <p className="text-xs text-[var(--pv-neutral-grey-500)]">
      No syncs found for {rangeLabel || "this period"}. Try a different date range or check back later.
    </p>
  </div>
);

const OverallSyncSummary = ({ sessions, rangeLabel, timezone }) => {
  const totalObjectCount = sessions.reduce((sum, s) => sum + (s.totalObjects || 0), 0);
  const completedObjectCount = sessions.reduce((sum, s) => sum + (s.completedObjects || 0), 0);
  const overallProgress = totalObjectCount > 0 ? Math.round((completedObjectCount / totalObjectCount) * 100) : 0;

  const latestSession = sessions.reduce((latest, s) => {
    const sTime = s.updatedAt || s.startedAt || 0;
    const latestTime = latest?.updatedAt || latest?.startedAt || 0;
    return sTime > latestTime ? s : latest;
  }, sessions[0]);

  const hasInProgress = sessions.some((s) => s.status === "IN_PROGRESS");
  const hasFailed = sessions.some((s) => s.status === "FAILED");
  const allCompleted = sessions.every((s) => s.status === "COMPLETED");

  // Aggregate all objects from all sessions for tooltip
  const allObjects = {};
  sessions.forEach((session) => {
    if (session.objects) {
      Object.entries(session.objects).forEach(([objectName, objectData]) => {
        if (!allObjects[objectName] || allObjects[objectName].status === "COMPLETED") {
          allObjects[objectName] = objectData;
        }
      });
    }
  });

  let overallStatus = "PENDING";
  let overallDisplayStatus = "Pending";
  if (allCompleted) {
    overallStatus = "COMPLETED";
    overallDisplayStatus = "Completed";
  } else if (hasInProgress) {
    overallStatus = "IN_PROGRESS";
    overallDisplayStatus = "In Progress";
  } else if (hasFailed) {
    overallStatus = "FAILED";
    overallDisplayStatus = "Facing Issues";
  }

  // Build progress bar tooltip content
  const progressTooltipContent = (() => {
    const entries = Object.entries(allObjects);
    const inProgress = entries.filter(([_, d]) => d.status === "IN_PROGRESS");
    const failed = entries.filter(([_, d]) => d.status === "FAILED");
    const pending = entries.filter(([_, d]) => d.status === "PENDING");
    const skipped = entries.filter(([_, d]) => d.status === "SKIPPED");
    const hasIncomplete = inProgress.length || failed.length || pending.length || skipped.length;

    if (!hasIncomplete) {
      return <div>All objects completed</div>;
    }

    const allNames = entries.map(([n]) => n);
    return (
      <div className="space-y-2">
        {inProgress.length > 0 && (
          <div>
            <div className="font-medium">In Progress:</div>
            {inProgress.map(([name]) => (
              <div key={name}>• {formatAssociationName(name, allNames)}</div>
            ))}
          </div>
        )}
        {failed.length > 0 && (
          <div>
            <div className="font-medium">Failed:</div>
            {failed.map(([name]) => (
              <div key={name}>• {formatAssociationName(name, allNames)}</div>
            ))}
          </div>
        )}
        {pending.length > 0 && (
          <div>
            <div className="font-medium">Pending:</div>
            {pending.map(([name]) => (
              <div key={name}>• {formatAssociationName(name, allNames)}</div>
            ))}
          </div>
        )}
        {skipped.length > 0 && (
          <div>
            <div className="font-medium">Skipped:</div>
            {skipped.map(([name]) => (
              <div key={name}>• {formatAssociationName(name, allNames)}</div>
            ))}
          </div>
        )}
      </div>
    );
  })();

  return (
    <div className="flex items-center justify-between bg-[var(--pv-neutral-grey-50)] rounded-lg px-4 py-3 mb-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-normal text-[var(--pv-text-primary-text)]">{rangeLabel || "Today's"} Sync</span>
          <StatusPill status={overallStatus} displayStatus={overallDisplayStatus} objects={allObjects} />
        </div>
        <div className="flex items-center gap-2">
          <Tooltip title={progressTooltipContent} arrow placement="top">
            <div className="w-24 h-2 rounded-full overflow-hidden flex bg-[var(--pv-neutral-grey-200)]">
              <div
                className="h-full rounded-full bg-[var(--pv-primary-500)]"
                style={{
                  width: `${overallProgress}%`,
                  minWidth: overallProgress > 0 ? "4px" : "0"
                }}
              />
            </div>
          </Tooltip>
          <span className="text-xs font-normal text-[var(--pv-primary-500)]">{overallProgress}%</span>
        </div>
        <span className="text-xs font-normal text-[var(--pv-neutral-grey-500)]">
          {completedObjectCount}/{totalObjectCount} objects
        </span>
      </div>
      <span className="text-xs font-normal text-[var(--pv-neutral-grey-500)]">
        Last updated: {formatTimeWithTZ(latestSession?.updatedAt || latestSession?.startedAt, timezone)}
      </span>
    </div>
  );
};

const SessionDetailCard = ({ session, isExpanded, onToggle, integrations, timezone }) => {
  const objects = session.objects || {};
  const objectEntries = Object.entries(objects);

  const completedCount = session.completedObjects || 0;
  const totalCount = session.totalObjects || objectEntries.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Build progress bar tooltip content
  const progressTooltipContent = (() => {
    const inProgress = objectEntries.filter(([_, d]) => d.status === "IN_PROGRESS");
    const failed = objectEntries.filter(([_, d]) => d.status === "FAILED");
    const pending = objectEntries.filter(([_, d]) => d.status === "PENDING");
    const skipped = objectEntries.filter(([_, d]) => d.status === "SKIPPED");
    const hasIncomplete = inProgress.length || failed.length || pending.length || skipped.length;

    if (!hasIncomplete) {
      return <div>All objects completed</div>;
    }

    const allNames = objectEntries.map(([n]) => n);
    return (
      <div className="space-y-2">
        {inProgress.length > 0 && (
          <div>
            <div className="font-medium">In Progress:</div>
            {inProgress.map(([name]) => (
              <div key={name}>• {formatAssociationName(name, allNames)}</div>
            ))}
          </div>
        )}
        {failed.length > 0 && (
          <div>
            <div className="font-medium">Failed:</div>
            {failed.map(([name]) => (
              <div key={name}>• {formatAssociationName(name, allNames)}</div>
            ))}
          </div>
        )}
        {pending.length > 0 && (
          <div>
            <div className="font-medium">Pending:</div>
            {pending.map(([name]) => (
              <div key={name}>• {formatAssociationName(name, allNames)}</div>
            ))}
          </div>
        )}
        {skipped.length > 0 && (
          <div>
            <div className="font-medium">Skipped:</div>
            {skipped.map(([name]) => (
              <div key={name}>• {formatAssociationName(name, allNames)}</div>
            ))}
          </div>
        )}
      </div>
    );
  })();

  return (
    <div className="border border-[var(--pv-neutral-grey-200)] rounded-lg overflow-hidden mb-2">
      <div
        className={`flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-[var(--pv-neutral-grey-50)] transition-colors border-b ${isExpanded ? "bg-[var(--pv-neutral-grey-50)] border-[var(--pv-neutral-grey-100)]" : "border-transparent"}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <DatasourceIcon session={session} integrations={integrations} />
          <span className="text-xs font-normal text-[var(--pv-text-primary-text)]">{getSessionDisplayLabel(session)}</span>
          <StatusPill status={session.status} displayStatus={session.displayStatus} objects={objects} />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-normal text-[var(--pv-neutral-grey-500)]">{formatRecords(session.recordsSyncedToday)} records</span>
          <span className="text-xs font-normal text-[var(--pv-neutral-grey-500)]">
            <span className="text-[var(--pv-text-primary-text)]">
              {completedCount}/{totalCount}
            </span>{" "}
            objects
          </span>
          <Tooltip title={progressTooltipContent} arrow placement="top">
            <div className="w-20 h-2 rounded-full overflow-hidden flex bg-[var(--pv-neutral-grey-200)]">
              <div
                className="h-full rounded-full bg-[var(--pv-primary-500)]"
                style={{
                  width: `${progress}%`,
                  minWidth: progress > 0 ? "4px" : "0"
                }}
              />
            </div>
          </Tooltip>
          <span className="text-xs font-normal text-[var(--pv-neutral-grey-500)]">{formatTimeWithTZ(session.startedAt, timezone)}</span>
          {isExpanded ? (
            <CaretUp size={14} className="text-[var(--pv-neutral-grey-500)]" />
          ) : (
            <CaretDown size={14} className="text-[var(--pv-neutral-grey-500)]" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--pv-neutral-grey-50)]">
                <th className="px-4 py-2 text-left text-xs font-normal text-[var(--pv-text-primary-text)]">Object</th>
                <th className="px-4 py-2 text-left text-xs font-normal text-[var(--pv-text-primary-text)]">Status</th>
                <th className="px-4 py-2 text-left text-xs font-normal text-[var(--pv-text-primary-text)]">
                  <Tooltip title="Total records in database when this sync completed" arrow placement="top">
                    <span className="cursor-help">Total Records</span>
                  </Tooltip>
                </th>
                <th className="px-4 py-2 text-left text-xs font-normal text-[var(--pv-text-primary-text)]">
                  <Tooltip title="Data has been refreshed up to this point in time" arrow placement="top">
                    <span className="cursor-help">Data Refreshed Until</span>
                  </Tooltip>
                </th>
                <th className="px-4 py-2 text-left text-xs font-normal text-[var(--pv-text-primary-text)]">
                  <Tooltip title="When this sync finished processing" arrow placement="top">
                    <span className="cursor-help">Sync Completed At</span>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {objectEntries.map(([objectName, objectData]) => {
                const allObjectNames = objectEntries.map(([n]) => n);
                const displayName = formatAssociationName(objectName, allObjectNames);
                const hasTableBreakdown = objectData.tableRecordCounts && Object.keys(objectData.tableRecordCounts).length > 0;

                return (
                  <tr key={objectName} className="border-t border-[var(--pv-neutral-grey-100)] hover:bg-[var(--pv-neutral-grey-50)]">
                    <td className="px-4 py-3 text-xs font-normal text-[var(--pv-text-primary-text)]">
                      {isAssociationObject(objectName) ? (
                        <Tooltip title="IDs that link your CRM records together" arrow placement="top">
                          <span className="cursor-help">{displayName}</span>
                        </Tooltip>
                      ) : (
                        displayName
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={objectData.status} displayStatus={objectData.displayStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs font-normal text-[var(--pv-text-primary-text)]">
                      {hasTableBreakdown ? (
                        <Tooltip
                          title={
                            <div className="space-y-1">
                              <div className="font-medium mb-1">Links breakdown:</div>
                              {Object.entries(objectData.tableRecordCounts).map(([table, count]) => (
                                <div key={table}>• {formatTableNameForTooltip(table)}: {formatRecords(count)}</div>
                              ))}
                            </div>
                          }
                          arrow
                          placement="top"
                        >
                          <span className="cursor-help">{formatRecords(objectData.totalRecords)}</span>
                        </Tooltip>
                      ) : (
                        formatRecords(objectData.totalRecords)
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-normal text-[var(--pv-text-primary-text)]">
                      {formatTimeWithTZ(objectData.syncedUntil, timezone)}
                    </td>
                    <td className="px-4 py-3 text-xs font-normal text-[var(--pv-text-primary-text)]">
                      {formatTimeWithTZ(objectData.completedAt, timezone)}
                    </td>
                  </tr>
                );
              })}
              {objectEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-xs font-normal text-[var(--pv-neutral-grey-500)]">
                    No objects in this sync session
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const SyncActivity = ({ integrationsPath = "/settings/integrations" }) => {
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [selectedRange, setSelectedRange] = useState("today");
  const [selectedDatasource, setSelectedDatasource] = useState("");

  const { data: syncSummary, refetch: refetchSummary } = useGetSyncSummary();

  const {
    data: sessionsData,
    isLoading,
    isFetching,
    refetch: refetchSessions
  } = useGetSyncSessions({
    pageSize: 20,
    range: selectedRange,
    datasource: selectedDatasource || undefined
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchSessions();
  };

  const { data: sourceIntegrations } = useGetSourceIntegrations({
    config: { staleTime: Infinity },
    level: "tenant-level"
  });

  const integrations = sourceIntegrations?.integrations || [];
  const timezone = sessionsData?.timezone || syncSummary?.timezone || "PST";
  const rangeLabel =
    sessionsData?.rangeLabel || DATE_RANGE_OPTIONS.find((o) => o.value === selectedRange)?.label || "Today";

  const datasourceFilterOptions = useMemo(() => {
    const platforms = syncSummary?.platforms || [];
    return platforms.map((p) => ({
      value: p.datasource || p.platform,
      label: p.datasource || capitalize(p.platform),
      sourceType: p.sourceType
    }));
  }, [syncSummary?.platforms]);

  const groupedSessions = useMemo(() => {
    const sessions = sessionsData?.data || [];

    const groups = {};
    sessions.forEach((session) => {
      const dateKey = getDateKey(session.startedAt || session.createdAt);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
    });

    Object.keys(groups).forEach((dateKey) => {
      groups[dateKey].sort((a, b) => {
        if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
        if (b.status === "IN_PROGRESS" && a.status !== "IN_PROGRESS") return 1;
        return (b.startedAt || 0) - (a.startedAt || 0);
      });
    });

    const sortedDateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    return sortedDateKeys.map((dateKey) => ({
      dateKey,
      label: getDateGroupLabel(dateKey),
      sessions: groups[dateKey]
    }));
  }, [sessionsData?.data]);

  const allSessions = useMemo(() => {
    return groupedSessions.flatMap((g) => g.sessions);
  }, [groupedSessions]);

  const handleToggle = (sessionId) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  const emptyStateType = getEmptyStateType(datasourceFilterOptions, sessionsData);

  return (
    <div className="relative flex flex-col flex-1 overflow-y-auto bg-[var(--pv-neutral-grey-50)] min-h-full">
      <div className="bg-white rounded-lg m-4 pt-4 min-w-[900px]">
        <div className="flex px-4 items-center justify-between pb-4">
          <div className="flex gap-4 items-center">
            <p className="font-normal text-sm leading-5 text-[var(--pv-text-primary-text)]">Sync Activity</p>
            <span className="px-2 py-0.5 text-xs font-normal text-[var(--pv-neutral-grey-500)] bg-[var(--pv-neutral-grey-100)] rounded">
              Timezone: {timezone}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-[var(--pv-neutral-grey-600)] hover:text-[var(--pv-text-primary-text)] hover:bg-[var(--pv-neutral-grey-100)] rounded-lg transition-colors disabled:opacity-50"
            >
              <ArrowsClockwise size={14} className={isFetching ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <select
              value={selectedRange}
              onChange={(e) => { setSelectedRange(e.target.value); setExpandedSessionId(null); }}
              className="px-3 py-1.5 text-xs border border-[var(--pv-neutral-grey-200)] rounded-lg bg-white text-[var(--pv-text-primary-text)] focus:outline-none focus:ring-1 focus:ring-[var(--pv-primary-500)]"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedDatasource}
              onChange={(e) => { setSelectedDatasource(e.target.value); setExpandedSessionId(null); }}
              className="px-3 py-1.5 text-xs border border-[var(--pv-neutral-grey-200)] rounded-lg bg-white text-[var(--pv-text-primary-text)] focus:outline-none focus:ring-1 focus:ring-[var(--pv-primary-500)]"
            >
              <option value="">All Datasources</option>
              {datasourceFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center pb-4 items-center px-4">
            <SyncActivitySkeleton />
          </div>
        ) : emptyStateType === "NO_INTEGRATIONS" ? (
          <div className="px-4 pb-4">
            <NoIntegrationsEmptyState integrationsPath={integrationsPath} />
          </div>
        ) : emptyStateType === "NO_SESSIONS_IN_RANGE" ? (
          <div className="px-4 pb-4">
            <NoSessionsEmptyState rangeLabel={rangeLabel} />
          </div>
        ) : (
          <div className="px-4 pb-4">
            <OverallSyncSummary sessions={allSessions} rangeLabel={rangeLabel} timezone={timezone} />

            {groupedSessions.map((group) => (
              <div key={group.dateKey}>
                {(selectedRange !== "today" || groupedSessions.length > 1) && <DateGroupHeader label={group.label} />}
                {group.sessions.map((session) => (
                  <SessionDetailCard
                    key={session._id}
                    session={session}
                    isExpanded={expandedSessionId === session._id}
                    onToggle={() => handleToggle(session._id)}
                    integrations={integrations}
                    timezone={timezone}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncActivity;
