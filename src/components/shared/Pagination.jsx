/**
 * Pagination — Reusable pagination component with rows-per-page selector
 * Used by PublisherTable, LeadTable, and DataCenter sheet viewer.
 */
import React from 'react';
import { getStorage, setStorage } from '../../utils/helpers';

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

export default function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  filteredFrom,
  entityName = 'items',
  pageSizeKey = 'lm_page_size',
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  showAllOption = true,
}) {
  const effectivePageSize = pageSize === 'all' ? total : pageSize;
  const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
  const from = total === 0 ? 0 : Math.min((page - 1) * effectivePageSize + 1, total);
  const to = Math.min(page * effectivePageSize, total);

  const handlePageSizeChange = (val) => {
    const newSize = val === 'all' ? 'all' : Number(val);
    onPageSizeChange(newSize);
    setStorage(pageSizeKey, newSize);
    onPageChange(1);
  };

  // Generate page buttons — show up to 7 buttons with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (page <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="table-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="table-count">
          Showing {from}–{to} of {total} {entityName}
          {filteredFrom && filteredFrom !== total && ` (filtered from ${filteredFrom})`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Rows:</span>
          <select
            className="page-size-select"
            value={pageSize}
            onChange={e => handlePageSizeChange(e.target.value)}
            id="pagination-page-size"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
            {showAllOption && <option value="all">All</option>}
          </select>
        </div>
      </div>

      {pageSize !== 'all' && totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1} onClick={() => onPageChange(1)} title="First page">«</button>
          <button className="page-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)} title="Previous page">‹</button>
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>…</span>
            ) : (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
            )
          )}
          <button className="page-btn" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} title="Next page">›</button>
          <button className="page-btn" disabled={page === totalPages} onClick={() => onPageChange(totalPages)} title="Last page">»</button>
        </div>
      )}
    </div>
  );
}

/**
 * Helper: Load persisted page size from localStorage
 */
export function loadPageSize(key = 'lm_page_size', fallback = 25) {
  const stored = getStorage(key, fallback);
  return stored === 'all' ? 'all' : Number(stored) || fallback;
}
