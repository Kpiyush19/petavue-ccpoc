import { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  Plus,
  Lightning,
  Buildings,
  TrendUp,
  ChartLineUp,
  UsersThree,
  Megaphone,
  Heart,
  Sparkle,
  DotsThree,
  PencilSimple,
  Copy,
  TrashSimple,
} from '@phosphor-icons/react';
import { MenuBar } from '../../components/MenuBar';
import { Button } from '../../components/Button/Button';
import { TextInput } from '../../components/TextInput/TextInput';
import { Tag } from '../../components/Tags/Tag/Tag';
import './SkillsPage.css';

const NAV_ITEMS = [
  { id: 'chats', label: 'Workbook', icon: 'chats' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'data-hub', label: 'Data Hub', icon: 'data-hub' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'project', label: 'Projects', icon: 'project' },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkle },
  { id: 'abm', label: 'ABM & Accounts', icon: Buildings },
  { id: 'pipeline', label: 'Pipeline & Deals', icon: TrendUp },
  { id: 'performance', label: 'Performance', icon: ChartLineUp },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'customer', label: 'Customer Success', icon: Heart },
  { id: 'people', label: 'Buying Committee', icon: UsersThree },
];

const SCOPE_COLORS = {
  Tenant: 'blue',
  Global: 'purple',
  Workspace: 'sea-green',
};

const SKILLS = [
  {
    id: 'abm-account-penetration',
    name: 'abm-account-penetration',
    category: 'abm',
    scope: 'Tenant',
    description:
      'Analyzes how deep coverage goes into named accounts across contacts, roles, and functions to answer: are we penetrating target accounts or stuck on one contact? Surfaces role gaps, function coverage, and account-level penetration score.',
  },
  {
    id: 'account-engagement-ranking',
    name: 'account-engagement-ranking',
    category: 'abm',
    scope: 'Tenant',
    description:
      "Analyzes every account on engagement intensity, recency, and buying-intent signals to produce a ranked list of who's hottest right now. Built for the 'who should I call today' question, with engagement trend and account-level signal breakdown.",
  },
  {
    id: 'ae-performance-benchmark',
    name: 'ae-performance-benchmark',
    category: 'performance',
    scope: 'Tenant',
    description:
      "Analyzes every AE against peer median on quota attainment, win rate, pipeline health, and activity mix — to answer who's on track, who needs coaching, and whose activity volume isn't converting. Includes peer-ratio tiles so 1:1s have numbers instead of vibes.",
  },
  {
    id: 'buyer-journey-conversion',
    name: 'buyer-journey-conversion',
    category: 'pipeline',
    scope: 'Tenant',
    description:
      'Analyzes conversion rates, velocity, and drop-off across every stage of the buyer journey to answer: where are leads falling out, which stage needs the most work, and is funnel velocity improving or decaying?',
  },
  {
    id: 'buying-committee-coverage',
    name: 'buying-committee-coverage',
    category: 'people',
    scope: 'Tenant',
    description:
      "Analyzes contact coverage across Decision Makers, Champions, and Influencers at target accounts to answer: are we single-threaded, and where are the gaps? Surfaces cold DMs, missing roles, and multi-thread depth trend so deals don't stall because the wrong person left.",
  },
  {
    id: 'campaign-lift',
    name: 'campaign-lift',
    category: 'marketing',
    scope: 'Tenant',
    description:
      'Analyzes whether a campaign, sequence, or creative actually moved a metric above baseline — not just got clicks. Compares test vs. prior-period baseline or matched control, with statistical significance shown as plain-English confidence badges.',
  },
  {
    id: 'closed-won-retrospective',
    name: 'closed-won-retrospective',
    category: 'pipeline',
    scope: 'Tenant',
    description:
      'Analyzes closed-won deals end-to-end — time-in-stage, first-touch channel, meeting cadence, influencing content — to answer: what does a winning deal actually look like, so we can repeat it? Built for QBR retros and replicable play development.',
  },
  {
    id: 'churn-risk-radar',
    name: 'churn-risk-radar',
    category: 'customer',
    scope: 'Tenant',
    description:
      'Scores every active customer on churn likelihood using usage decay, support-ticket sentiment, executive turnover, and renewal-window proximity. Outputs a triage queue with the top 3 risk drivers per account so CSMs intervene early instead of saving the save.',
  },
  {
    id: 'pipeline-coverage',
    name: 'pipeline-coverage',
    category: 'pipeline',
    scope: 'Global',
    description:
      "Calculates pipeline-to-quota coverage by segment, AE, and stage to answer: do we have enough pipeline to hit the number, and where is it weakest? Flags unhealthy ratios and surfaces which segments need pipeline-gen pushes this week.",
  },
  {
    id: 'lead-source-roi',
    name: 'lead-source-roi',
    category: 'marketing',
    scope: 'Tenant',
    description:
      'Compares cost-per-lead, cost-per-opp, and cost-per-closed-won across every channel and source so marketing can answer: where should the next dollar go? Includes payback period and blended ROI by segment.',
  },
  {
    id: 'sales-cycle-velocity',
    name: 'sales-cycle-velocity',
    category: 'performance',
    scope: 'Tenant',
    description:
      'Tracks median deal cycle length by stage and segment, identifies the slowest transitions, and surfaces what high-velocity deals do differently. Built to answer: where is time leaking from the cycle, and which deals are aging out?',
  },
  {
    id: 'expansion-opportunity-finder',
    name: 'expansion-opportunity-finder',
    category: 'customer',
    scope: 'Workspace',
    description:
      'Scans the install base for upsell and cross-sell signals — feature usage thresholds, seat saturation, adjacent-team activity — and ranks expansion-ready accounts by deal-size potential and timing.',
  },
];

