import React from 'react';

// Publisher status → badge class map
const PUBLISHER_STATUS_MAP = {
  'Active': 'badge-active',
  'Verified': 'badge-verified',
  'Inactive': 'badge-inactive',
  'Blacklisted': 'badge-blacklisted',
  'Expensive': 'badge-expensive',
  'No Response': 'badge-no-response',
};

// Lead status → badge class map
const LEAD_STATUS_MAP = {
  'New': 'badge-new',
  'Contacted': 'badge-contacted',
  'Follow-up': 'badge-follow-up',
  'Interested': 'badge-interested',
  'Abandoned': 'badge-abandoned',
};

const ALL_STATUS_MAP = { ...PUBLISHER_STATUS_MAP, ...LEAD_STATUS_MAP };

export default function StatusBadge({ status }) {
  if (!status) return <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>;
  const cls = ALL_STATUS_MAP[status] || 'badge-inactive';
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}
