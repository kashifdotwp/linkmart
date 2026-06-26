import React, { useState, useMemo } from 'react';
import {
  CalendarCheck, Plus, Check, Trash2, ChevronLeft, ChevronRight,
  Target, MessageSquare, ListChecks, StickyNote, Flag, TrendingUp, BarChart2, Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/helpers';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const PRIORITIES = [
  { value: 'high', label: 'High', color: '#DC2626', bg: '#FEE2E2' },
  { value: 'normal', label: 'Normal', color: '#2563EB', bg: '#DBEAFE' },
  { value: 'low', label: 'Low', color: '#6B7280', bg: '#F3F4F6' },
];

function formatDayStr(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DailyPlanner() {
  const { getPlannerDay, savePlannerDay, deletePlannerDay, plannerDays, leads, toast } = useApp();
  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'performance'
  const [currentDate, setCurrentDate] = useState(todayStr());
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('normal');
  const [newTaskLeadId, setNewTaskLeadId] = useState('');

  const day = getPlannerDay(currentDate);
  const isToday = currentDate === todayStr();

  const saveDay = (updates) => savePlannerDay(currentDate, { ...day, ...updates });

  // Goals
  const setGoal = (field, val) => saveDay({ goals: { ...day.goals, [field]: Number(val) || 0 } });
  const setActual = (field, val) => saveDay({ actual: { ...day.actual, [field]: Number(val) || 0 } });

  // Tasks
  const addTask = () => {
    if (!newTaskText.trim()) return;
    const task = { id: generateId(), text: newTaskText.trim(), done: false, priority: newTaskPriority, linkedLeadId: newTaskLeadId };
    saveDay({ tasks: [...day.tasks, task] });
    setNewTaskText('');
    setNewTaskLeadId('');
  };
  const toggleTask = (id) => saveDay({ tasks: day.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) });
  const deleteTask = (id) => saveDay({ tasks: day.tasks.filter(t => t.id !== id) });

  // Progress helpers
  const pct = (val, goal) => goal > 0 ? Math.min(100, Math.round((val / goal) * 100)) : 0;
  const outreachPct = pct(day.actual.outreach, day.goals.outreach);
  const responsesPct = pct(day.actual.responses, day.goals.responses);
  const tasksDone = day.tasks.filter(t => t.done).length;
  const tasksPct = day.tasks.length > 0 ? Math.round((tasksDone / day.tasks.length) * 100) : 0;

  // Quick-navigate dates
  const quickDates = [-2, -1, 0, 1].map(n => addDays(todayStr(), n));

  // ─── Performance Data Preparation ───
  const daysArray = useMemo(() => {
    return Object.keys(plannerDays)
      .map(dateKey => plannerDays[dateKey])
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Chronological sort (oldest first)
  }, [plannerDays]);

  const tableDays = useMemo(() => {
    return [...daysArray].reverse(); // Newest first for the table
  }, [daysArray]);

  const calculateSuccessRate = (d) => {
    const outreachRate = d.goals.outreach > 0 ? Math.min(1, d.actual.outreach / d.goals.outreach) : 1;
    const responsesRate = d.goals.responses > 0 ? Math.min(1, d.actual.responses / d.goals.responses) : 1;
    const tasksRate = d.tasks.length > 0 ? (d.tasks.filter(t => t.done).length / d.tasks.length) : 1;

    const avg = (outreachRate + responsesRate + tasksRate) / 3;
    return Math.round(avg * 100);
  };

  const handleQuickEdit = (dateStr) => {
    setCurrentDate(dateStr);
    setActiveTab('planner');
  };

  const handleDeleteDay = (dateStr) => {
    if (confirm(`Delete planner logs for ${dateStr}?`)) {
      deletePlannerDay(dateStr);
      toast('success', 'Log Deleted', `Planner log for ${dateStr} deleted.`);
    }
  };

  // ─── Chart Setup ───
  const chartDays = useMemo(() => daysArray.slice(-7), [daysArray]); // Last 7 days
  const chartLabels = chartDays.map(d => {
    const parsed = new Date(d.date + 'T12:00:00');
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const trendsChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Outreach Target',
        data: chartDays.map(d => d.goals.outreach),
        borderColor: '#93C5FD',
        borderDash: [4, 4],
        borderWidth: 1.5,
        fill: false,
        tension: 0.2
      },
      {
        label: 'Outreach Actual',
        data: chartDays.map(d => d.actual.outreach),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 2,
        fill: true,
        tension: 0.2
      },
      {
        label: 'Responses Actual',
        data: chartDays.map(d => d.actual.responses),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.04)',
        borderWidth: 2,
        fill: true,
        tension: 0.2
      }
    ]
  };

  const milestonesChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Milestones Completed %',
        data: chartDays.map(d => {
          const total = d.tasks.length;
          const completed = d.tasks.filter(t => t.done).length;
          return total > 0 ? Math.round((completed / total) * 100) : 100;
        }),
        backgroundColor: '#A855F7',
        borderRadius: 4,
        barThickness: 16
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9AA5B1', font: { size: 9 } } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9AA5B1', font: { size: 9 } }, beginAtZero: true },
    },
  };

  return (
    <div>
      {/* Title */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={17} style={{ color: '#B45309' }} />
            </span>
            Daily Planner
          </h1>
          <p className="page-subtitle">Track your daily outreach targets, milestones, and compile performance trend analysis</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="country-tabs" style={{ marginBottom: 20 }}>
        <button
          className={`country-tab ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => setActiveTab('planner')}
          id="planner-tab-details"
        >
          Daily Planner Details
        </button>
        <button
          className={`country-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
          id="planner-tab-performance"
        >
          <TrendingUp size={13} style={{ marginRight: 4 }} /> All Daily Milestones & Performance
        </button>
      </div>

      {/* ─── TAB 1: PLANNER DETAILS ─── */}
      {activeTab === 'planner' && (
        <>
          {/* Date Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setCurrentDate(d => addDays(d, -1))} id="plan-prev">
              <ChevronLeft size={14} />
            </button>

            {quickDates.map(d => (
              <button key={d}
                className={`btn btn-sm ${currentDate === d ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCurrentDate(d)}
                id={`plan-date-${d}`}>
                {d === todayStr() ? '📅 Today' : d === addDays(todayStr(), -1) ? 'Yesterday' : d === addDays(todayStr(), 1) ? 'Tomorrow' : d}
              </button>
            ))}

            <button className="btn btn-outline btn-sm" onClick={() => setCurrentDate(d => addDays(d, 1))} id="plan-next">
              <ChevronRight size={14} />
            </button>

            {!isToday && (
              <button className="btn btn-accent btn-sm" onClick={() => setCurrentDate(todayStr())} id="plan-today">
                Jump to Today
              </button>
            )}

            <span style={{ marginLeft: 'auto', fontSize: '0.88rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {formatDayStr(currentDate)}
            </span>
          </div>

          {/* Progress Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
            {[
              { label: 'Outreach Target', val: day.actual.outreach, goal: day.goals.outreach, pct: outreachPct, color: '#3B82F6', icon: Target },
              { label: 'Responses Logged', val: day.actual.responses, goal: day.goals.responses, pct: responsesPct, color: '#22C55E', icon: MessageSquare },
              { label: 'Tasks Done', val: tasksDone, goal: day.tasks.length, pct: tasksPct, color: '#A855F7', icon: ListChecks },
            ].map(({ label, val, goal, pct, color, icon: Icon }) => (
              <div key={label} className="dashboard-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Icon size={16} style={{ color }} />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>
                    {val}/{goal}
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--color-bg-hover)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 5 }}>{pct}% complete</div>
              </div>
            ))}
          </div>

          {/* Details Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            {/* Left: Milestones (Tasks) Manager */}
            <div className="chart-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <ListChecks size={16} style={{ color: '#A855F7' }} />
                  Tasks & Milestones for {isToday ? 'Today' : currentDate}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{tasksDone}/{day.tasks.length} completed</span>
              </div>

              {/* Add Task Form */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <input className="form-input" style={{ flex: 1, minWidth: 200 }}
                  placeholder="Define task milestone (press Enter)..." value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()} id="plan-task-input" />
                <select className="form-select" style={{ width: 110 }} value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)} id="plan-task-priority">
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label} Priority</option>)}
                </select>
                <select className="form-select" style={{ width: 160 }} value={newTaskLeadId} onChange={e => setNewTaskLeadId(e.target.value)} id="plan-task-lead">
                  <option value="">Link CRM lead...</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.website}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" onClick={addTask} id="plan-add-task"><Plus size={14} /> Add</button>
              </div>

              {/* Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {day.tasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    No milestones defined yet. Input outreach goals or client tasks above.
                  </div>
                )}
                {day.tasks.map(task => {
                  const pri = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1];
                  const linkedLead = leads.find(l => l.id === task.linkedLeadId);
                  return (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                      borderRadius: 8, border: '1.5px solid var(--color-border)',
                      background: task.done ? 'var(--color-bg-hover)' : 'var(--color-bg-card)',
                      opacity: task.done ? 0.6 : 1, transition: 'all 0.15s',
                    }}>
                      <button onClick={() => toggleTask(task.id)} style={{
                        width: 22, height: 22, borderRadius: 6, border: `2px solid ${task.done ? '#22C55E' : 'var(--color-border-strong)'}`,
                        background: task.done ? '#22C55E' : 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                      }} id={`plan-task-check-${task.id}`}>
                        {task.done && <Check size={12} style={{ color: '#fff' }} />}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 500, textDecoration: task.done ? 'line-through' : 'none' }}>
                          {task.text}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: pri.bg, color: pri.color }}>
                            <Flag size={9} style={{ marginRight: 3 }} />{pri.label}
                          </span>
                          {linkedLead && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                              → {linkedLead.website}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }}
                        onClick={() => deleteTask(task.id)} id={`plan-task-del-${task.id}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Inputs for Daily targets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="chart-card">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Target size={16} style={{ color: '#3B82F6' }} /> Targets & Outcomes
                </div>
                {[
                  { label: 'Outreach target', goalKey: 'outreach', actualKey: 'outreach', color: '#3B82F6' },
                  { label: 'Expected responses', goalKey: 'responses', actualKey: 'responses', color: '#22C55E' },
                ].map(({ label, goalKey, actualKey, color }) => (
                  <div key={goalKey} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: 3 }}>TARGET</div>
                        <input type="number" className="form-input" style={{ padding: '5px 8px', fontSize: '0.85rem' }}
                          value={day.goals[goalKey]} onChange={e => setGoal(goalKey, e.target.value)}
                          id={`plan-goal-${goalKey}`} min={0} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginBottom: 3 }}>COMPLETED</div>
                        <input type="number" className="form-input" style={{ padding: '5px 8px', fontSize: '0.85rem', borderColor: color + '60' }}
                          value={day.actual[actualKey]} onChange={e => setActual(actualKey, e.target.value)}
                          id={`plan-actual-${actualKey}`} min={0} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="chart-card">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <StickyNote size={16} style={{ color: '#F59E0B' }} /> Notes & Strategies
                </div>
                <textarea
                  className="form-textarea"
                  style={{ width: '100%', minHeight: 130, resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Notes for today's outreach, strategies, and key customer replies..."
                  value={day.notes}
                  onChange={e => saveDay({ notes: e.target.value })}
                  id="plan-notes"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── TAB 2: MILESTONES & PERFORMANCE ─── */}
      {activeTab === 'performance' && (
        <div>
          {/* Milestones History Table */}
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
              Milestone Checklist Logs
            </h3>
            <div className="table-container">
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th style={{ width: 140 }}>Outreach Goals</th>
                    <th style={{ width: 140 }}>Responses Goals</th>
                    <th>Milestones Achieved (Completed Tasks)</th>
                    <th style={{ width: 100 }}>Overall Success</th>
                    <th style={{ width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableDays.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        No historical daily planner data found. Setup plans in the details tab.
                      </td>
                    </tr>
                  ) : (
                    tableDays.map(d => {
                      const completedTasks = d.tasks.filter(t => t.done);
                      const successRate = calculateSuccessRate(d);
                      return (
                        <tr key={d.date}>
                          <td style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                            {d.date === todayStr() ? '📅 Today' : d.date}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                              <span>{d.actual.outreach} / {d.goals.outreach}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                ({pct(d.actual.outreach, d.goals.outreach)}%)
                              </span>
                            </div>
                            <div style={{ height: 5, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden', marginTop: 4 }}>
                              <div style={{ height: '100%', width: `${pct(d.actual.outreach, d.goals.outreach)}%`, background: '#3B82F6' }} />
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                              <span>{d.actual.responses} / {d.goals.responses}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                ({pct(d.actual.responses, d.goals.responses)}%)
                              </span>
                            </div>
                            <div style={{ height: 5, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden', marginTop: 4 }}>
                              <div style={{ height: '100%', width: `${pct(d.actual.responses, d.goals.responses)}%`, background: '#22C55E' }} />
                            </div>
                          </td>
                          <td>
                            {completedTasks.length > 0 ? (
                              <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {completedTasks.map(t => (
                                  <li key={t.id} style={{ color: 'var(--color-text)' }}>
                                    {t.text}
                                  </li>
                                ))}
                              </ul>
                            ) : d.notes ? (
                              <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontStyle: 'italic', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {d.notes}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No logged actions</span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.74rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                              background: successRate >= 80 ? '#DCFCE7' : successRate >= 50 ? '#FEF3C7' : '#FEE2E2',
                              color: successRate >= 80 ? '#15803D' : successRate >= 50 ? '#B45309' : '#C2410C'
                            }}>
                              {successRate}%
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-outline btn-xs" onClick={() => handleQuickEdit(d.date)}>Edit</button>
                              <button className="btn btn-outline btn-xs" style={{ color: 'var(--color-danger-text)' }} onClick={() => handleDeleteDay(d.date)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Trend Charts */}
          {chartDays.length > 0 && (
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16 }}>
              {/* Outreach Line Trend */}
              <div className="chart-card" style={{ height: 320 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <TrendingUp size={14} style={{ color: '#3B82F6' }} /> Outreach & Responses Trend
                  </h4>
                  <div style={{ display: 'flex', gap: 8, fontSize: '0.68rem', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#3B82F6' }} /> Outreach</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} /> Responses</span>
                  </div>
                </div>
                <div style={{ position: 'relative', height: 260 }}>
                  <Line data={trendsChartData} options={chartOptions} />
                </div>
              </div>

              {/* Milestone Completion Bar */}
              <div className="chart-card" style={{ height: 320 }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BarChart2 size={14} style={{ color: '#A855F7' }} /> Daily Milestone Success Rate
                </h4>
                <div style={{ position: 'relative', height: 260 }}>
                  <Bar data={milestonesChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
