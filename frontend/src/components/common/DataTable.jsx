import React from 'react';
import { FiChevronLeft, FiChevronRight, FiSearch, FiInbox, FiArrowUp, FiArrowDown } from 'react-icons/fi';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  pagination = null, // { page, limit, pages, total }
  onPageChange = () => {},
  onSort = () => {},
  sortBy = '',
  sortOrder = 'desc',
  searchValue = '',
  onSearchChange = () => {},
  searchPlaceholder = 'Search records...',
  emptyMessage = 'No records found',
  emptySubtext = 'Start by adding a new record.'
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* Header controls: Search */}
      {onSearchChange && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-slate-400"
            />
          </div>
          {pagination && (
            <div className="text-xs text-text-sub text-right w-full sm:w-auto font-medium">
              Showing {data.length} of {pagination.total || data.length} records
            </div>
          )}
        </div>
      )}

      {/* Mobile Card View (< sm screens) */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 bg-indigo-50 rounded-full text-primary">
                <FiInbox className="w-8 h-8" />
              </div>
              <p className="font-semibold text-text-main text-base mt-1">{emptyMessage}</p>
              <p className="text-xs text-text-sub max-w-sm">{emptySubtext}</p>
            </div>
          </div>
        ) : (
          data.map((row, rIdx) => (
            <div key={row._id || rIdx} className="p-4 space-y-2 hover:bg-slate-50/80 transition-colors">
              {columns.map((col, cIdx) => (
                <div key={cIdx} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-sub uppercase tracking-wider">{col.label}:</span>
                  <span className="font-medium text-text-main text-right">
                    {col.render ? col.render(row, rIdx) : row[col.key]}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Desktop & Tablet Table Area (>= sm screens) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-surface-header text-xs font-semibold uppercase tracking-wider text-text-sub border-b border-slate-200/80">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  onClick={() => col.sortable && onSort(col.key)}
                  className={`px-4 py-3.5 ${col.sortable ? 'cursor-pointer hover:text-primary transition-colors select-none' : ''} ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable && sortBy === col.key && (
                      sortOrder === 'asc' ? <FiArrowUp className="w-3.5 h-3.5 text-primary" /> : <FiArrowDown className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-indigo-50 rounded-full text-primary">
                      <FiInbox className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-text-main text-base mt-1">{emptyMessage}</p>
                    <p className="text-xs text-text-sub max-w-sm">{emptySubtext}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row._id || rIdx}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-4 py-3.5 text-text-main ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <div className="text-xs text-text-sub font-medium">
            Page {pagination.page} of {pagination.pages}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous Page"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next Page"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
