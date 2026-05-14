import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Settings, Sun, Moon, Zap, ChevronDown, Monitor, LayoutGrid } from 'lucide-react';

const ProfileMenu = ({ isLightTheme, setIsLightTheme, highGraphics, setHighGraphics, onOpenPrefs }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <button 
        className={`profile-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="avatar-circle">
          {user?.username?.charAt(0).toUpperCase() || <User size={18} />}
        </div>
        <span className="username-text">{user?.username}</span>
        <ChevronDown size={16} className={`chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="profile-dropdown glass-panel">
          <div className="dropdown-header">
            <p className="user-email">{user?.email}</p>
            <div className="user-status">
              <span className="status-dot"></span> Online
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-section">
            <p className="section-label">Appearance & Performance</p>
            <button className="menu-item" onClick={() => setIsLightTheme(!isLightTheme)}>
              {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
              <span>{isLightTheme ? 'Switch to Dark' : 'Switch to Light'}</span>
            </button>
            <button className="menu-item" onClick={() => setHighGraphics(!highGraphics)}>
              <Monitor size={18} />
              <div className="item-content">
                <span>Graphics Mode</span>
                <small>{highGraphics ? 'High Fidelity' : 'Power Saving'}</small>
              </div>
              <div className={`status-badge ${highGraphics ? 'blue' : 'gray'}`}>
                {highGraphics ? '✨' : '🔋'}
              </div>
            </button>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-section">
            <p className="section-label">Account</p>
            <button className="menu-item" onClick={() => { onOpenPrefs(); setIsOpen(false); }}>
              <Settings size={18} />
              <span>Preferences & Permissions</span>
            </button>
            <button className="menu-item logout-item" onClick={logout}>
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .profile-menu-container {
          position: relative;
          z-index: 1001;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.4rem;
          padding-right: 1rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 99px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .profile-trigger:hover, .profile-trigger.active {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--accent-blue);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .avatar-circle {
          width: 32px;
          height: 32px;
          background: var(--accent-blue);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .username-text {
          font-weight: 600;
          font-size: 0.9rem;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chevron {
          transition: transform 0.3s;
          color: var(--text-secondary);
        }

        .chevron.rotate {
          transform: rotate(180deg);
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 0.75rem);
          right: 0;
          width: 280px;
          padding: 1rem 0;
          border-radius: 20px;
          animation: dropdownIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dropdown-header {
          padding: 0 1.25rem 0.75rem;
        }

        .user-email {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .user-status {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: #4ade80;
          font-weight: 600;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 8px #4ade80;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--glass-border);
          margin: 0.5rem 0;
        }

        .dropdown-section {
          padding: 0.5rem 0;
        }

        .section-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-secondary);
          padding: 0.5rem 1.25rem;
          letter-spacing: 0.05em;
        }

        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1.25rem;
          border: none;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .menu-item span {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .item-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .item-content small {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .status-badge {
          font-size: 0.8rem;
          padding: 2px 6px;
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
        }

        .logout-item {
          color: #f87171;
        }

        .logout-item:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Responsive ProfileMenu */
        @media (max-width: 600px) {
          .username-text {
            display: none;
          }

          .profile-trigger {
            padding-right: 0.4rem;
          }

          .chevron {
            display: none;
          }

          .profile-dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 20px 20px 0 0;
            max-height: 80vh;
            overflow-y: auto;
            animation: dropdownSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes dropdownSlideUp {
            from { opacity: 0; transform: translateY(100%); }
            to { opacity: 1; transform: translateY(0); }
          }
        }

        @media (min-width: 601px) and (max-width: 768px) {
          .username-text {
            max-width: 80px;
          }

          .profile-dropdown {
            width: 260px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileMenu;
