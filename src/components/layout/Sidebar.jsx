import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Database, Users, Settings, Link,
  Briefcase, CalendarCheck, Sliders, Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const MAIN_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/publishers', icon: Database, label: 'Publisher Database' },
  { to: '/crm', icon: Users, label: 'Client Hunting CRM' },
  { to: '/worklog', icon: Briefcase, label: 'Work Log' },
  { to: '/planner', icon: CalendarCheck, label: 'Daily Planner' },
  { to: '/datacenter', icon: Layers, label: 'Data Center' },
];

const SETTINGS_NAV = [
  { to: '/config', icon: Sliders, label: 'Config Panel' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  const { stats } = useApp();
  const location = useLocation();

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const getBadge = (to) => {
    if (to === '/crm' && stats.followUpsDue > 0) return stats.followUpsDue;
    if (to === '/planner' && stats.incompleteTasks > 0) return stats.incompleteTasks;
    return null;
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Link size={16} />
          </div>
          <div>
            <div className="sidebar-logo-text">Link Mart</div>
            <div className="sidebar-logo-sub">SEO Agency Suite</div>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {MAIN_NAV.map(({ to, icon: Icon, label }) => {
            const badge = getBadge(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`nav-item ${isActive(to) ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon className="nav-icon" size={18} />
                {label}
                {badge && <span className="nav-badge">{badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Settings Nav */}
        <nav className="sidebar-nav" style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="sidebar-section-label">System</div>
          {SETTINGS_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={`nav-item ${isActive(to) ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon className="nav-icon" size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Link Mart v2.0</div>
            Publisher Database · CRM · Work Log · Planner
          </div>
        </div>
      </aside>
    </>
  );
}
