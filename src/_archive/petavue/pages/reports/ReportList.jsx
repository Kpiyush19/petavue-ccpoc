import { useState, useEffect, useRef } from 'react';
import { MenuBar } from '@/ui/components/MenuBar';
import {
  MagnifyingGlass,
  DotsThree,
  PencilSimple,
  TrashSimple,
  DownloadSimple,
} from '@phosphor-icons/react';
import './ReportList.css';

const NAV_ITEMS = [
  { id: 'chats', label: 'Workbook', icon: 'chats' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'data-hub', label: 'Data Hub', icon: 'data-hub' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'project', label: 'Projects', icon: 'project' },
];

const INITIAL_REPORTS = [
  { id: 1, name: 'Mid-market: Sales Funnel Report', requestedBy: 'Austin Miles', initials: 'AM', upcomingUpdate: '16th Apr 2026', goal: 'Q2 Pipeline Performance Analysis' },
  { id: 2, name: 'People Insights Usage by Region', requestedBy: 'Austin Miles', initials: 'AM', upcomingUpdate: '20th Apr 2026', goal: 'Product Adoption' },
  { id: 3, name: 'Lead Conversion Rates', requestedBy: 'Austin Miles', initials: 'AM', upcomingUpdate: '20th Apr 2026', goal: 'Marketing' },
  { id: 4, name: 'Website Traffic Analytics', requestedBy: 'Austin Miles', initials: 'AM', upcomingUpdate: '19th Apr 2026', goal: 'Marketing' },
  { id: 5, name: 'Top Accounts with Spike in AI Feature Usage', requestedBy: 'Austin Miles', initials: 'AM', upcomingUpdate: '24th Apr 2026', goal: 'Product Signals' },
  { id: 6, name: 'Budget vs. Actual Expenses', requestedBy: 'Austin Miles', initials: 'AM', upcomingUpdate: '21st Apr 2026', goal: 'Revenue' },
  { id: 7, name: 'Quarterly Sales Review', requestedBy: 'Jordyn Davidson', initials: 'JD', upcomingUpdate: '20th Apr 2026', goal: 'Sales' },
  { id: 8, name: 'Customer Satisfaction Survey Results', requestedBy: 'Jordyn Davidson', initials: 'JD', upcomingUpdate: '20th Apr 2026', goal: 'Marketing' },
  { id: 9, name: 'Financial Forecasting Report', requestedBy: 'Austin Miles', initials: 'AM', upcomingUpdate: '20th Apr 2026', goal: 'Revenue' },
  { id: 10, name: 'Marketing Campaign Analysis', requestedBy: 'Claire Logan', initials: 'CL', upcomingUpdate: '21st Apr 2026', goal: 'Marketing' },
  { id: 11, name: 'Customer Retention Metrics', requestedBy: 'Claire Logan', initials: 'CL', upcomingUpdate: '21st Apr 2026', goal: 'Sales' },
  { id: 12, name: 'Product Performance Review', requestedBy: 'Claire Logan', initials: 'CL', upcomingUpdate: '21st Apr 2026', goal: 'CRM' },
];

function ActionDropdown({ onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="report-list__dropdown" ref={ref}>
      <button className="report-list__dropdown-item" onClick={onClose}>
        <span className="report-list__dropdown-icon"><PencilSimple size={16} weight="regular" /></span>
        Rename
      </button>
      <button className="report-list__dropdown-item" onClick={onClose}>
        <span className="report-list__dropdown-icon"><DownloadSimple size={16} weight="regular" /></span>
        Export
      </button>
      <button className="report-list__dropdown-item report-list__dropdown-item--danger" onClick={onClose}>
        <span className="report-list__dropdown-icon"><TrashSimple size={16} weight="regular" /></span>
        Delete
      </button>
    </div>
  );
}

function ReportRow({ index, report }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="report-list__row">
      <span className="report-list__col-num">{index}.</span>
      <span className="report-list__col-name">
        <span className="report-list__name-text">{report.name}</span>
      </span>
      <span className="report-list__col-requested">
        <span className="report-list__avatar">{report.initials}</span>
        <span className="report-list__requested-name">{report.requestedBy}</span>
      </span>
      <span className="report-list__col-update">{report.upcomingUpdate}</span>
      <span className="report-list__col-goal">{report.goal}</span>
      <div className="report-list__dots-wrapper">
        <button
          className="report-list__dots-btn"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          aria-label="Actions"
        >
          <DotsThree size={20} weight="regular" />
        </button>
        {menuOpen && <ActionDropdown onClose={() => setMenuOpen(false)} />}
      </div>
    </div>
  );
}

export function ReportList({
  user = { name: 'Ammie Diego', initials: 'AD', email: 'ammie.diego@work.com' },
  onNavigate,
  menuOpen,
  onMenuToggle,
}) {
  const [search, setSearch] = useState('');

  const filtered = INITIAL_REPORTS.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
    || r.requestedBy.toLowerCase().includes(search.toLowerCase())
    || r.goal.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="report-list">
      <MenuBar
        items={NAV_ITEMS}
        activeId="reports"
        onItemClick={(id) => onNavigate && onNavigate(id)}
        user={user}
        onNewChat={() => onNavigate && onNavigate('new-chat')}
        isOpen={menuOpen}
        onToggle={onMenuToggle}
        onProfile={() => onNavigate && onNavigate('profile')}
        onSettings={() => onNavigate && onNavigate('settings')}
      />

      <div className="report-list__body">
        {/* Header */}
        <div className="report-list__header">
          <span className="report-list__breadcrumb">Reports</span>
        </div>

        {/* Content */}
        <div className="report-list__content">
          {/* Toolbar */}
          <div className="report-list__toolbar">
            <div className="report-list__toolbar-tab">
              All Reports
              <span className="report-list__toolbar-count">{filtered.length}</span>
            </div>
            <div className="report-list__toolbar-actions">
              <div className="report-list__search">
                <span className="report-list__search-icon">
                  <MagnifyingGlass size={16} weight="regular" color="var(--color-text-secondary)" />
                </span>
                <input
                  type="text"
                  className="report-list__search-input"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="report-list__table">
            <div className="report-list__table-header">
              <span className="report-list__col-num report-list__col-label">#</span>
              <span className="report-list__col-name report-list__col-label">Name</span>
              <span className="report-list__col-requested report-list__col-label">Requested By</span>
              <span className="report-list__col-update report-list__col-label">Upcoming Update</span>
              <span className="report-list__col-goal report-list__col-label">Goal</span>
              <span className="report-list__col-actions" />
            </div>
            <div className="report-list__rows">
              {filtered.map((report, i) => (
                <ReportRow key={report.id} index={i + 1} report={report} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
