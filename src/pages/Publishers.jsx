import React from 'react';
import { Database } from 'lucide-react';
import PublisherTable from '../components/publishers/PublisherTable';

export default function Publishers() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={17} style={{ color: 'var(--color-primary)' }} />
            </span>
            Publisher Database
          </h1>
          <p className="page-subtitle">Manage all publisher websites, backlink sellers and outreach contacts</p>
        </div>
      </div>
      <PublisherTable />
    </div>
  );
}
