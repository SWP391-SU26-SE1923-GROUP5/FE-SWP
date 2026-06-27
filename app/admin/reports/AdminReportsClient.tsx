'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Flag,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Check,
  Trash2,
  Search,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
// import axios from 'axios';

/* ============================== TYPES ============================== */

type ReportStatus = 'Pending' | 'Reviewed' | 'Resolved' | 'Rejected';

interface ReportItem {
  id: string;
  documentId: string;
  documentName: string;
  reason: string;
  createdAt: string;
  status: ReportStatus;
}

/* ============================ CONSTANTS ============================ */

const STATUS_META: Record<ReportStatus, { label: string; badgeClass: string }> = {
  Pending: { label: 'Pending', badgeClass: 'admin-badge-warning' },
  Reviewed: { label: 'Reviewed', badgeClass: 'admin-badge-info' },
  Resolved: { label: 'Resolved', badgeClass: 'admin-badge-success' },
  Rejected: { label: 'Rejected', badgeClass: 'admin-badge-danger' },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'rpt_8f3a2b91e6',
    documentId: 'doc_2c91fea7',
    documentName: 'Advanced React Patterns.pdf',
    reason: 'Contains plagiarized content from external source',
    createdAt: '2026-06-27T09:14:00.000Z',
    status: 'Pending',
  },
  {
    id: 'rpt_77b1d40c5a',
    documentId: 'doc_8e22ab90',
    documentName: 'Marketing Strategy 2025.docx',
    reason: 'Misleading / scam information reported by multiple users',
    createdAt: '2026-06-26T15:42:00.000Z',
    status: 'Pending',
  },
  {
    id: 'rpt_4d92e8f106',
    documentId: 'doc_1a55f2c3',
    documentName: 'Calculus Cheat Sheet.png',
    reason: 'Inappropriate image content',
    createdAt: '2026-06-25T11:05:00.000Z',
    status: 'Reviewed',
  },
  {
    id: 'rpt_19c2a3e07b',
    documentId: 'doc_56ad1133',
    documentName: 'Company Confidential Roadmap.pdf',
    reason: 'Leaks sensitive internal data without authorization',
    createdAt: '2026-06-24T08:21:00.000Z',
    status: 'Resolved',
  },
  {
    id: 'rpt_5b08e7d441',
    documentId: 'doc_9021cf4e',
    documentName: 'Quick-Cash Blueprint.pdf',
    reason: 'Spam / phishing document',
    createdAt: '2026-06-23T17:36:00.000Z',
    status: 'Rejected',
  },
  {
    id: 'rpt_e2c1f90aa8',
    documentId: 'doc_33bb09d1',
    documentName: 'History Research Notes.docx',
    reason: 'Hate speech / discriminatory language',
    createdAt: '2026-06-22T13:09:00.000Z',
    status: 'Pending',
  },
  {
    id: 'rpt_61d5a73bf2',
    documentId: 'doc_7f4e21c0',
    documentName: 'AI Generated Essay.pdf',
    reason: 'Suspected AI-generated content submitted as original work',
    createdAt: '2026-06-21T20:55:00.000Z',
    status: 'Reviewed',
  },
  {
    id: 'rpt_3aa40b8c91',
    documentId: 'doc_aa01f429',
    documentName: 'Broken Access Demo.mp4',
    reason: 'Demonstrates illegal hacking techniques',
    createdAt: '2026-06-20T07:18:00.000Z',
    status: 'Resolved',
  },
];

/* =========================== UTILITIES ============================ */

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* =========================== COMPONENT ============================ */

