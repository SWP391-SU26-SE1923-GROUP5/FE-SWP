'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { ReportResponseDto, ReportFilterParams } from '@/types/admin-report';

interface AdminReportsClientProps {
    currentUserId: string;
    initialStatus: string;
    initialPage: number;
}

export default function AdminReportsClient({
    currentUserId,
    initialStatus,
    initialPage
}: AdminReportsClientProps) {
    const [reports, setReports] = useState<ReportResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState(initialStatus);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalReports, setTotalReports] = useState(0);

    const reportsPerPage = 10;

    useEffect(() => {
        const fetchReports = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const params: ReportFilterParams = {
                    status: selectedStatus as any,
                    limit: reportsPerPage,
                    offset: (currentPage - 1) * reportsPerPage,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                };

                const response = await axios.get('/api/Report', { params });
                
                setReports(response.data.data || []);
                setTotalReports(response.data.total || 0);
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'Failed to fetch reports');
                } else {
                    setError('An error occurred while fetching reports');
                }
                console.error('Fetch reports error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [selectedStatus, currentPage]);

    const totalPages = Math.ceil(totalReports / reportsPerPage);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reported Documents</h1>
                    <p className="mt-2 text-gray-600">Manage and review reported content</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            setSelectedStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="Pending">📝 Pending</option>
                        <option value="Reviewed">👀 Reviewed</option>
                        <option value="Resolved">✅ Resolved</option>
                        <option value="Rejected">❌ Rejected</option>
                    </select>
                    <span className="text-sm text-gray-500">Total: {totalReports}</span>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-600">Loading reports...</p>
                    </div>
                </div>
            )}

            {error && !isLoading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {!isLoading && !error && reports.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-600">No reports found</p>
                </div>
            )}

            {!isLoading && !error && reports.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Document
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Reported By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <span className="font-medium truncate max-w-xs">Doc: {report.documentId.slice(0, 8)}...</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {report.userId.slice(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <span className="line-clamp-1">{report.reason || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {formatDateTime(report.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <Link
                                            href={`/admin/reports/${report.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                        >
                                            Review →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!isLoading && !error && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
