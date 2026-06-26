import React from 'react';
import { Users } from 'lucide-react';
import LeadTable from '../components/crm/LeadTable';

export default function CRM() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={17} style={{ color: '#7C3AED' }} />
            </span>
            Client Hunting CRM
          </h1>
          <p className="page-subtitle">Track client leads, outreach status, and follow-up schedules</p>
        </div>
      </div>
      <LeadTable />
    </div>
  );
}
