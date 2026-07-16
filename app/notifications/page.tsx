'use client';

import React, { useState, useEffect } from 'react';
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

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadNotifications() {
            setLoading(true);
            try {
                const data = await getMyNotifications();
                if (Array.isArray(data)) {
                    setNotifications(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadNotifications();
    }, []);

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    const displayedNotifications = filter === 'all'
        ? notifications
        : notifications.filter((item) => !item.isRead);

    const handleMarkAllRead = async () => {
        setNotifications((prev) =>
            prev.map((item) => ({ ...item, isRead: true }))
        );
        try {
            await markAllNotificationsAsRead();
        } catch (error) {
            console.error(error);
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
            console.error(error);
        }
    };

    const getNotificationStyle = (type: string, message: string) => {
        const lowerType = (type || '').toLowerCase();
        const lowerMsg = (message || '').toLowerCase();

        if (lowerType === 'quiz' || lowerMsg.includes('quiz')) {
            return {
                icon: <BrainCircuit className="w-5 h-5 text-[#10b981]" />,
                iconBg: 'bg-[#10b981]/10 border border-[#10b981]/20'
            };
        }
        if (lowerType === 'streak' || lowerMsg.includes('streak')) {
            return {
                icon: <Flame className="w-5 h-5 text-orange-500" />,
                iconBg: 'bg-orange-50 border border-orange-100'
            };
        }
        if (lowerType === 'badge' || lowerMsg.includes('badge') || lowerMsg.includes('level')) {
            return {
                icon: <Award className="w-5 h-5 text-amber-500" />,
                iconBg: 'bg-amber-50 border border-amber-100'
            };
        }
        if (lowerType === 'leaderboard' || lowerMsg.includes('leaderboard') || lowerMsg.includes('rank')) {
            return {
                icon: <Trophy className="w-5 h-5 text-amber-500" />,
                iconBg: 'bg-yellow-50 border border-yellow-100'
            };
        }
        if (lowerType === 'document' || lowerMsg.includes('document') || lowerMsg.includes('file')) {
            return {
                icon: <FileText className="w-5 h-5 text-blue-500" />,
                iconBg: 'bg-blue-50 border border-blue-100'
            };
        }
        return {
            icon: <Bell className="w-5 h-5 text-[#10b981]" />,
            iconBg: 'bg-[#10b981]/10 border border-[#10b981]/20'
        };
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-[#10b981] border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen pb-16 pt-6 sm:pt-8 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="mb-6 pb-4 border-b border-light-700">
                    <Link
                        href="/home"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-light-700 text-dark-200 hover:text-[#10b981] hover:border-[#10b981] shadow-drop-3 font-semibold text-sm transition-all duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>
                </div>

                <div className="flex items-start justify-between mb-6 pb-4 border-b border-light-700">
                    <div>
                        <h1 className="h1 text-dark-200 tracking-tight">
                            Notifications
                        </h1>
                        <p className="body-2 font-semibold text-slate-500 mt-1">
                            {unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up! No unread messages.'}
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-light-700 text-dark-200 hover:text-[#10b981] hover:border-[#10b981] shadow-drop-3 font-semibold text-sm transition-all duration-200 cursor-pointer shrink-0"
                        >
                            <Check className="w-4 h-4 text-[#10b981]" />
                            <span>Mark all read</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div className="bg-slate-100 p-1.5 rounded-full inline-flex gap-1 border border-light-700 shadow-inner">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                                filter === 'all'
                                    ? 'bg-[#10b981] text-white shadow-drop-2'
                                    : 'text-slate-500 hover:text-dark-200'
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                                filter === 'unread'
                                    ? 'bg-[#10b981] text-white shadow-drop-2'
                                    : 'text-slate-500 hover:text-dark-200'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>
                </div>

                <div className="space-y-3.5">
                    {displayedNotifications.map((item) => {
                        const style = getNotificationStyle(item.type, item.message);
                        const dateStr = item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Just now';

                        return (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item.id, item.isRead)}
                                className={`rounded-[20px] p-5 sm:p-6 border transition-all duration-200 flex items-start justify-between gap-4 cursor-pointer ${
                                    !item.isRead
                                        ? 'bg-white border-[#10b981] shadow-drop-3 hover:border-[#10b981]'
                                        : 'bg-white/80 border-light-700 shadow-sm opacity-85 hover:opacity-100'
                                }`}
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`p-3 rounded-2xl shrink-0 mt-0.5 ${style.iconBg}`}>
                                        {style.icon}
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className={`h4 ${!item.isRead ? 'text-dark-200 font-bold' : 'text-dark-200/80 font-semibold'}`}>
                                            {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Notification'}
                                        </h3>
                                        <p className="body-2 text-slate-600 leading-relaxed">
                                            {item.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 pt-1">
                                    {!item.isRead && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                                    )}
                                    <span className="caption font-semibold text-slate-400">
                                        {dateStr}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {displayedNotifications.length === 0 && (
                        <div className="bg-white border border-light-700 rounded-[20px] p-12 text-center shadow-drop-3 space-y-2">
                            <CheckCircle2 className="w-10 h-10 text-[#10b981] mx-auto opacity-80" />
                            <p className="h4 text-dark-200 font-bold">No unread notifications</p>
                            <p className="body-2 text-slate-500">You are all caught up with your latest updates and study achievements.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}