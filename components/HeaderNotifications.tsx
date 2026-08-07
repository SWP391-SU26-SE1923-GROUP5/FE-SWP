"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BrainCircuit, FileText, Trophy, Check } from "lucide-react";
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/notification.actions";
import { NotificationResponseDto } from "@/types";
import { formatDateGMT7 } from "@/lib/utils";

const getNotificationStyle = (type: string, message: string) => {
    const lowerType = (type || '').toLowerCase();
    const lowerMsg = (message || '').toLowerCase();

    if (lowerType === 'quiz' || lowerMsg.includes('quiz')) {
        return {
            icon: <BrainCircuit className="w-4 h-4 text-brand" />,
            iconBg: 'bg-brand/10 border border-brand/20 dark:bg-brand/20'
        };
    }
    if (lowerType === 'flashcard' || lowerMsg.includes('flashcard')) {
        return {
            icon: <FileText className="w-4 h-4 text-indigo-500" />,
            iconBg: 'bg-indigo-500/10 border border-indigo-500/20 dark:bg-indigo-500/20'
        };
    }
    if (lowerType === 'achievement' || lowerMsg.includes('streak') || lowerMsg.includes('level') || lowerMsg.includes('xp')) {
        return {
            icon: <Trophy className="w-4 h-4 text-amber-500" />,
            iconBg: 'bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/20'
        };
    }
    if (lowerType === 'document' || lowerMsg.includes('document') || lowerMsg.includes('file')) {
        return {
            icon: <FileText className="w-4 h-4 text-blue-500" />,
            iconBg: 'bg-blue-500/10 border border-blue-500/20 dark:bg-blue-500/20'
        };
    }
    return {
        icon: <Bell className="w-4 h-4 text-brand" />,
        iconBg: 'bg-brand/10 border border-brand/20 dark:bg-brand/20'
    };
};

export default function HeaderNotifications() {
    const [notifications, setNotifications] = useState<NotificationResponseDto[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        async function loadNotifications() {
            try {
                const data = await getMyNotifications();
                if (Array.isArray(data)) {
                    setNotifications(data);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        }
        loadNotifications();
        
        // Polling every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;
    
    const activeFilterTotal = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });
    
    const filteredNotifications = activeFilterTotal.slice(0, 8); // show max 8 in dropdown

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-full bg-white dark:bg-dark-300 border border-light-700 dark:border-dark-400 text-dark200_light800 hover:bg-light-800 dark:hover:bg-dark-400 transition-colors shadow-sm cursor-pointer outline-none"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white border-2 border-white dark:border-dark-400">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-[360px] sm:w-[400px] bg-white dark:bg-dark-300 rounded-2xl shadow-drop-3 border border-light-700 dark:border-dark-400 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-light-700 dark:border-dark-400">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="h3 text-dark-100">
                                Notifications
                                {activeFilterTotal.length > 0 && (
                                    <span className="text-xs font-normal text-light-500 ml-2">
                                        (Showing {filteredNotifications.length} of {activeFilterTotal.length} {filter === 'unread' ? 'unread' : 'total'})
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-semibold text-brand hover:text-brand-100 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setFilter('all')}
                                className={`text-sm font-bold pb-1 cursor-pointer transition-colors ${filter === 'all' ? 'text-brand border-b-2 border-brand' : 'text-light-500 hover:text-dark-200'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`text-sm font-bold pb-1 cursor-pointer transition-colors ${filter === 'unread' ? 'text-brand border-b-2 border-brand' : 'text-light-500 hover:text-dark-200'}`}
                            >
                                Unread
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {filteredNotifications.length > 0 ? (
                            <div className="flex flex-col">
                                {filteredNotifications.map((item) => {
                                    const style = getNotificationStyle(item.type || '', item.message);
                                    const dateStr = item.createdAt ? formatDateGMT7(item.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';
                                    return (
                                        <div 
                                            key={item.id}
                                            className={`p-3.5 flex gap-3 items-start border-b border-light-400/30 last:border-0 transition-colors ${!item.isRead ? 'bg-brand/5' : 'bg-transparent'}`}
                                        >
                                            <div className={`p-2.5 rounded-full shrink-0 ${style.iconBg}`}>
                                                {style.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-sm line-clamp-2 leading-tight ${!item.isRead ? 'font-bold text-dark-100' : 'font-medium text-dark-200'}`}>
                                                        {item.message}
                                                    </span>
                                                    {!item.isRead && (
                                                        <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1" />
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`text-[11px] ${!item.isRead ? 'text-brand font-semibold' : 'text-light-500'}`}>
                                                        {dateStr}
                                                    </span>
                                                    {!item.isRead && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markNotificationAsRead(item.id).then(() => {
                                                                    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
                                                                }).catch(console.error);
                                                            }}
                                                            className="text-[11px] font-semibold text-brand cursor-pointer hover:underline transition-all px-1"
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-10 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-12 h-12 rounded-full bg-light-800 dark:bg-dark-400 flex items-center justify-center mb-3">
                                    <Bell className="w-6 h-6 text-light-400" />
                                </div>
                                <p className="text-sm font-semibold text-dark-200">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
                                <p className="text-xs text-light-500 mt-1">You're all caught up!</p>
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-light-700 dark:border-dark-400 bg-light-900 dark:bg-dark-300">
                        <Link 
                            href="/notifications" 
                            onClick={() => setIsOpen(false)}
                            className="block w-full text-center py-2 text-sm font-bold text-brand hover:bg-brand/10 rounded-xl transition-colors"
                        >
                            See all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
