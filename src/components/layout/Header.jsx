import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, Menu, ChevronDown, User, LogOut, Settings, HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuToggle }) {
  const { theme, toggleTheme, globalSearch, setGlobalSearch } = useApp();
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
            <div className="user-avatar">AG</div>
            <div>
              <div className="user-name">Agency Admin</div>
              <div className="user-role">SEO Manager</div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--color-text-muted)', marginLeft: 4 }} />
          </button>

          {userOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item">
                <User size={15} />
                My Profile
              </div>
              <div className="dropdown-item" onClick={() => { navigate('/settings'); setUserOpen(false); }}>
                <Settings size={15} />
                Settings
              </div>
              <div className="dropdown-item">
                <HelpCircle size={15} />
                Help & Docs
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-item danger">
                <LogOut size={15} />
                Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