export default function AdminReportsClient() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  /* ---------------------- FETCH REPORTS ---------------------- */
  useEffect(() => {
    const controller = new AbortController();

    const loadReports = async () => {
      setIsLoading(true);
      try {
        // -----------------------------------------------------------------
        // BACKEND NOT READY YET — Commented out to avoid browser hang.
        // Uncomment these axios calls once the Report API endpoint is live.
        // -----------------------------------------------------------------
        // const response = await axios.get('/api/reports', {
        //   params: { status: statusFilter, limit: 50 },
        //   signal: controller.signal,
        // });
        // const payload = Array.isArray(response.data)
        //   ? response.data
        //   : response.data?.data ?? [];
        // setReports(payload);

        // ----- Temporary mock data so the UI renders while waiting -----
        await new Promise((resolve) => setTimeout(resolve, 400));
        setReports(MOCK_REPORTS);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // const message =
        //   axios.isAxiosError(err)
        //     ? err.response?.data?.message ?? 'Failed to fetch reports.'
        //     : 'An unexpected error occurred.';
        // toast.error(message);
        toast.error('Failed to fetch reports.');
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
    return () => controller.abort();
  }, []);

  /* --------------------------- STATS --------------------------- */
  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter((r) => r.status === 'Pending').length,
      resolved: reports.filter((r) => r.status === 'Resolved').length,
      rejected: reports.filter((r) => r.status === 'Rejected').length,
    };
  }, [reports]);

  /* ------------------------- FILTERING ------------------------- */
  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((r) => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesSearch =
        !q ||
        r.documentName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [reports, statusFilter, searchQuery]);

  /* ------------------------- ACTIONS -------------------------- */
  const handleApprove = async (id: string) => {
    const target = reports.find((r) => r.id === id);
    if (!target || target.status !== 'Pending') return;

    setPendingActionId(id);
    try {
      // -----------------------------------------------------------------
      // BACKEND NOT READY YET — Commented out.
      // await axios.post(`/api/reports/${id}/approve`);
      // -----------------------------------------------------------------

      // Mock: optimistically update local state
      await new Promise((r) => setTimeout(r, 300));
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Resolved' } : r)),
      );
      toast.success('Report approved & resolved.');
    } catch {
      toast.error('Failed to approve report.');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this report? This action cannot be undone.')) {
      return;
    }

    setPendingActionId(id);
    try {
      // -----------------------------------------------------------------
      // BACKEND NOT READY YET — Commented out.
      // await axios.delete(`/api/reports/${id}`);
      // -----------------------------------------------------------------

      // Mock: optimistically remove from local state
      await new Promise((r) => setTimeout(r, 300));
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success('Report deleted.');
    } catch {
      toast.error('Failed to delete report.');
    } finally {
      setPendingActionId(null);
    }
  };

  /* ============================ UI ============================ */
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Reported Documents</h1>
          <p className="text-sm text-light-400 mt-0.5">
            Review and moderate reported content from your users.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-xl bg-light-300/50 px-3 py-1.5 text-xs text-light-400">
          <span className="size-2 rounded-full bg-brand" />
          {stats.total} total reports
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
            <Flag className="size-5" />
          </div>
          <div>
            <p className="text-xs text-light-400">Total Reports</p>
            <p className="text-2xl font-bold text-dark-100">{stats.total}</p>
          </div>
        </div>

        <div className="admin-card flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xs text-light-400">Pending Review</p>
            <p className="text-2xl font-bold text-dark-100">{stats.pending}</p>
          </div>
        </div>

        <div className="admin-card flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs text-light-400">Resolved</p>
            <p className="text-2xl font-bold text-dark-100">{stats.resolved}</p>
          </div>
        </div>

        <div className="admin-card flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-red/10 flex items-center justify-center text-red">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="text-xs text-light-400">Rejected</p>
            <p className="text-2xl font-bold text-dark-100">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Search + status filter */}
      <div className="admin-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-light-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by document, reason or report ID..."
              className="w-full rounded-xl bg-light-300/40 py-2 pl-10 pr-3 text-sm text-dark-100 placeholder-light-400 outline-none transition focus:bg-light-300/60"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-brand text-white shadow-drop-2'
                  : 'bg-light-300/40 text-light-100 hover:bg-light-300'
              }`}
            >
              All
            </button>
            {(Object.keys(STATUS_META) as ReportStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-brand text-white shadow-drop-2'
                    : 'bg-light-300/40 text-light-100 hover:bg-light-300'
                }`}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card !p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <p className="text-sm text-light-400">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="size-12 rounded-2xl bg-light-300/40 flex items-center justify-center text-light-400">
              <Flag className="size-6" />
            </div>
            <p className="text-sm font-medium text-dark-100">No reports found</p>
            <p className="text-xs text-light-400">
              Try changing your filters or search query.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Document Name</th>
                  <th>Reason</th>
                  <th className="hidden md:table-cell">Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const meta = STATUS_META[report.status];
                  const isBusy = pendingActionId === report.id;
                  const canApprove = report.status === 'Pending';

                  return (
                    <tr key={report.id}>
                      <td className="font-mono text-xs text-light-100">
                        #{report.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-light-300/40 text-light-100">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-dark-100 max-w-[220px]">
                              {report.documentName}
                            </p>
                            <p className="font-mono text-[11px] text-light-400">
                              doc: {report.documentId.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[260px]">
                        <p className="truncate text-sm text-light-100">
                          {report.reason}
                        </p>
                      </td>
                      <td className="hidden md:table-cell whitespace-nowrap text-xs text-light-400">
                        {formatDateTime(report.createdAt)}
                      </td>
                      <td>
                        <span className={`admin-badge ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(report.id)}
                            disabled={!canApprove || isBusy}
                            title={canApprove ? 'Approve & resolve' : 'Only pending reports can be approved'}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-600 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isBusy && canApprove ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            disabled={isBusy}
                            title="Delete report"
                            className="inline-flex items-center gap-1 rounded-lg bg-red/10 px-2.5 py-1.5 text-xs font-semibold text-red transition hover:bg-red/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isBusy && !canApprove ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
