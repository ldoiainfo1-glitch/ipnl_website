import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { AuditEvent } from '@/types';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

// ─── Action metadata ──────────────────────────────────────────────────────────

const ACTION_META: Record<
  string,
  { label: string; icon: React.ElementType; colorClass: string }
> = {
  KYC_APPROVED: { label: 'KYC Approved', icon: CheckCircle, colorClass: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  KYC_REJECTED: { label: 'KYC Rejected', icon: XCircle, colorClass: 'text-red-500 bg-red-50 border-red-200' },
  KYC_UNDER_REVIEW: { label: 'KYC Under Review', icon: Clock, colorClass: 'text-amber-500 bg-amber-50 border-amber-200' },
  KYC_SUBMITTED: { label: 'KYC Submitted', icon: ShieldCheck, colorClass: 'text-blue-500 bg-blue-50 border-blue-200' },
  MANDATE_APPROVED: { label: 'Mandate Approved', icon: CheckCircle, colorClass: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  MANDATE_REJECTED: { label: 'Mandate Rejected', icon: XCircle, colorClass: 'text-red-500 bg-red-50 border-red-200' },
  MANDATE_UNDER_REVIEW: { label: 'Mandate Under Review', icon: Clock, colorClass: 'text-amber-500 bg-amber-50 border-amber-200' },
  MANDATE_DELETED: { label: 'Mandate Deleted', icon: Trash2, colorClass: 'text-red-700 bg-red-100 border-red-300' },
  USER_SUSPENDED: { label: 'User Suspended', icon: UserX, colorClass: 'text-red-500 bg-red-50 border-red-200' },
  USER_ACTIVATED: { label: 'User Activated', icon: UserCheck, colorClass: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  USER_DELETED: { label: 'User Deleted', icon: Trash2, colorClass: 'text-red-700 bg-red-100 border-red-300' },
  TIER_CHANGED: { label: 'Tier Changed', icon: RefreshCw, colorClass: 'text-purple-500 bg-purple-50 border-purple-200' },
};

function getActionMeta(action: string) {
  return ACTION_META[action] ?? { label: action, icon: AlertTriangle, colorClass: 'text-gray-500 bg-gray-50 border-gray-200' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatAbsolute(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getTargetDescription(event: AuditEvent) {
  const company = event.targetCompanyName || event.targetUser?.companyName;
  const email = event.targetEmail || event.targetUser?.email;
  const mandate = event.targetMandateTitle;

  if (event.action.startsWith('KYC_')) {
    return company ? `For ${company}${email ? ` (${email})` : ''}` : `For KYC record ${event.entityId.slice(0, 8)}...`;
  }

  if (event.action.startsWith('MANDATE_')) {
    if (mandate && company) return `${mandate} by ${company}`;
    if (mandate) return mandate;
    if (company) return `Mandate owner: ${company}`;
    return `Mandate ${event.entityId.slice(0, 8)}...`;
  }

  if (event.action.startsWith('USER_') || event.action === 'TIER_CHANGED') {
    return company ? `${company}${email ? ` (${email})` : ''}` : `User ${event.entityId.slice(0, 8)}...`;
  }

  return company ?? `${event.entityType} ${event.entityId.slice(0, 8)}...`;
}

function getTargetPath(event: AuditEvent) {
  if (event.action.startsWith('KYC_') || event.action.startsWith('USER_') || event.action === 'TIER_CHANGED') {
    return event.targetUser?.id ? `/members/${event.targetUser.id}` : null;
  }

  if (event.action.startsWith('MANDATE_') && event.action !== 'MANDATE_DELETED') {
    return `/mandates/${event.entityId}`;
  }

  return event.targetUser?.id ? `/members/${event.targetUser.id}` : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function AdminAuditHistory() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs = [], isLoading, isError, refetch } = useQuery<AuditEvent[]>({
    queryKey: ['admin-audit-logs', page],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs(page, PAGE_SIZE);
      return res.data;
    },
    staleTime: 30_000,
  });

  // Map raw DB rows → typed shape (DB uses snake_case, type uses camelCase)
  const normalised = logs.map((row: any) => ({
    id: row.id,
    adminId: row.admin_id ?? row.adminId,
    admin: row.admin,
    targetUser: row.targetUser,
    targetCompanyName: row.targetCompanyName,
    targetEmail: row.targetEmail,
    targetMandateTitle: row.targetMandateTitle,
    action: row.action,
    entityType: row.entity_type ?? row.entityType,
    entityId: row.entity_id ?? row.entityId,
    note: row.note,
    createdAt: row.created_at ?? row.createdAt,
  }));

  const entityTypes = Array.from(new Set(normalised.map((e) => e.entityType)));
  const actionTypes = Array.from(new Set(normalised.map((e) => e.action)));

  const filtered = normalised.filter((e) => {
    if (entityFilter !== 'all' && e.entityType !== entityFilter) return false;
    if (actionFilter !== 'all' && e.action !== actionFilter) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Every admin action is recorded here for compliance and traceability.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-border hover:bg-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Entity</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"
          >
            <option value="all">All types</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-sm border border-border rounded-md px-2 py-1.5 bg-background"
          >
            <option value="all">All actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>{getActionMeta(a).label}</option>
            ))}
          </select>
        </div>
        {(entityFilter !== 'all' || actionFilter !== 'all') && (
          <button
            onClick={() => { setEntityFilter('all'); setActionFilter('all'); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center py-16 gap-3 text-destructive">
          <AlertTriangle className="w-8 h-8" />
          <p className="text-sm font-medium">Failed to load audit logs</p>
          <button onClick={() => refetch()} className="text-xs underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
          <ShieldCheck className="w-10 h-10 opacity-40" />
          <p className="text-sm">No audit events match the selected filters.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />

          <ol className="space-y-0">
            {filtered.map((event, idx) => {
              const meta = getActionMeta(event.action);
              const Icon = meta.icon;
              const targetPath = getTargetPath(event);
              return (
                <li key={event.id} className={`relative flex gap-4 pb-0 ${idx < filtered.length - 1 ? 'mb-5' : ''}`}>
                  {/* Icon dot on timeline */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center ${meta.colorClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-card border border-border rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                        {targetPath ? (
                          <button
                            type="button"
                            onClick={() => navigate(targetPath)}
                            className="text-xs text-muted-foreground text-left hover:text-primary hover:underline"
                          >
                            {getTargetDescription(event)}
                          </button>
                        ) : (
                          <p className="text-xs text-muted-foreground">{getTargetDescription(event)}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {event.entityType.replace(/_/g, ' ')} · {event.entityId.slice(0, 8)}...
                        </p>
                        {event.note && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            &ldquo;{event.note}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className="text-xs font-medium text-muted-foreground"
                          title={formatAbsolute(event.createdAt as unknown as string)}
                        >
                          {formatRelativeTime(event.createdAt as unknown as string)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          by {event.admin?.companyName || (event.adminId as string).slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && (
        <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
          <p>Page {page} · showing {filtered.length} of {logs.length} events</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < PAGE_SIZE}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
