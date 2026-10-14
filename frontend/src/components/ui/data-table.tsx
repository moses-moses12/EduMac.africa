'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { TableSkeleton } from './skeleton';
import { EmptyState, ErrorState } from './states';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  hideable?: boolean;
  width?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface TableFilter {
  id: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (selectedRows: T[]) => void;
  variant?: 'primary' | 'danger' | 'secondary';
}

export interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string | number;

  // Search & Filter
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filters?: TableFilter[];

  // Sorting
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;

  // Pagination
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (newPage: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (newSize: number) => void;

  // Row selection & Bulk actions
  enableSelection?: boolean;
  bulkActions?: BulkAction<T>[];

  // States
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;

  // Extra Header Actions
  headerAction?: React.ReactNode;
}

export function DataTable<T>({
  title,
  subtitle,
  data,
  columns,
  rowKey,
  searchPlaceholder = 'Search records...',
  searchQuery,
  onSearchChange,
  filters = [],
  sortColumn,
  sortDirection,
  onSort,
  currentPage = 1,
  pageSize = 10,
  totalCount,
  onPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  enableSelection = false,
  bulkActions = [],
  isLoading = false,
  error = null,
  onRetry,
  headerAction,
}: DataTableProps<T>) {
  // Local column visibility state
  const [hiddenColumnIds, setHiddenColumnIds] = useState<Set<string>>(new Set());
  const [showColMenu, setShowColMenu] = useState(false);

  // Local selection state
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Visible columns
  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumnIds.has(col.id)),
    [columns, hiddenColumnIds]
  );

  const toggleColumnVisibility = (colId: string) => {
    setHiddenColumnIds((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  // Row selection helpers
  const allCurrentIds = useMemo(() => data.map(rowKey), [data, rowKey]);
  const isAllSelected =
    data.length > 0 && allCurrentIds.every((id) => selectedIds.has(id));
  const isSomeSelected =
    data.length > 0 &&
    allCurrentIds.some((id) => selectedIds.has(id)) &&
    !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelectRow = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRows = useMemo(
    () => data.filter((row) => selectedIds.has(rowKey(row))),
    [data, selectedIds, rowKey]
  );

  const totalPages = Math.ceil((totalCount ?? data.length) / pageSize);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* 1. Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {title && (
            <div>
              <h3 className="text-base font-semibold text-slate-100">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          )}
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>

        {/* Search, Filters, and Column Visibility Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery ?? ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Filters & Options */}
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <div key={filter.id} className="relative">
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="appearance-none bg-slate-950/60 border border-slate-800 text-slate-300 text-xs rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="">{filter.label} (All)</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            ))}

            {/* Column Visibility Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColMenu(!showColMenu)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs text-slate-300 transition cursor-pointer"
                title="Customize columns"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Columns</span>
              </button>

              {showColMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-lg p-2 z-30">
                  <p className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-1">
                    Toggle Columns
                  </p>
                  <div className="space-y-1 mt-1">
                    {columns
                      .filter((c) => c.hideable !== false)
                      .map((col) => {
                        const isVisible = !hiddenColumnIds.has(col.id);
                        return (
                          <label
                            key={col.id}
                            className="flex items-center gap-2 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isVisible}
                              onChange={() => toggleColumnVisibility(col.id)}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                            />
                            <span>{col.header}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {enableSelection && selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs">
            <span className="text-indigo-200 font-medium">
              {selectedIds.size} {selectedIds.size === 1 ? 'row' : 'rows'} selected
            </span>
            <div className="flex items-center gap-2">
              {bulkActions.map((action, i) => {
                const ActionIcon = action.icon;
                const isDanger = action.variant === 'danger';
                return (
                  <button
                    key={i}
                    onClick={() => action.onClick(selectedRows)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      isDanger
                        ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
                    {action.label}
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-400 hover:text-slate-200 px-2 py-1 text-xs transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Table Surface / States */}
      <div className="relative overflow-x-auto">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={pageSize > 5 ? 5 : pageSize} cols={visibleColumns.length + (enableSelection ? 1 : 0)} />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : data.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No records found"
              description="No results match your search query or selected filter criteria."
            />
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
                {enableSelection && (
                  <th className="p-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer"
                      title={isAllSelected ? 'Deselect all' : 'Select all'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-400" />
                      ) : isSomeSelected ? (
                        <MinusSquare className="h-4 w-4 text-indigo-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    style={col.width ? { width: col.width } : undefined}
                    className="p-3.5 select-none"
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => onSort?.(col.id)}
                        className="inline-flex items-center gap-1.5 hover:text-slate-200 transition font-semibold"
                      >
                        <span>{col.header}</span>
                        {sortColumn === col.id ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="h-3.5 w-3.5 text-indigo-400" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.map((row) => {
                const id = rowKey(row);
                const isSelected = selectedIds.has(id);

                return (
                  <tr
                    key={id}
                    className={`transition-colors duration-150 hover:bg-slate-800/30 ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    {enableSelection && (
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(id)}
                          className="text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-indigo-400" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td key={col.id} className="p-3.5 text-slate-200">
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String((row as any)[col.accessorKey] ?? '—')
                          : '—'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 3. Pagination Footer */}
      {!isLoading && !error && data.length > 0 && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-slate-500 ml-2">
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, totalCount ?? data.length)} of{' '}
              {totalCount ?? data.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 font-mono text-slate-300">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
