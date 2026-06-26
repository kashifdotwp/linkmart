import React from 'react';
import {
  Globe, Database, Users, Tag, Clock, TrendingUp,
  DollarSign, BarChart2, Zap, ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber, timeAgo } from '../utils/helpers';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ACTIVITY_ICONS = {
  publisher_added: { color: '#22C55E', label: 'Publisher Added' },
  publisher_updated: { color: '#3B82F6', label: 'Publisher Updated' },
  publisher_deleted: { color: '#EF4444', label: 'Publisher Deleted' },
  lead_added: { color: '#C9A24D', label: 'Lead Added' },
  lead_contacted: { color: '#8B5CF6', label: 'Lead Contacted' },
  lead_interested: { color: '#22C55E', label: 'Lead Interested' },
  lead_deleted: { color: '#EF4444', label: 'Lead Removed' },
  followup_scheduled: { color: '#F59E0B', label: 'Follow-up Scheduled' },
};

export default function Dashboard() {
  const { stats, publishers, leads, activity } = useApp();

  // ── Chart data ──

  // Publishers by country
  const countryCounts = publishers.reduce((acc, p) => {
    acc[p.country || 'Other'] = (acc[p.country || 'Other'] || 0) + 1;
    return acc;
  }, {});
  const countryLabels = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a]).slice(0, 8);
  const countryData = countryLabels.map(c => countryCounts[c]);

  // Lead status doughnut
  const statusCounts = leads.reduce((acc, l) => {
    acc[l.status || 'New'] = (acc[l.status || 'New'] || 0) + 1;
    return acc;
  }, {});
  const statusLabels = Object.keys(statusCounts);
  const statusColors = {
    New: '#3B82F6', Contacted: '#8B5CF6', 'Follow-up': '#F59E0B',
    Interested: '#22C55E', Abandoned: '#9CA3AF',
  };

  // Publishers added over time (last 7 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const dayLabels = days.map(d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  const pubsByDay = days.map(d => {
    const dayStr = d.toDateString();
    return publishers.filter(p => p.lastUpdated && new Date(p.lastUpdated).toDateString() === dayStr).length;
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9AA5B1', font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9AA5B1', font: { size: 10 } }, beginAtZero: true },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, font: { size: 11 }, color: '#52606D', padding: 10 },
      },
    },
    cutout: '68%',
  };

  const cards = [
    { label: 'Total Publishers', value: stats.totalPublishers, icon: Database, color: '#0F2A44', bg: '#e8f0f8', accent: '#0F2A44' },
    { label: 'Client Leads', value: stats.totalLeads, icon: Users, color: '#8B5CF6', bg: '#F5F3FF', accent: '#8B5CF6' },
    { label: 'Countries', value: stats.totalCountries, icon: Globe, color: '#3B82F6', bg: '#EFF6FF', accent: '#3B82F6' },
    { label: 'Niches', value: stats.totalNiches, icon: Tag, color: '#C9A24D', bg: '#fdf6e7', accent: '#C9A24D' },
    { label: 'Follow-ups Due', value: stats.followUpsDue, icon: Clock, color: '#EF4444', bg: '#FEF2F2', accent: '#EF4444' },
    { label: 'Interested Leads', value: stats.interestedLeads, icon: TrendingUp, color: '#22C55E', bg: '#F0FDF4', accent: '#22C55E' },
    { label: 'Total Seller Cost', value: formatCurrency(stats.totalSellerCost), icon: DollarSign, color: '#F59E0B', bg: '#FFFBEB', accent: '#F59E0B', isStr: true },
    { label: 'Est. Client Revenue', value: formatCurrency(stats.estimatedRevenue), icon: BarChart2, color: '#3B82F6', bg: '#EFF6FF', accent: '#3B82F6', isStr: true },
    { label: 'Est. Profit', value: formatCurrency(stats.estimatedProfit), icon: Zap, color: '#22C55E', bg: '#F0FDF4', accent: '#22C55E', isStr: true },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your publisher database & CRM performance</p>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="dashboard-card" style={{ '--card-accent': card.accent, animationDelay: `${i * 40}ms` }}>
              <div className="card-icon-wrap" style={{ background: card.bg }}>
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <div className="card-label">{card.label}</div>
              <div className="card-value" style={{ fontSize: card.isStr ? '1.25rem' : '1.7rem' }}>
                {card.isStr ? card.value : formatNumber(card.value)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Publishers by Country */}
        <div className="chart-card">
          <div className="chart-title">Publishers by Country</div>
          <div className="chart-wrap">
            <Bar
              data={{
                labels: countryLabels,
                datasets: [{
                  data: countryData,
                  backgroundColor: '#0F2A44',
                  borderRadius: 6,
                  hoverBackgroundColor: '#C9A24D',
                }],
              }}
              options={chartOptions}
            />
          </div>
        </div>

        {/* Lead Status */}
        <div className="chart-card">
          <div className="chart-title">Leads by Status</div>
          <div className="chart-wrap" style={{ height: 220 }}>
            {leads.length > 0 ? (
              <Doughnut
                data={{
                  labels: statusLabels,
                  datasets: [{
                    data: statusLabels.map(s => statusCounts[s]),
                    backgroundColor: statusLabels.map(s => statusColors[s] || '#9CA3AF'),
                    borderWidth: 2,
                    borderColor: 'var(--color-bg-card)',
                  }],
                }}
                options={doughnutOptions}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No lead data yet
              </div>
            )}
          </div>
        </div>

        {/* Publishers over time */}
        <div className="chart-card">
          <div className="chart-title">Publishers (Last 7 Days)</div>
          <div className="chart-wrap">
            <Line
              data={{
                labels: dayLabels,
                datasets: [{
                  data: pubsByDay,
                  borderColor: '#C9A24D',
                  backgroundColor: 'rgba(201,162,77,0.08)',
                  borderWidth: 2.5,
                  pointBackgroundColor: '#C9A24D',
                  pointRadius: 4,
                  tension: 0.4,
                  fill: true,
                }],
              }}
              options={{
                ...chartOptions,
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#9AA5B1', font: { size: 9 }, maxRotation: 30 } },
                  y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9AA5B1', font: { size: 10 }, stepSize: 1 }, beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom: Activity + Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Activity Feed */}
        <div className="activity-feed">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Activity</h3>
            <span className="text-muted text-xs">{activity.length} events</span>
          </div>
          {activity.slice(0, 10).map((item, i) => {
            const meta = ACTIVITY_ICONS[item.type] || { color: '#9AA5B1', label: item.type };
            return (
              <div key={item.id} className="activity-item" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="activity-dot" style={{ background: meta.color }} />
                <div style={{ flex: 1 }}>
                  <div className="activity-text">{item.message}</div>
                  <div className="activity-time">{timeAgo(item.timestamp)}</div>
                </div>
              </div>
            );
          })}
          {activity.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              No activity yet. Start adding publishers and leads!
            </div>
          )}
        </div>

        {/* Quick Stats Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="chart-card">
            <div className="chart-title">Publisher Health</div>
            {[
              { label: 'Active', count: publishers.filter(p => p.status === 'Active').length, color: '#22C55E' },
              { label: 'Verified', count: publishers.filter(p => p.status === 'Verified').length, color: '#3B82F6' },
              { label: 'Inactive', count: publishers.filter(p => p.status === 'Inactive').length, color: '#9CA3AF' },
              { label: 'Blacklisted', count: publishers.filter(p => p.status === 'Blacklisted').length, color: '#EF4444' },
              { label: 'Expensive', count: publishers.filter(p => p.status === 'Expensive').length, color: '#F59E0B' },
              { label: 'No Response', count: publishers.filter(p => p.status === 'No Response').length, color: '#C2410C' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{s.count}</span>
              </div>
            ))}
          </div>

          <div className="chart-card">
            <div className="chart-title">CRM Pipeline</div>
            {[
              { label: 'New', count: leads.filter(l => l.status === 'New').length, color: '#3B82F6' },
              { label: 'Contacted', count: leads.filter(l => l.status === 'Contacted').length, color: '#8B5CF6' },
              { label: 'Follow-up', count: leads.filter(l => l.status === 'Follow-up').length, color: '#F59E0B' },
              { label: 'Interested', count: leads.filter(l => l.status === 'Interested').length, color: '#22C55E' },
              { label: 'Abandoned', count: leads.filter(l => l.status === 'Abandoned').length, color: '#9CA3AF' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
