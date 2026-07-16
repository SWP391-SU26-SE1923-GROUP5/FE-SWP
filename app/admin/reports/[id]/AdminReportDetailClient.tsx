'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { ReportWithDetails, UpdateReportRequestDto } from '@/types/admin-report';

interface AdminReportDetailClientProps {
    reportId: string;
    currentUserId: string;
}

export default function AdminReportDetailClient({
    reportId,
    currentUserId
}: AdminReportDetailClientProps) {
    const router = useRouter();
    const [report, setReport] = useState<ReportWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isActioning, setIsActioning] = useState(false);
    const [actionNotes, setActionNotes] = useState('');

    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await axios.get(`/api/Report/${reportId}`);
                setReport(response.data);
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'Failed to fetch report');
                } else {
                    setError('An error occurred while fetching report');
                }
                console.error('Fetch report error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [reportId]);

    const handleApprove = async () => {
        if (!report) return;
        
        setIsActioning(true);
            try {
                const payload: UpdateReportRequestDto = {
                    status: 'Resolved',
                    notes: actionNotes
                };

                const response = await axios.patch(`/api/Report/${reportId}/status`, payload);

                setReport(response.data);
                toast.success('Report approved successfully');
                router.push('/admin/reports');
        } catch (err) {
            console.error('Approve error', err);
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || 'Failed to approve report');
            } else {
                toast.error('An error occurred');
            }
        } finally {
            setIsActioning(false);
        }
    };

    const handleReject = async () => {
        if (!report) return;
        
        if (!actionNotes.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setIsActioning(true);
            try {
                const payload: UpdateReportRequestDto = {
                    status: 'Rejected',
                    notes: actionNotes
                };

                const response = await axios.patch(`/api/Report/${reportId}/status`, payload);
                setReport(response.data);
                toast.success('Report rejected successfully');
                router.push('/admin/reports');
        } catch (err) {
            console.error('Reject error', err);
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || 'Failed to reject report');
            } else {
                toast.error('An error occurred');
            }
        } finally {
            setIsActioning(false);
        }
    };

    const handleDelete = async () => {
        if (!report) return;
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;

        setIsActioning(true);
        try {
            await axios.delete(`/api/Report/${reportId}`);
            toast.success('Report deleted');
            router.push('/admin/reports');
        } catch (err) {
            console.error('Delete error', err);
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || 'Failed to delete report');
            } else {
                toast.error('An error occurred');
            }
        } finally {
            setIsActioning(false);
        }
    };

    const handleMarkNonFlaggable = async () => {
        if (!report?.documentId) return;
        setIsActioning(true);
        try {
            const resp = await axios.post(`/api/Report/documents/${report.documentId}/mark-non-flaggable`);
            if (resp.data) {
                setReport((r) => r ? { ...r, document: { ...(r.document || {}), ...resp.data } } : r);
            }
            toast.success('Document marked non-flaggable');
        } catch (err) {
            console.error('Mark non-flaggable error', err);
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || 'Failed to mark document');
            } else {
                toast.error('An error occurred');
            }
        } finally {
            setIsActioning(false);
        }
    };

        const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Reviewed':
                return 'bg-blue-100 text-blue-800';
            case 'Resolved':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="space-y-4">
                <Link
                    href="/admin/reports"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Reports
                </Link>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-lg font-bold text-red-900 mb-2">Error</h2>
                    <p className="text-red-700">{error || 'Report not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin/reports"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Reports
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Report Details</h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Current Status</p>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Report Date</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(report.createdAt)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Report Information</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600">Reported By</p>
                            <p className="text-sm font-medium text-gray-900">{report.user?.fullName || report.userId}</p>
                            <p className="text-xs text-gray-500">{report.user?.email}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Reason</p>
                            <p className="text-sm text-gray-900 bg-gray-50 rounded p-2 mt-1">
                                {report.reason || 'No reason provided'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Report ID</p>
                            <p className="text-xs font-mono text-gray-900 bg-gray-50 rounded p-2 mt-1 break-all">
                                {report.id}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Reported Document</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-600">Document Title</p>
                            <p className="text-sm font-medium text-gray-900">{report.document?.title || 'Unknown'}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Document Owner</p>
                            <p className="text-sm font-medium text-gray-900">{report.document?.owner?.fullName || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{report.document?.owner?.email}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Document ID</p>
                            <p className="text-xs font-mono text-gray-900 bg-gray-50 rounded p-2 mt-1 break-all">
                                {report.documentId}
                            </p>
                        </div>

                        <Link
                            href={`/document/${report.documentId}`}
                            target="_blank"
                            className="inline-block text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
                        >
                            View Document →
                        </Link>
                    </div>
                </div>
            </div>

            {report.status === 'Pending' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Take Action</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Notes (Required for rejection)
                            </label>
                            <textarea
                                value={actionNotes}
                                onChange={(e) => setActionNotes(e.target.value)}
                                placeholder="Enter your decision notes here..."
                                rows={4}
                                disabled={isActioning}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleApprove}
                                disabled={isActioning}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                            >
                                {isActioning ? 'Processing...' : '✅ Approve'}
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={isActioning || !actionNotes.trim()}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors"
                            >
                                {isActioning ? 'Processing...' : '❌ Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {report.status !== 'Pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                        ℹ️ This report has already been processed with status: <strong>{report.status}</strong>
                    </p>
                </div>
            )}
        </div>
    );
}
