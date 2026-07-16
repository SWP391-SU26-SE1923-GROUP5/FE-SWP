'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Trophy,
    Crown,
    Medal,
    Zap
} from 'lucide-react';
import { getLeaderboard, getMyStats } from '@/lib/actions/gamification.actions';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { LeaderboardEntryDto, UserStatsResponseDto } from '@/types';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntryDto[]>([]);
    const [myStats, setMyStats] = useState<UserStatsResponseDto | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [timeTab, setTimeTab] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const apiPeriod = timeTab === 'allTime' ? 'alltime' : timeTab;
                const [list, stats, user] = await Promise.all([
                    getLeaderboard(30, apiPeriod),
                    getMyStats(),
                    getCurrentUser()
                ]);

                if (Array.isArray(list)) {
                    setLeaderboard(list);
                }
                if (stats) {
                    setMyStats(stats);
                }
                if (user && user.id) {
                    setCurrentUserId(user.id);
                } else if (user && (user as any).id) {
                    setCurrentUserId((user as any).id);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [timeTab]);

    const myEntry = leaderboard.find(item => item.userId === currentUserId);
    const currentUserRank = myEntry ? myEntry.rank : (leaderboard.length > 0 ? leaderboard.length + 1 : 1);

    if (loading && leaderboard.length === 0) {
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

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3.5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] shrink-0">
                        <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="h1 text-dark-200 tracking-tight">
                            Leaderboard
                        </h1>
                        <p className="body-1 text-slate-500 mt-0.5">
                            Compete with the top learners
                        </p>
                    </div>
                </div>

                <div className="bg-slate-100 p-1.5 rounded-2xl border border-light-700 grid grid-cols-3 gap-1 mb-6 shadow-inner">
                    {[
                        { id: 'weekly', label: 'Weekly' },
                        { id: 'monthly', label: 'Monthly' },
                        { id: 'allTime', label: 'All Time' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setTimeTab(tab.id as any)}
                            className={`py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer text-center ${
                                timeTab === tab.id
                                    ? 'bg-[#10b981] text-white shadow-drop-2'
                                    : 'text-slate-500 hover:text-dark-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-2xl p-4 sm:px-6 mb-6 flex items-center justify-between shadow-drop-3">
                    <span className="body-2 font-bold text-dark-200">
                        Your current rank
                    </span>
                    <div className="flex items-center gap-3">
                        {myStats && (
                            <span className="text-xs font-bold text-[#10b981] bg-white px-3 py-1 rounded-full border border-[#10b981]/20">
                                {myStats.totalXp.toLocaleString()} XP
                            </span>
                        )}
                        <span className="px-4 py-1 rounded-xl bg-[#10b981] text-white font-extrabold text-sm shadow-sm">
                            #{currentUserRank}
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white border border-light-700 rounded-[20px] p-12 text-center shadow-drop-3 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-4 border-[#10b981] border-t-transparent animate-spin mb-3" />
                            <p className="body-2 text-slate-500 font-bold">Loading ranking...</p>
                        </div>
                    ) : leaderboard.length > 0 ? (
                        leaderboard.map((user) => {
                            const isMe = user.userId === currentUserId;
                            const avatarChar = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

                            let rankNode = <span className="w-6 text-center font-bold text-slate-400">{user.rank}</span>;
                            if (user.rank === 1) rankNode = <Crown className="w-6 h-6 text-amber-500 fill-amber-500 shrink-0" />;
                            else if (user.rank === 2) rankNode = <Medal className="w-6 h-6 text-slate-400 shrink-0" />;
                            else if (user.rank === 3) rankNode = <Medal className="w-6 h-6 text-amber-700 shrink-0" />;

                            return (
                                <div
                                    key={user.userId || user.rank}
                                    className={`rounded-[20px] p-4 sm:px-6 border transition-all duration-200 flex items-center justify-between gap-4 ${
                                        isMe
                                            ? 'bg-white border-[#10b981] shadow-drop-3 ring-2 ring-[#10b981]/20 font-bold'
                                            : 'bg-white border-light-700 shadow-sm hover:border-[#10b981]'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                                        <div className="flex items-center justify-center w-6 shrink-0">
                                            {rankNode}
                                        </div>

                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-light-700 text-[#10b981] font-extrabold flex items-center justify-center shrink-0 text-base shadow-inner">
                                            {avatarChar}
                                        </div>

                                        <div className="truncate">
                                            <p className={`h4 truncate ${isMe ? 'text-[#10b981]' : 'text-dark-200'}`}>
                                                {user.fullName} {isMe && '(You)'}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="caption text-slate-400 font-semibold">
                                                    Level {user.currentLevel}
                                                </span>
                                                {user.currentStreak > 0 && (
                                                    <span className="caption text-orange-500 font-bold">
                                                        🔥 {user.currentStreak}d
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 text-right">
                                        <Zap className="w-4 h-4 text-[#10b981] fill-[#10b981] shrink-0" />
                                        <span className="text-base sm:text-lg font-extrabold text-dark-200">
                                            {user.totalXp.toLocaleString()}
                                        </span>
                                        <span className="caption font-bold text-slate-400 ml-0.5">XP</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white border border-light-700 rounded-[20px] p-12 text-center shadow-drop-3">
                            <Trophy className="w-10 h-10 text-[#10b981] mx-auto mb-3 opacity-80" />
                            <h3 className="h4 text-dark-200 font-bold">Leaderboard is updating</h3>
                            <p className="body-2 text-slate-500 mt-1">Complete flashcards and take quizzes to earn XP and be the first on the ranking.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}