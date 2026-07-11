import { useState, useRef, useEffect } from 'react';
import { CaretUpDown, UserCircle, Gear, SignOut } from '@phosphor-icons/react';

/*
 * User profile row at the bottom of the sidebar
 *
 * Open:   avatar + name + caret in a row
 * Closed: just avatar circle, center-aligned
 *
 * Clicking opens a dropdown with email, Profile, Settings, Log out
 */

export function UserProfile({
  name = 'User',
  initials = 'U',
  email = '',
  isOpen = true,
  onProfile,
  onSettings,
  onLogout,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div className="user-profile-wrapper" ref={wrapperRef}>
      {dropdownOpen && (
        <div className="user-profile-dropdown">
          {email && (
            <div className="user-profile-dropdown__email">{email}</div>
          )}
          <button
            className="user-profile-dropdown__item"
            type="button"
            onClick={() => { setDropdownOpen(false); onProfile && onProfile(); }}
          >
            <span className="user-profile-dropdown__icon">
              <UserCircle size={20} weight="regular" />
            </span>
            Profile
          </button>
          <button
            className="user-profile-dropdown__item"
            type="button"
            onClick={() => { setDropdownOpen(false); onSettings && onSettings(); }}
          >
            <span className="user-profile-dropdown__icon">
              <Gear size={20} weight="regular" />
            </span>
            Settings
          </button>
          <div className="user-profile-dropdown__divider" />
          <button
            className="user-profile-dropdown__item"
            type="button"
            onClick={() => { setDropdownOpen(false); onLogout && onLogout(); }}
          >
            <span className="user-profile-dropdown__icon">
              <SignOut size={20} weight="regular" />
            </span>
            Log out
          </button>
        </div>
      )}

      <button
        className={`user-profile ${isOpen ? '' : 'user-profile--closed'} ${dropdownOpen ? 'user-profile--active' : ''}`}
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <span className="user-profile__avatar">{initials}</span>

        {isOpen && (
          <>
            <span className="user-profile__name">{name}</span>
            <span className="user-profile__caret">
              <CaretUpDown size={20} weight="regular" color="var(--color-text-secondary)" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}