function SkillCard({ skill, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleMenuClick(e) {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  }

  function handleAction(action, e) {
    e.stopPropagation();
    setMenuOpen(false);
    onAction && onAction(action, skill);
  }

  return (
    <article className="skills__card" tabIndex={0}>
      <div className="skills__card-header">
        <div className="skills__card-icon" aria-hidden="true">
          <Lightning size={18} weight="fill" />
        </div>
        <div className="skills__card-title-block">
          <h3 className="skills__card-name">{skill.name}</h3>
          <div className="skills__card-meta">
            <Tag color={SCOPE_COLORS[skill.scope] || 'blue'} size="sm" prefixIcon={Buildings}>
              {skill.scope}
            </Tag>
            <span className="skills__card-category">
              {CATEGORIES.find((c) => c.id === skill.category)?.label || 'General'}
            </span>
          </div>
        </div>
        <div className="skills__card-actions">
          <button
            type="button"
            className="skills__icon-btn"
            onClick={handleMenuClick}
            aria-label={`Actions for ${skill.name}`}
          >
            <DotsThree size={18} weight="bold" />
          </button>
          {menuOpen && (
            <>
              <div
                className="skills__menu-backdrop"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
              />
              <div className="skills__menu" role="menu">
                <button type="button" className="skills__menu-item" onClick={(e) => handleAction('edit', e)}>
                  <PencilSimple size={16} weight="regular" />
                  <span>Edit</span>
                </button>
                <button type="button" className="skills__menu-item" onClick={(e) => handleAction('duplicate', e)}>
                  <Copy size={16} weight="regular" />
                  <span>Duplicate</span>
                </button>
                <div className="skills__menu-divider" />
                <button
                  type="button"
                  className="skills__menu-item skills__menu-item--danger"
                  onClick={(e) => handleAction('delete', e)}
                >
                  <TrashSimple size={16} weight="regular" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <p className="skills__card-description">{skill.description}</p>
    </article>
  );
}

export function SkillsPage({
  user = { name: 'Ammie Diego', initials: 'AD', email: 'ammie.diego@work.com' },
  onNavigate,
  menuOpen,
  onMenuToggle,
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredSkills = useMemo(() => {
    const query = search.trim().toLowerCase();
    return SKILLS.filter((s) => {
      const matchesCategory = activeCategory === 'all' || s.category === activeCategory;
      const matchesQuery =
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [search, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts = { all: SKILLS.length };
    for (const c of CATEGORIES) {
      if (c.id === 'all') continue;
      counts[c.id] = SKILLS.filter((s) => s.category === c.id).length;
    }
    return counts;
  }, []);

  return (
    <div className="skills">
      <MenuBar
        items={NAV_ITEMS}
        activeId="skills"
        onItemClick={(id) => onNavigate && onNavigate(id)}
        user={user}
        onNewChat={() => onNavigate && onNavigate('new-chat')}
        isOpen={menuOpen}
        onToggle={onMenuToggle}
        onProfile={() => onNavigate && onNavigate('profile')}
        onSettings={() => onNavigate && onNavigate('settings')}
      />

      <div className="skills__body">
        <header className="skills__topbar">
          <span className="skills__breadcrumb">Skills</span>
        </header>

        <div className="skills__scroll">
          <div className="skills__container">
            <section className="skills__hero">
              <div className="skills__hero-text">
                <div className="skills__hero-title-row">
                  <span className="skills__hero-icon" aria-hidden="true">
                    <Lightning size={22} weight="fill" />
                  </span>
                  <h1 className="skills__hero-title">Skills</h1>
                </div>
                <p className="skills__hero-subtitle">
                  Manage the agent skills and key definitions that power your workspace.
                </p>
              </div>
              <div className="skills__hero-actions">
                <div className="skills__search">
                  <span className="skills__search-icon" aria-hidden="true">
                    <MagnifyingGlass size={16} weight="regular" />
                  </span>
                  <TextInput
                    label=""
                    placeholder="Search skills…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="skills__search-input"
                  />
                </div>
                <Button
                  variant="primary"
                  size="md"
                  icon={Plus}
                  label="New Skill"
                  onClick={() => {}}
                />
              </div>
            </section>

            <div className="skills__filters" role="tablist" aria-label="Filter by category">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`skills__filter ${isActive ? 'skills__filter--active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <Icon size={14} weight={isActive ? 'fill' : 'regular'} />
                    <span>{cat.label}</span>
                    <span className="skills__filter-count">{categoryCounts[cat.id] || 0}</span>
                  </button>
                );
              })}
            </div>

            <div className="skills__results-meta">
              <span>
                Showing <strong>{filteredSkills.length}</strong> of {SKILLS.length} skills
              </span>
            </div>

            {filteredSkills.length > 0 ? (
              <div className="skills__grid">
                {filteredSkills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            ) : (
              <div className="skills__empty">
                <span className="skills__empty-icon" aria-hidden="true">
                  <Lightning size={28} weight="regular" />
                </span>
                <h3 className="skills__empty-title">No skills found</h3>
                <p className="skills__empty-subtitle">
                  Try a different category or clear your search to see all skills.
                </p>
                <Button
                  variant="ghost"
                  size="md"
                  label="Clear filters"
                  onClick={() => {
                    setSearch('');
                    setActiveCategory('all');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
