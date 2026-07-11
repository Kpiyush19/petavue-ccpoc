import { useState, useRef, useEffect } from 'react';
import { MenuBar } from '@/ui/components/MenuBar';
import { Button } from '@/ui/components/Button/Button';
import {
  MagnifyingGlass,
  Plus,
  DotsThree,
  PencilSimple,
  TrashSimple,
  LockKey,
  Buildings,
} from '@phosphor-icons/react';
import './DashboardList.css';

const DASHBOARDS = [
  { id: 1, name: 'Account Health Score', visibility: 'private', owner: 'Me', ownerInitials: 'DM', date: '10th Jan 2026' },
  { id: 2, name: 'Sales Cycle Efficiency', visibility: 'shared', owner: 'Me', ownerInitials: 'DM', date: '9th Jan 2026' },
  { id: 3, name: 'Marketing Returns', visibility: 'private', owner: 'Me', ownerInitials: 'DM', date: '3rd Jan 2026' },
  { id: 4, name: 'Profitability Analysis', visibility: 'shared', owner: 'Me', ownerInitials: 'DM', date: '31th Dec 2025' },
  { id: 5, name: 'Customer Acquisition Metrics', visibility: 'private', owner: 'Me', ownerInitials: 'DM', date: '28th Dec 2025' },
  { id: 6, name: 'Cost-Benefit Analysis', visibility: 'private', owner: 'Me', ownerInitials: 'DM', date: '16th Dec 2025' },
];

const NAV_ITEMS = [
  { id: 'chats', label: 'Workbook', icon: 'chats' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'data-hub', label: 'Data Hub', icon: 'data-hub' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'project', label: 'Projects', icon: 'project' },
];

function ActionDropdown({ onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="dashboard-list__dropdown" ref={ref}>
      <button className="dashboard-list__dropdown-item" onClick={onClose}>
        <span className="dashboard-list__dropdown-icon">
          <PencilSimple size={16} weight="regular" />
        </span>
        Edit
      </button>
      <button className="dashboard-list__dropdown-item dashboard-list__dropdown-item--danger" onClick={onClose}>
        <span className="dashboard-list__dropdown-icon">
          <TrashSimple size={16} weight="regular" />
        </span>
        Delete
      </button>
    </div>
  );
}

function DashboardRow({ index, dashboard, onOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="dashboard-list__row" onClick={() => onOpen && onOpen(dashboard.id)}>
      <span className="dashboard-list__row-num">{index}.</span>
      <span className="dashboard-list__row-name dashboard-list__row-name--clickable">{dashboard.name}</span>
      <span className="dashboard-list__col-visibility">
        <span className="dashboard-list__visibility">
          {dashboard.visibility === 'private' ? (
            <LockKey size={12} weight="regular" color="var(--color-text-secondary)" />
          ) : (
            <Buildings size={12} weight="regular" color="var(--color-text-secondary)" />
          )}
          <span className="dashboard-list__visibility-label">
            {dashboard.visibility === 'private' ? 'Private' : 'Shared'}
          </span>
        </span>
      </span>
      <span className="dashboard-list__col-owner">
        <span className="dashboard-list__owner">
          <span className="dashboard-list__owner-avatar">{dashboard.ownerInitials}</span>
          <span className="dashboard-list__owner-name">{dashboard.owner}</span>
        </span>
      </span>
      <span className="dashboard-list__row-date">{dashboard.date}</span>
      <div className="dashboard-list__dots-wrapper">
        <button
          className="dashboard-list__dots-btn"
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

export function DashboardList({
  user = { name: 'Ammie Diego', initials: 'AD', email: 'ammie.diego@work.com' },
  onNavigate,
  onNewDashboard,
  onOpenDashboard,
  menuOpen,
  onMenuToggle,
}) {
  const [search, setSearch] = useState('');

  const filtered = DASHBOARDS.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-list">
      <MenuBar
        items={NAV_ITEMS}
        activeId="dashboards-pv"
        onItemClick={(id) => onNavigate && onNavigate(id)}
        user={user}
        onNewChat={() => onNavigate && onNavigate('new-chat')}
        isOpen={menuOpen}
        onToggle={onMenuToggle}
        onProfile={() => onNavigate && onNavigate('profile')}
        onSettings={() => onNavigate && onNavigate('settings')}
      />

      <div className="dashboard-list__body">
        {/* Page header */}
        <div className="dashboard-list__header">
          <span className="dashboard-list__breadcrumb">Dashboards</span>
        </div>

        {/* List container */}
        <div className="dashboard-list__container">
          {/* Toolbar */}
          <div className="dashboard-list__toolbar">
            <div className="dashboard-list__tabs">
              <div className="dashboard-list__tab">
                All Dashboards
                <span className="dashboard-list__tab-count">{filtered.length}</span>
              </div>
            </div>
            <div className="dashboard-list__actions">
              <div className="dashboard-list__search">
                <span className="dashboard-list__search-icon">
                  <MagnifyingGlass size={16} weight="regular" color="var(--color-text-secondary)" />
                </span>
                <input
                  type="text"
                  className="dashboard-list__search-input"
                  placeholder="Search Dashboard"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                label="Create New"
                onClick={onNewDashboard}
              />
            </div>
          </div>

          {/* Table */}
          <div className="dashboard-list__table">
            <div className="dashboard-list__table-header">
              <span className="dashboard-list__col-num dashboard-list__col-label">#</span>
              <span className="dashboard-list__col-name dashboard-list__col-label">Name</span>
              <span className="dashboard-list__col-visibility dashboard-list__col-label">Visibility</span>
              <span className="dashboard-list__col-owner dashboard-list__col-label">Owner</span>
              <span className="dashboard-list__col-date dashboard-list__col-label">Last Modified</span>
              <span className="dashboard-list__col-actions" />
            </div>
            <div className="dashboard-list__rows">
              {filtered.map((d, i) => (
                <DashboardRow
                  key={d.id}
                  index={i + 1}
                  dashboard={d}
                  onOpen={onOpenDashboard}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
