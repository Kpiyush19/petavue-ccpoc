import { useState } from 'react';
import { MenuBar } from '../../components/MenuBar';
import { Button } from '../../components/Button/Button';
import { EyeSlash, Info } from '@phosphor-icons/react';
import './ProfilePage.css';

const NAV_ITEMS = [
  { id: 'chats', label: 'Workbook', icon: 'chats' },
  { id: 'reports', label: 'Reports', icon: 'reports' },
  { id: 'data-hub', label: 'Data Hub', icon: 'data-hub' },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'skills', label: 'Skills', icon: 'skills' },
  { id: 'project', label: 'Projects', icon: 'project' },
];

export function ProfilePage({
  user = { name: 'Ammie Diego', initials: 'AD', email: 'ammie.diego@work.com' },
  onNavigate,
  menuOpen,
  onMenuToggle,
}) {
  const [firstName, setFirstName] = useState(user.name);

  return (
    <div className="profile-page">
      <MenuBar
        items={NAV_ITEMS}
        activeId="settings"
        onItemClick={(id) => onNavigate && onNavigate(id)}
        user={user}
        onNewChat={() => onNavigate && onNavigate('new-chat')}
        isOpen={menuOpen}
        onToggle={onMenuToggle}
        onProfile={() => onNavigate && onNavigate('profile')}
        onSettings={() => onNavigate && onNavigate('settings')}
      />

      <div className="profile-page__content">
        {/* Header */}
        <div className="profile-page__header">
          <div className="profile-page__breadcrumb">
            <span className="profile-page__breadcrumb-text">My Profile</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="profile-page__tabs">
          <div className="profile-page__tabs-inner">
            <button className="profile-page__tab profile-page__tab--active" type="button">
              Details
            </button>
          </div>
        </div>

        {/* Form area */}
        <div className="profile-page__body">
          <div className="profile-page__card">
            {/* Profile Image */}
            <div className="profile-page__section">
              <label className="profile-page__field-label">Profile Image</label>
              <div className="profile-page__avatar">
                <span className="profile-page__avatar-text">{user.initials}</span>
              </div>
            </div>

            {/* First Name */}
            <div className="profile-page__field">
              <label className="profile-page__field-label">First Name</label>
              <input
                className="profile-page__input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            {/* Role — read-only */}
            <div className="profile-page__field">
              <label className="profile-page__field-label">Role</label>
              <div className="profile-page__input profile-page__input--readonly">
                <span className="profile-page__readonly-value">Admin</span>
              </div>
            </div>

            {/* Email — read-only, narrower */}
            <div className="profile-page__field profile-page__field--narrow">
              <label className="profile-page__field-label">Email</label>
              <div className="profile-page__input profile-page__input--readonly">
                <span className="profile-page__readonly-value">{user.email}</span>
              </div>
            </div>

            {/* Password — read-only with action */}
            <div className="profile-page__field-row">
              <div className="profile-page__field profile-page__field--narrow">
                <label className="profile-page__field-label">Password</label>
                <div className="profile-page__input profile-page__input--readonly profile-page__input--password">
                  <span className="profile-page__password-dots">
                    &#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;
                  </span>
                  <EyeSlash
                    size={20}
                    weight="regular"
                    color="var(--color-neutral-300)"
                    className="profile-page__eye-icon"
                  />
                </div>
              </div>
              <div className="profile-page__field-action">
                <Button
                  variant="secondary"
                  size="sm"
                  label="Reset Password"
                />
              </div>
            </div>

            {/* API Key — read-only with action */}
            <div className="profile-page__field-row">
              <div className="profile-page__field profile-page__field--narrow">
                <div className="profile-page__label-with-icon">
                  <label className="profile-page__field-label">API Key</label>
                  <Info
                    size={16}
                    weight="regular"
                    color="var(--color-neutral-500)"
                  />
                </div>
                <div className="profile-page__input profile-page__input--readonly">
                  <span className="profile-page__readonly-value">Generate an API Key</span>
                </div>
              </div>
              <div className="profile-page__field-action">
                <Button
                  variant="secondary"
                  size="sm"
                  label="Generate"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
