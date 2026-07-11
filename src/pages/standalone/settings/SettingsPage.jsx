import { useState } from 'react';
import { MenuBar } from '@/ui/components/MenuBar';
import { IntegrationCard } from '@/ui/components/IntegrationCard/IntegrationCard';
import { INTEGRATION_LOGOS } from '@/ui/assets/integrations';
import './SettingsPage.css';

const NAV_ITEMS = [
  { id: 'chats', label: 'Workbook', icon: 'chats' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'data-hub', label: 'Data Hub', icon: 'data-hub' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'project', label: 'Projects', icon: 'project' },
];

const INTEGRATIONS = [
  { id: 'google-sheets', name: 'Google Sheets', description: 'Use Google sheets to export data.', status: 'connected' },
  { id: 'snowflake', name: 'Snowflake', description: 'Connect to Snowflake, choose the database, and extract clean, normalised data from the pipeline.', status: 'not-connected' },
  { id: 'singlestore', name: 'Singlestore', description: 'Connect to SingleStore, choose the database, and extract clean and normalised data from the pipeline.', status: 'not-connected' },
  { id: 'postgres', name: 'Postgres', description: 'Connect to PostgreSQL, choose the database, and extract clean and normalised data from the pipeline.', status: 'not-connected' },
  { id: 'salesforce', name: 'Salesforce', description: 'Use Salesforce to get filtered data on Petavue.', status: 'connected' },
  { id: 'gong', name: 'Gong', description: 'Analyze sales calls effectively with Gong, extracting insights to refine strategies.', status: 'not-connected' },
  { id: 'marketo', name: 'Marketo', description: 'Efficiently manage leads with Marketo integration, streamlining marketing efforts seamlessly.', status: 'not-connected' },
  { id: 'jira', name: 'Jira', description: 'Track project progress and performance metrics efficiently with Jira Integration.', status: 'not-connected' },
  { id: 'freshdesk', name: 'Freshdesk', description: 'Enhance customer service efficiency and satisfaction with data-driven decisions with Freshdesk.', status: 'not-connected' },
  { id: 'aircall', name: 'Aircall', description: 'Analyze calls effectively with Aircall, extracting insights to refine communication strategies.', status: 'not-connected' },
  { id: 'hubspot', name: 'HubSpot', description: 'Connect your HubSpot to organise, track and nurture your leads.', status: 'connected' },
  { id: 'slack', name: 'Slack', description: 'Connect Slack to configure scheduled insights directly to a Slack user or channel at your organisation.', status: 'not-connected' },
  { id: 'gainsight', name: 'Gainsight', description: 'Elevate customer engagement using Gainsight, enhancing user interactions in your pipeline.', status: 'coming-soon' },
  { id: 'bullhorn', name: 'Bullhorn', description: 'Streamline recruitment processes by leveraging Bullhorn to access, manage, and analyze candidate data, improving hiring outcomes and efficiency.', status: 'coming-soon' },
  { id: 'bigquery', name: 'BigQuery', description: 'Query large datasets effortlessly with BigQuery, empowering data-driven decisions.', status: 'coming-soon' },
  { id: 'redshift', name: 'Redshift', description: 'Unlock high-performance data warehousing with Redshift integration.', status: 'coming-soon' },
  { id: 'elastic', name: 'Elastic', description: 'Enable real-time search and analysis with Elastic integration.', status: 'coming-soon' },
  { id: 'mailchimp', name: 'Mailchimp', description: 'Nurture and grow your audience with Mailchimp, streamlining email marketing operations.', status: 'coming-soon' },
  { id: 'iceberg', name: 'Iceberg', description: 'Connect to Iceberg, choose the database, and extract clean and normalised data from the pipeline.', status: 'connected' },
];

export function SettingsPage({
  user = { name: 'Ammie Diego', initials: 'AD', email: 'ammie.diego@work.com' },
  onNavigate,
  menuOpen,
  onMenuToggle,
}) {
  const [activeTab, setActiveTab] = useState('integrations');

  return (
    <div className="settings-page">
      <MenuBar
        items={NAV_ITEMS}
        activeId="settings"
        onItemClick={(id) => onNavigate && onNavigate(id)}
        user={user}
        onNewChat={() => onNavigate && onNavigate('new-chat')}
        isOpen={menuOpen}
        onToggle={onMenuToggle}
        onProfile={() => onNavigate && onNavigate('profile')}
        onSettings={() => {}}
      />

      <div className="settings-page__body">
        <div className="settings-page__header">
          <span className="settings-page__breadcrumb">Settings</span>
        </div>

        <div className="settings-page__tabs-bar">
          <div className="settings-page__tabs">
            <button
              type="button"
              className={`settings-page__tab ${activeTab === 'integrations' ? 'settings-page__tab--active' : ''}`}
              onClick={() => setActiveTab('integrations')}
              role="tab"
              aria-selected={activeTab === 'integrations'}
            >
              Integrations
            </button>
            <button
              type="button"
              className={`settings-page__tab ${activeTab === 'users' ? 'settings-page__tab--active' : ''}`}
              onClick={() => setActiveTab('users')}
              role="tab"
              aria-selected={activeTab === 'users'}
            >
              User Management
            </button>
          </div>
        </div>

        <div className="settings-page__content">
          {activeTab === 'integrations' && (
            <div className="settings-page__integrations">
              <div className="settings-page__grid">
                {INTEGRATIONS.map((item) => (
                  <IntegrationCard
                    key={item.id}
                    name={item.name}
                    description={item.description}
                    logoSrc={INTEGRATION_LOGOS[item.id]}
                    status={item.status}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="settings-page__empty">
              <p className="settings-page__empty-text">User management coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
