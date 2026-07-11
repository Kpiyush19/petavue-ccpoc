import { useState, useEffect, useRef, useMemo } from 'react';
import { MenuBar } from '@/ui/components/MenuBar';
import { Tag } from '@/ui/components/Tags/Tag/Tag';
import { Button } from '@/ui/components/Button/Button';
import { Toggle } from '@/ui/components/Toggle/Toggle';
import {
  DotsThree,
  PencilSimple,
  TrashSimple,
  CaretRight,
} from '@phosphor-icons/react';
import { METRICS_DATA, parseSourceColumns, extractSourceKeys } from './metricsData';
import salesforceLogo from './assets/salesforce.png';
import marketoLogo from './assets/marketo.svg';
import gongLogo from './assets/gong.svg';
import mixpanelLogo from './assets/mixpanel.svg';
import outreachLogo from './assets/outreach.svg';
import hubspotLogo from './assets/hubspot.svg';
import { SourceDetail } from './SourceDetail';
import './SourceDetail.css';
import './DataHub.css';

const NAV_ITEMS = [
  { id: 'chats', label: 'Workbook', icon: 'chats' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'data-hub', label: 'Data Hub', icon: 'data-hub' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'project', label: 'Projects', icon: 'project' },
];

const LOGO_MAP = {
  salesforce: salesforceLogo,
  marketo: marketoLogo,
  gong: gongLogo,
  mixpanel: mixpanelLogo,
  outreach: outreachLogo,
  hubspot: hubspotLogo,
  product_usage: mixpanelLogo,
};

const SOURCE_LABEL_MAP = {
  salesforce: 'Salesforce',
  marketo: 'Marketo',
  product_usage: 'Product Usage',
  gong: 'Gong',
  outreach: 'Outreach',
  hubspot: 'HubSpot',
};

const SOURCES = [
  { id: 1, name: 'Salesforce Data', logoKey: 'salesforce', description: 'A self-securing and self-repairing database that uses tables, rows, and columns to organize and manage data', enabledTables: 3, totalTables: 10 },
  { id: 2, name: 'Marketo Data', logoKey: 'marketo', description: 'Marketing automation platform for managing and analyzing campaigns.', enabledTables: 0, totalTables: 12 },
  { id: 3, name: 'Gong', logoKey: 'gong', description: 'Revenue intelligence tool that analyzes sales conversations.', enabledTables: 2, totalTables: 9 },
  { id: 4, name: 'Mixpanel Data', logoKey: 'mixpanel', description: 'User analytics platform tracking product usage and engagement.', enabledTables: 6, totalTables: 18 },
  { id: 5, name: 'Outreach', logoKey: 'outreach', description: 'Sales engagement platform for optimizing communication workflows.', enabledTables: 0, totalTables: 18 },
  { id: 6, name: 'Hubspot', logoKey: 'hubspot', description: 'CRM platform for marketing, sales, and customer service management.', enabledTables: 3, totalTables: 9 },
];

/* Recent sync sessions (most recent first). Fixed IST timestamps, no relative times. */
const SYNC_SESSIONS = [
  { id: 1, name: 'Salesforce Data', logoKey: 'salesforce', status: 'Completed', records: '1.2M', completedObjects: 10, totalObjects: 10, lastSync: 'Jun 17, 6:00 AM IST' },
  { id: 2, name: 'Hubspot', logoKey: 'hubspot', status: 'Completed', records: '482K', completedObjects: 9, totalObjects: 9, lastSync: 'Jun 17, 6:00 AM IST' },
  { id: 3, name: 'Marketo Data', logoKey: 'marketo', status: 'In Progress', records: '56K', completedObjects: 7, totalObjects: 12, lastSync: 'Jun 17, 9:15 AM IST' },
  { id: 4, name: 'Gong', logoKey: 'gong', status: 'Completed', records: '18K', completedObjects: 9, totalObjects: 9, lastSync: 'Jun 17, 5:30 AM IST' },
  { id: 5, name: 'Mixpanel Data', logoKey: 'mixpanel', status: 'Failed', records: '—', completedObjects: 3, totalObjects: 18, lastSync: 'Jun 16, 11:40 PM IST' },
  { id: 6, name: 'Outreach', logoKey: 'outreach', status: 'Queued', records: '—', completedObjects: 0, totalObjects: 18, lastSync: '—' },
];

