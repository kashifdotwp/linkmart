import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, Menu, ChevronDown, User, LogOut, Settings, HelpCircle, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuToggle }) {
  const { theme, toggleTheme, globalSearch, setGlobalSearch } = useApp();
  const { currentUser, logout, isAdmin } = useAuth();
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setUserOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  // Build display info from auth user
  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User';
  const displayRole = isAdmin ? 'Admin' : (currentUser?.user_metadata?.role || 'Member');
  const initials = currentUser?.initials ||
    (currentUser?.email ? currentUser.email[0].toUpperCase() : 'U');

  return (
    <header className="header">
      {/* Mobile menu toggle */}
      <button className="header-icon-btn" onClick={onMenuToggle} style={{ display: 'none' }}
        id="mobile-menu-btn">
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="header-search">
        <Search className="header-search-icon" size={16} />
        <input
          id="global-search"
          type="text"
          className="header-search-input"
          placeholder="Search publishers, leads, domains..."
          value={globalSearch}
          onChange={e => setGlobalSearch(e.target.value)}
        />
      </div>

      <div className="header-actions">
        {/* Theme toggle */}
        <button
          id="theme-toggle"
          className="header-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* User avatar dropdown */}
        <div className="dropdown-wrapper" ref={userRef}>
          <button
            id="user-menu-btn"
            className="user-avatar-btn"
            onClick={() => setUserOpen(o => !o)}
          >
            <div className="user-avatar" style={{
              background: isAdmin
                ? 'linear-gradient(135deg, #C9A24D, #e8c56d)'
                : 'linear-gradient(135deg, #0F2A44, #1e4a70)',
            }}>
              {initials}
            </div>
            <div>
              <div className="user-name">{displayName}</div>
              <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {isAdmin && <Shield size={10} style={{ color: '#C9A24D' }} />}
                {displayRole}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)', marginLeft: 4 }} />
          </button>

          {userOpen && (
            <div className="dropdown-menu">
              {/* User info header */}
              <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{displayName}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {currentUser?.email}
                </div>
                {isAdmin && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: '0.66rem', fontWeight: 700, color: '#C9A24D',
                    background: 'rgba(201,162,77,0.1)', padding: '2px 6px',
                    borderRadius: 6, marginTop: 6, letterSpacing: '0.04em',
                  }}>
                    <Shield size={9} /> ADMIN
                  </span>
                )}
              </div>

              <div className="dropdown-item" onClick={() => { navigate('/settings'); setUserOpen(false); }}>
                <Settings size={15} /> Settings
              </div>
              {isAdmin && (
                <div className="dropdown-item" onClick={() => { navigate('/settings'); setUserOpen(false); }}>
                  <Shield size={15} /> Team Management
                </div>
              )}
              <div className="dropdown-item">
                <HelpCircle size={15} /> Help &amp; Docs
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item danger" onClick={handleLogout} id="logout-btn">
                <LogOut size={15} /> Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
