import { useState } from 'react';
import { WorkbookHome } from './pages/workbook_home';
import { WorkbookList } from './pages/workbook_list';
import { WorkbookChat } from './pages/workbook_chat';
import { DashboardList } from './pages/dashboard_list';
import { DashboardView } from './pages/dashboard_view';
import { ProfilePage } from './pages/profile';
import { DataHub } from './pages/data_hub';
import { ProjectList } from './pages/projects';
import { SettingsPage } from './pages/settings';
import { ReportList } from './pages/reports';
import { SkillsPage } from './pages/skills';

const DEFAULT_USER = {
  name: 'Ammie Diego',
  initials: 'AD',
  email: 'ammie.diego@work.com',
};

export function App() {
  const [user] = useState(DEFAULT_USER);
  const [page, setPage] = useState('home');
  const [chatQuery, setChatQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDashboardId, setActiveDashboardId] = useState(null);

  function handleNavigate(id) {
    if (id === 'chats') {
      setPage('workbooks');
    } else if (id === 'dashboard') {
      setPage('dashboards');
    } else if (id === 'data-hub') {
      setPage('data-hub');
    } else if (id === 'project') {
      setPage('projects');
    } else if (id === 'reports') {
      setPage('reports');
    } else if (id === 'skills') {
      setPage('skills');
    } else if (id === 'new-chat') {
      setPage('home');
    } else if (id === 'profile') {
      setPage('profile');
    } else if (id === 'settings') {
      setPage('settings');
    }
  }

  function handleSearch(query) {
    setChatQuery(query);
    setPage('chat');
  }

  const menuProps = {
    user,
    onNavigate: handleNavigate,
    menuOpen,
    onMenuToggle: setMenuOpen,
  };

  if (page === 'profile') {
    return (
      <ProfilePage
        {...menuProps}
      />
    );
  }

  if (page === 'workbooks') {
    return (
      <WorkbookList
        {...menuProps}
        page={page}
        onNewWorkbook={() => setPage('home')}
        onSelectWorkbook={() => {
          setChatQuery('');
          setPage('chat');
        }}
      />
    );
  }

  if (page === 'chat') {
    return (
      <WorkbookChat
        {...menuProps}
        query={chatQuery}
        onStop={() => setPage('home')}
      />
    );
  }

  if (page === 'dashboards') {
    return (
      <DashboardList
        {...menuProps}
        onNewDashboard={() => setPage('dashboards')}
        onOpenDashboard={(id) => { setActiveDashboardId(id); setPage('dashboard-view'); }}
      />
    );
  }

  if (page === 'data-hub') {
    return (
      <DataHub
        {...menuProps}
      />
    );
  }

  if (page === 'projects') {
    return (
      <ProjectList
        {...menuProps}
      />
    );
  }

  if (page === 'reports') {
    return (
      <ReportList
        {...menuProps}
      />
    );
  }

  if (page === 'skills') {
    return (
      <SkillsPage
        {...menuProps}
      />
    );
  }

  if (page === 'settings') {
    return (
      <SettingsPage
        {...menuProps}
      />
    );
  }

  if (page === 'dashboard-view') {
    return (
      <DashboardView
        {...menuProps}
        dashboardId={activeDashboardId}
        onBack={() => setPage('dashboards')}
      />
    );
  }

  return (
    <WorkbookHome
      {...menuProps}
      page={page}
      onSubmit={handleSearch}
    />
  );
}