const SYNC_STATUS_COLOR = {
  'Completed': 'success-green',
  'In Progress': 'blue',
  'Failed': 'error-red',
  'Queued': 'warning-yellow',
};

/* ─── Three Dots Dropdown ─── */

function ActionDropdown({ onClose, onEdit, onDelete }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="data-hub__dropdown" ref={ref}>
      <button className="data-hub__dropdown-item" onClick={() => { onEdit(); onClose(); }}>
        <span className="data-hub__dropdown-icon">
          <PencilSimple size={16} weight="regular" />
        </span>
        Edit
      </button>
      <button className="data-hub__dropdown-item data-hub__dropdown-item--danger" onClick={() => { onDelete(); onClose(); }}>
        <span className="data-hub__dropdown-icon">
          <TrashSimple size={16} weight="regular" />
        </span>
        Delete
      </button>
    </div>
  );
}

/* ─── Definition Row ─── */

function DefinitionRow({ index, metric, onOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const sourceKeys = useMemo(() => extractSourceKeys(metric.rawSources), [metric.rawSources]);

  return (
    <div className="data-hub__row" onClick={() => onOpen(metric)}>
      <span className="data-hub__row-num">{index}.</span>
      <span className="data-hub__col-metric-name">
        <span className="data-hub__metric-name">{metric.name}</span>
      </span>
      <span className="data-hub__col-description">
        <span className="data-hub__description-text">
          {metric.description || '\u2014'}
        </span>
      </span>
      <span className="data-hub__col-sources">
        <span className="data-hub__source-logos">
          {sourceKeys.map((key) => (
            <img
              key={key}
              src={LOGO_MAP[key]}
              alt={SOURCE_LABEL_MAP[key]}
              className="data-hub__source-logo"
              title={SOURCE_LABEL_MAP[key]}
            />
          ))}
        </span>
      </span>
      <span className="data-hub__col-status">
        <Tag color={metric.status === 'enabled' ? 'success-green' : 'error-red'} size="sm">
          {metric.status === 'enabled' ? 'Enabled' : 'Disabled'}
        </Tag>
      </span>
      <div className="data-hub__dots-wrapper">
        <button
          className="data-hub__dots-btn"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          aria-label="Actions"
        >
          <DotsThree size={20} weight="regular" />
        </button>
        {menuOpen && (
          <ActionDropdown
            onClose={() => setMenuOpen(false)}
            onEdit={() => onOpen(metric)}
            onDelete={() => {}}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Source Row (Dictionary) ─── */

function SourceRow({ index, source, onOpen }) {
  return (
    <div className="data-hub__row" onClick={() => onOpen && onOpen(source)}>
      <span className="data-hub__row-num">{index}.</span>
      <span className="data-hub__col-source">
        <img src={LOGO_MAP[source.logoKey]} alt={`${source.name} logo`} className="data-hub__source-logo" />
        <span className="data-hub__source-name">{source.name}</span>
      </span>
      <span className="data-hub__col-description">
        <span className="data-hub__description-text">{source.description}</span>
      </span>
      <span className="data-hub__col-tables">
        {source.enabledTables} / {source.totalTables} Enabled
      </span>
    </div>
  );
}

/* ─── Sync Activity Row ─── */

function SyncRow({ index, session }) {
  return (
    <div className="data-hub__row data-hub__row--sync">
      <span className="data-hub__row-num">{index}.</span>
      <span className="data-hub__col-source">
        <img src={LOGO_MAP[session.logoKey]} alt={`${session.name} logo`} className="data-hub__source-logo" />
        <span className="data-hub__source-name">{session.name}</span>
      </span>
      <span className="data-hub__col-status">
        <Tag color={SYNC_STATUS_COLOR[session.status] || 'blue'} size="sm">
          {session.status}
        </Tag>
      </span>
      <span className="data-hub__col-records">{session.records} records</span>
      <span className="data-hub__col-objects">
        {session.completedObjects} / {session.totalObjects} objects
      </span>
      <span className="data-hub__col-lastsync">{session.lastSync}</span>
    </div>
  );
}

/* ─── Metric Detail View ─── */

function MetricDetail({ metric, onBack }) {
  const sourceColumns = useMemo(() => parseSourceColumns(metric.rawSources), [metric.rawSources]);
  const [statusEnabled, setStatusEnabled] = useState(metric.status === 'enabled');
  const [name, setName] = useState(metric.name);
  const [description, setDescription] = useState(metric.description || '');

  const isDirty = name !== metric.name
    || description !== (metric.description || '')
    || statusEnabled !== (metric.status === 'enabled');

  const formulaLines = (metric.formula || '').split('\n');

  return (
    <div className="data-hub__detail">
      {/* Detail header / breadcrumb */}
      <div className="data-hub__detail-header">
        <div className="data-hub__detail-breadcrumb">
          <button type="button" className="data-hub__detail-back" onClick={onBack}>
            Definitions
          </button>
          <CaretRight size={16} weight="regular" color="var(--color-text-secondary)" />
          <span className="data-hub__detail-title">{name}</span>
          <Tag color="orange" size="sm">Formula</Tag>
        </div>
        <div className="data-hub__detail-status">
          <span className="data-hub__detail-status-label">Status</span>
          <Toggle checked={statusEnabled} onChange={() => setStatusEnabled(!statusEnabled)} />
        </div>
      </div>

      {/* Detail body */}
      <div className="data-hub__detail-body">
        {/* Name field */}
        <div className="data-hub__detail-field">
          <label className="data-hub__detail-label" htmlFor="metric-name">Name*</label>
          <input
            id="metric-name"
            type="text"
            className="data-hub__field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Description field */}
        <div className="data-hub__detail-field">
          <label className="data-hub__detail-label" htmlFor="metric-desc">Description*</label>
          <textarea
            id="metric-desc"
            className="data-hub__field-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Formula */}
        <div className="data-hub__detail-field">
          <span className="data-hub__detail-label">Formula</span>
          <div className="data-hub__detail-formula">
            {formulaLines.map((line, i) => {
              const trimmed = line.trimStart();
              const isStep = /^\d+\./.test(trimmed);
              const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
              if (isStep) {
                return <p key={i} className="data-hub__formula-step">{trimmed}</p>;
              }
              if (isBullet) {
                return <p key={i} className="data-hub__formula-bullet">{trimmed.replace(/^[-*]\s*/, '')}</p>;
              }
              return <p key={i} className="data-hub__formula-text">{trimmed}</p>;
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="data-hub__detail-divider" />

        {/* Sources header */}
        <div className="data-hub__detail-field">
          <div className="data-hub__detail-sources-header">
            <span className="data-hub__detail-label">Sources</span>
            <span className="data-hub__toolbar-count">{sourceColumns.length}</span>
          </div>
          <p className="data-hub__detail-sources-desc">
            Sources enable the system to accurately retrieve the right data for your definitions when used in an analysis
          </p>
        </div>

        {/* Sources table */}
        <div className="data-hub__detail-sources">
          <div className="data-hub__detail-sources-divider">
            <span className="data-hub__detail-sources-divider-label">User picked columns</span>
            <span className="data-hub__detail-sources-divider-line" />
          </div>

          <div className="data-hub__detail-sources-table">
            <div className="data-hub__detail-sources-header-row">
              <span className="data-hub__dsc-num">#</span>
              <span className="data-hub__dsc-field">Field Name</span>
              <span className="data-hub__dsc-table">Table</span>
              <span className="data-hub__dsc-column">Column</span>
              <span className="data-hub__dsc-type">Data Type</span>
              <span className="data-hub__dsc-desc">Description</span>
              <span className="data-hub__dsc-sample">Sample Data</span>
            </div>
            {sourceColumns.map((col, i) => (
              <div key={i} className="data-hub__row data-hub__row--source-detail">
                <span className="data-hub__dsc-num">{i + 1}.</span>
                <span className="data-hub__dsc-field">
                  <span className="data-hub__dsc-field-name">{col.fieldName}</span>
                </span>
                <span className="data-hub__dsc-table">
                  <img
                    src={LOGO_MAP[col.logoKey]}
                    alt={col.tableLabel}
                    className="data-hub__source-logo"
                  />
                  <span className="data-hub__dsc-table-name">{col.tableLabel}</span>
                </span>
                <span className="data-hub__dsc-column">
                  <span className="data-hub__dsc-col-name">{col.column}</span>
                </span>
                <span className="data-hub__dsc-type">
                  <span className="data-hub__dsc-type-tag">{col.dataType}</span>
                </span>
                <span className="data-hub__dsc-desc">
                  <span className="data-hub__description-text">{'\u2014'}</span>
                </span>
                <span className="data-hub__dsc-sample">
                  <button type="button" className="data-hub__dsc-view-btn">View</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="data-hub__detail-footer">
        <Button variant="ghost" label="Cancel" onClick={onBack} />
        <Button variant={isDirty ? 'primary' : 'secondary'} label="Update" disabled={!isDirty} />
      </div>
    </div>
  );
}

/* ─── Main DataHub Page ─── */

export function DataHub({
  user = { name: 'Ammie Diego', initials: 'AD', email: 'ammie.diego@work.com' },
  onNavigate,
  menuOpen,
  onMenuToggle,
}) {
  const [activeTab, setActiveTab] = useState('dictionary');
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);

  return (
    <div className="data-hub">
      <MenuBar
        items={NAV_ITEMS}
        activeId="data-hub"
        onItemClick={(id) => onNavigate && onNavigate(id)}
        user={user}
        onNewChat={() => onNavigate && onNavigate('new-chat')}
        isOpen={menuOpen}
        onToggle={onMenuToggle}
        onProfile={() => onNavigate && onNavigate('profile')}
        onSettings={() => onNavigate && onNavigate('settings')}
      />

      <div className="data-hub__body">
        {/* Page header */}
        <div className="data-hub__header">
          <span className="data-hub__breadcrumb">Data Hub</span>
        </div>

        {/* When a source is selected, show dictionary detail */}
        {selectedSource ? (
          <>
            <div className="data-hub__breadcrumb-bar">
              <button type="button" className="data-hub__breadcrumb-link" onClick={() => setSelectedSource(null)}>
                Dictionary
              </button>
              <CaretRight size={12} weight="regular" color="var(--color-text-secondary)" />
              <span className="data-hub__breadcrumb-current">
                {LOGO_MAP[selectedSource.logoKey] && (
                  <img src={LOGO_MAP[selectedSource.logoKey]} alt="" className="data-hub__source-logo" />
                )}
                {selectedSource.name}
              </span>
            </div>
            <SourceDetail source={selectedSource} logoMap={LOGO_MAP} onBack={() => setSelectedSource(null)} />
          </>
        ) : selectedMetric ? (
          <MetricDetail
            metric={selectedMetric}
            onBack={() => setSelectedMetric(null)}
          />
        ) : (
          <>
            {/* Tabs bar */}
            <div className="data-hub__tabs-bar">
              <div className="data-hub__tabs">
                <button
                  type="button"
                  className={`data-hub__tab ${activeTab === 'dictionary' ? 'data-hub__tab--active' : ''}`}
                  onClick={() => setActiveTab('dictionary')}
                  role="tab"
                  aria-selected={activeTab === 'dictionary'}
                >
                  Dictionary
                </button>
                <button
                  type="button"
                  className={`data-hub__tab ${activeTab === 'definitions' ? 'data-hub__tab--active' : ''}`}
                  onClick={() => setActiveTab('definitions')}
                  role="tab"
                  aria-selected={activeTab === 'definitions'}
                >
                  Definitions
                </button>
                <button
                  type="button"
                  className={`data-hub__tab ${activeTab === 'sync-activity' ? 'data-hub__tab--active' : ''}`}
                  onClick={() => setActiveTab('sync-activity')}
                  role="tab"
                  aria-selected={activeTab === 'sync-activity'}
                >
                  Sync Activity
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="data-hub__content">
              {activeTab === 'dictionary' && (
                <>
                  <div className="data-hub__toolbar">
                    <div className="data-hub__toolbar-tab">
                      Sources
                      <span className="data-hub__toolbar-count">{SOURCES.length}</span>
                    </div>
                  </div>
                  <div className="data-hub__table">
                    <div className="data-hub__table-header">
                      <span className="data-hub__col-num data-hub__col-label">#</span>
                      <span className="data-hub__col-source data-hub__col-label">Data Sources</span>
                      <span className="data-hub__col-description data-hub__col-label">Description</span>
                      <span className="data-hub__col-tables data-hub__col-label">Tables</span>
                    </div>
                    <div className="data-hub__rows">
                      {SOURCES.map((source, i) => (
                        <SourceRow key={source.id} index={i + 1} source={source} onOpen={setSelectedSource} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'definitions' && (
                <>
                  <div className="data-hub__toolbar">
                    <div className="data-hub__toolbar-tab">
                      Configured
                      <span className="data-hub__toolbar-count">{METRICS_DATA.length}</span>
                    </div>
                  </div>
                  <div className="data-hub__table">
                    <div className="data-hub__table-header data-hub__table-header--definitions">
                      <span className="data-hub__col-num data-hub__col-label">#</span>
                      <span className="data-hub__col-metric-name data-hub__col-label">Name</span>
                      <span className="data-hub__col-description data-hub__col-label">Description</span>
                      <span className="data-hub__col-sources data-hub__col-label">Sources</span>
                      <span className="data-hub__col-status data-hub__col-label">Status</span>
                      <span className="data-hub__col-actions" />
                    </div>
                    <div className="data-hub__rows">
                      {METRICS_DATA.map((metric, i) => (
                        <DefinitionRow
                          key={metric.id}
                          index={i + 1}
                          metric={metric}
                          onOpen={setSelectedMetric}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'sync-activity' && (
                <>
                  <div className="data-hub__toolbar">
                    <div className="data-hub__toolbar-tab">
                      Recent Syncs
                      <span className="data-hub__toolbar-count">{SYNC_SESSIONS.length}</span>
                    </div>
                  </div>
                  <div className="data-hub__table">
                    <div className="data-hub__table-header data-hub__table-header--sync">
                      <span className="data-hub__col-num data-hub__col-label">#</span>
                      <span className="data-hub__col-source data-hub__col-label">Data Source</span>
                      <span className="data-hub__col-status data-hub__col-label">Status</span>
                      <span className="data-hub__col-records data-hub__col-label">Records</span>
                      <span className="data-hub__col-objects data-hub__col-label">Objects</span>
                      <span className="data-hub__col-lastsync data-hub__col-label">Last Sync Time</span>
                    </div>
                    <div className="data-hub__rows">
                      {SYNC_SESSIONS.map((session, i) => (
                        <SyncRow key={session.id} index={i + 1} session={session} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
