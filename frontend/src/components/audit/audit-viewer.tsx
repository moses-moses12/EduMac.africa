'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService, AuditLogItem } from '@/services/audit.service';
import { DataTable, ColumnDef, TableFilter } from '@/components/ui/data-table';
import { Drawer } from '@/components/ui/drawer';
import {
  ShieldCheck,
  Eye,
  KeyRound,
  FileCheck2,
  Share2,
  CreditCard,
  Edit,
  Trash2,
  PlusCircle,
  LogIn,
  LogOut,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

export function AuditViewer() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', search, actionFilter, page, pageSize, sortColumn, sortDirection],
    queryFn: () =>
      auditService.getAuditLogs({
        search: search || undefined,
        action: actionFilter || undefined,
        page,
        page_size: pageSize,
        ordering: sortDirection === 'desc' ? `-${sortColumn}` : sortColumn,
      }),
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <LogIn className="h-3 w-3" /> LOGIN
          </span>
        );
      case 'LOGOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <LogOut className="h-3 w-3" /> LOGOUT
          </span>
        );
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <PlusCircle className="h-3 w-3" /> CREATE
          </span>
        );
      case 'UPDATE':
      case 'RESULT_UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Edit className="h-3 w-3" /> {action}
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Trash2 className="h-3 w-3" /> DELETE
          </span>
        );
      case 'APPROVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileCheck2 className="h-3 w-3" /> APPROVE
          </span>
        );
      case 'PUBLISH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Share2 className="h-3 w-3" /> PUBLISH
          </span>
        );
      case 'PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CreditCard className="h-3 w-3" /> PAYMENT
          </span>
        );
      case 'ROLE_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <UserCheck className="h-3 w-3" /> ROLE_CHANGE
          </span>
        );
      case 'PASSWORD_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <KeyRound className="h-3 w-3" /> PASSWORD_CHANGE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">
            {action}
          </span>
        );
    }
  };

  const columns: ColumnDef<AuditLogItem>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      cell: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      id: 'user',
      header: 'Initiated By',
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-200">
            {row.user?.first_name ? `${row.user.first_name} ${row.user.last_name}` : row.user?.email || 'System'}
          </p>
          <p className="text-[11px] text-slate-500">{row.user?.email || 'automated-task'}</p>
        </div>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      sortable: true,
      cell: (row) => getActionBadge(row.action),
    },
    {
      id: 'object_type',
      header: 'Target Object',
      cell: (row: any) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-800/80 font-mono text-[11px] text-slate-300">
          {row.object_type || row.model_name || 'System'}
        </span>
      ),
    },
    {
      id: 'object_id',
      header: 'Object ID',
      cell: (row) => (
        <span className="font-mono text-[11px] text-slate-400 truncate max-w-[120px] inline-block">
          {row.object_id || '—'}
        </span>
      ),
    },
    {
      id: 'ip_address',
      header: 'Client IP',
      cell: (row) => (
        <span className="font-mono text-[11px] text-slate-500">
          {row.ip_address || '127.0.0.1'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Audit Trail',
      cell: (row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] font-medium cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5 text-indigo-400" />
          Inspect
        </button>
      ),
    },
  ];

  const filters: TableFilter[] = [
    {
      id: 'action',
      label: 'Action Type',
      value: actionFilter,
      onChange: (val) => {
        setActionFilter(val);
        setPage(1);
      },
      options: [
        { label: 'LOGIN', value: 'LOGIN' },
        { label: 'LOGOUT', value: 'LOGOUT' },
        { label: 'CREATE', value: 'CREATE' },
        { label: 'UPDATE', value: 'UPDATE' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'APPROVE', value: 'APPROVE' },
        { label: 'PUBLISH', value: 'PUBLISH' },
        { label: 'PAYMENT', value: 'PAYMENT' },
        { label: 'RESULT_UPDATE', value: 'RESULT_UPDATE' },
        { label: 'ROLE_CHANGE', value: 'ROLE_CHANGE' },
        { label: 'PASSWORD_CHANGE', value: 'PASSWORD_CHANGE' },
      ],
    },
  ];

  const logs = data?.results || [];

  return (
    <div className="space-y-4">
      <DataTable<AuditLogItem>
        title="Institutional Audit Log & Compliance Ledger"
        subtitle="Immutable chronological ledger of administrative security, role adjustments, and academic operations."
        data={logs}
        columns={columns}
        rowKey={(row) => row.id}
        searchPlaceholder="Search by user email, object ID, or IP..."
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
        filters={filters}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={(colId) => {
          if (sortColumn === colId) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortColumn(colId);
            setSortDirection('desc');
          }
        }}
        currentPage={page}
        pageSize={pageSize}
        totalCount={data?.count}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        isLoading={isLoading}
        error={isError ? 'Could not load audit ledger from server.' : null}
        onRetry={() => refetch()}
        headerAction={
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer border border-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
            Refresh Log
          </button>
        }
      />

      {/* Metadata Inspection Drawer */}
      <Drawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Specification"
        description="Detailed system snapshot and payload changes captured during execution."
        width="lg"
      >
        {selectedLog && (
          <div className="space-y-5 text-xs text-slate-300">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Event ID</p>
                <p className="font-mono text-slate-200 mt-0.5 truncate">{selectedLog.id}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Action</p>
                <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Initiator</p>
                <p className="text-slate-200 mt-0.5">{selectedLog.user?.email || 'System'}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Client IP</p>
                <p className="font-mono text-slate-200 mt-0.5">{selectedLog.ip_address || '127.0.0.1'}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Target Resource</p>
                <p className="font-mono text-indigo-400 mt-0.5">
                  {(selectedLog as any).object_type || (selectedLog as any).model_name || 'System'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Object ID</p>
                <p className="font-mono text-slate-200 mt-0.5">{selectedLog.object_id || '—'}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200">Execution Metadata & Changes (JSON)</span>
                <span className="text-[11px] text-slate-500 font-mono">Immutable</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                {JSON.stringify(
                  (selectedLog as any).metadata || (selectedLog as any).changes_json || {},
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                This record is protected by institutional integrity controls. Audit logs cannot be modified or deleted by standard staff, teachers, or students.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
