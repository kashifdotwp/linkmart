import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Publishers from './pages/Publishers';
import CRM from './pages/CRM';
import WorkLog from './pages/WorkLog';
import DailyPlanner from './pages/DailyPlanner';
import ConfigPanel from './pages/ConfigPanel';
import Settings from './pages/Settings';
import DataCenter from './pages/DataCenter';

import './index.css';
import './styles/layout.css';
import './styles/table.css';
import './styles/components.css';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes — wrapped in auth guard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="publishers" element={<Publishers />} />
              <Route path="crm" element={<CRM />} />
              <Route path="worklog" element={<WorkLog />} />
              <Route path="planner" element={<DailyPlanner />} />
              <Route path="datacenter" element={<DataCenter />} />
              <Route path="config" element={<ConfigPanel />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
