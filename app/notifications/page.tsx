'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    BrainCircuit,
    CheckCircle2,
    Flame,
    Award,
    FileText,
    Trophy,
    Check,
    Bell
} from 'lucide-react';
import {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from '@/lib/actions/notification.actions';
import { NotificationResponseDto } from '@/types';
import Pagination from '@/components/Pagination';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const itemsPerPage = 10;

    useEffect(() => {
        async function loadNotifications() {
            setLoading(true);
            try {
                const data = await getMyNotifications();
                if (Array.isArray(data)) {
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        }
        loadNotifications();
    }, []);

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    const displayedNotifications = useMemo(() => {
        return filter === 'all'
            ? notifications
            : notifications.filter((item) => !item.isRead);
    }, [notifications, filter]);

    const totalItems = displayedNotifications.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const paginatedNotifications = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return displayedNotifications.slice(start, start + itemsPerPage);
    }, [displayedNotifications, currentPage, itemsPerPage]);

    const handleFilterChange = (newFilter: 'all' | 'unread') => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const handleMarkAllRead = async () => {
        setNotifications((prev) =>
            prev.map((item) => ({ ...item, isRead: true }))
        );
        try {
            await markAllNotificationsAsRead();
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleItemClick = async (id: string, isRead: boolean) => {
        if (isRead) return;
        setNotifications((prev) =>
            prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
        );
        try {
            await markNotificationAsRead(id);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const getNotificationStyle = (type: string, message: string) => {
        const lowerType = (type || '').toLowerCase();
        const lowerMsg = (message || '').toLowerCase();

        if (lowerType === 'quiz' || lowerMsg.includes('quiz')) {
            return {
                icon: <BrainCircuit className="w-5 h-5 text-brand" />,
                iconBg: 'bg-brand/10 border border-brand/20 dark:bg-brand/20'
            };
        }
        if (lowerType === 'streak' || lowerMsg.includes('streak')) {
            return {
                icon: <Flame className="w-5 h-5 text-orange-500" />,
                iconBg: 'bg-orange-500/10 border border-orange-500/20 dark:bg-orange-500/20'
            };
        }
        if (lowerType === 'badge' || lowerMsg.includes('badge') || lowerMsg.includes('level')) {
            return {
                icon: <Award className="w-5 h-5 text-amber-500" />,
                iconBg: 'bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/20'
            };
        }
        if (lowerType === 'leaderboard' || lowerMsg.includes('leaderboard') || lowerMsg.includes('rank')) {
            return {
                icon: <Trophy className="w-5 h-5 text-amber-500" />,
                iconBg: 'bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/20'
            };
        }
        if (lowerType === 'document' || lowerMsg.includes('document') || lowerMsg.includes('file')) {
            return {
                icon: <FileText className="w-5 h-5 text-blue-500" />,
                iconBg: 'bg-blue-500/10 border border-blue-500/20 dark:bg-blue-500/20'
            };
        }
        return {
            icon: <Bell className="w-5 h-5 text-brand" />,
            iconBg: 'bg-brand/10 border border-brand/20 dark:bg-brand/20'
        };
    };

    if (loading) {
        return (
            <div className="flex flex-col gap-6 pb-20 pt-6 max-w-5xl mx-auto w-full px-5 sm:px-6 min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-brand border-t-transparent animate-spin" />
                    <p className="body-2 text-dark500_light400 font-medium">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-20 pt-6 max-w-5xl mx-auto w-full px-5 sm:px-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-700 dark:border-dark-400 pb-5">
                <div className="flex items-center gap-3.5">
                    <Link
                        href="/home"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-dark-300 border border-light-700 dark:border-dark-400 shadow-xs hover:bg-light-800 dark:hover:bg-dark-400 text-dark300_light700 transition-all"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="h2 text-dark100_light900 font-bold">Notifications</h1>
                            {unreadCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand dark:bg-brand/20 border border-brand/20">
                                    <Bell className="w-3.5 h-3.5" />
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>
                        <p className="body-2 text-dark500_light400 mt-0.5">
                            Stay up to date with your study achievements, AI vector processing alerts, and system events.
                        </p>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-dark-300 border border-light-700 dark:border-dark-400 text-dark200_light800 hover:text-brand hover:border-brand shadow-xs font-semibold text-sm transition-all cursor-pointer shrink-0"
                    >
                        <Check className="w-4 h-4 text-brand" />
                        <span>Mark all read</span>
                    </button>
                )}
            </div>

            <div className="w-full space-y-6">
                <div className="flex items-center justify-between border-b border-light-700 dark:border-dark-400">
                    <div className="flex gap-6">
                        <button
                            onClick={() => handleFilterChange('all')}
                            className={`pb-3 text-sm font-bold transition-all duration-200 cursor-pointer relative ${
                                filter === 'all'
                                    ? 'text-brand'
                                    : 'text-dark500_light400 hover:text-dark100_light900'
                            }`}
                        >
                            All ({notifications.length})
                            {filter === 'all' && (
                                <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-brand rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => handleFilterChange('unread')}
                            className={`pb-3 text-sm font-bold transition-all duration-200 cursor-pointer relative ${
                                filter === 'unread'
                                    ? 'text-brand'
                                    : 'text-dark500_light400 hover:text-dark100_light900'
                            }`}
                        >
                            Unread ({unreadCount})
                            {filter === 'unread' && (
                                <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-brand rounded-t-full" />
                            )}
                        </button>
                    </div>

                    <span className="text-xs font-semibold text-dark500_light400 mb-3">
                        Showing {paginatedNotifications.length} of {totalItems}
                    </span>
                </div>

                <div className="space-y-3.5">
                    {paginatedNotifications.map((item) => {
                        const style = getNotificationStyle(item.type, item.message);
                        const dateStr = item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Just now';

                        return (
                            <div
                                key={item.id}
                                className={`rounded-3xl p-5 sm:p-6 border transition-all duration-200 flex flex-col sm:flex-row items-start justify-between gap-4 ${
                                    !item.isRead
                                        ? 'bg-white dark:bg-dark-200 border-brand/40 shadow-drop-2 hover:shadow-drop-3 hover:border-brand/60'
                                        : 'bg-light-900/40 dark:bg-dark-300/20 border-light-700 dark:border-dark-400 shadow-none hover:bg-light-900/80 dark:hover:bg-dark-300/40 opacity-70 hover:opacity-100'
                                }`}
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${style.iconBg} ${!item.isRead ? 'ring-2 ring-brand/20 shadow-sm' : 'opacity-60'}`}>
                                        {style.icon}
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className={`h4 ${!item.isRead ? 'text-dark100_light900 font-extrabold' : 'text-dark300_light700 font-semibold'}`}>
                                                {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Notification'}
                                            </h3>
                                            {!item.isRead && (
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand text-white shadow-sm flex items-center gap-1">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <p className={`body-2 leading-relaxed ${!item.isRead ? 'text-dark200_light800 font-medium' : 'text-dark500_light400'}`}>
                                            {item.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center sm:flex-col sm:items-end sm:justify-center gap-2 shrink-0 pt-1 w-full sm:w-auto justify-between border-t border-light-700 sm:border-0 mt-3 sm:mt-0 pt-3 sm:pt-0 dark:border-dark-400">
                                    <span className={`caption font-semibold ${!item.isRead ? 'text-brand/80' : 'text-dark500_light400'}`}>
                                        {dateStr}
                                    </span>
                                    {!item.isRead && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleItemClick(item.id, item.isRead);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/10 text-brand text-xs font-bold transition-all hover:bg-brand hover:text-white hover:shadow-drop-1 hover:scale-105"
                                            title="Mark as read"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Read
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {paginatedNotifications.length === 0 && (
                        <div className="bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-3xl p-12 text-center shadow-drop-1 space-y-2">
                            <CheckCircle2 className="w-10 h-10 text-brand mx-auto opacity-80" />
                            <p className="h4 text-dark100_light900 font-bold">No notifications to show</p>
                            <p className="body-2 text-dark500_light400">You are all caught up with your updates and study achievements.</p>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="mt-8 pt-6 border-t border-light-700 dark:border-dark-400">
                        <Pagination
                            page={currentPage}
                            totalPages={totalPages}
                            total={totalItems}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
