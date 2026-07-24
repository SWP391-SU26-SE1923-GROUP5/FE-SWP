'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Trophy,
    Crown,
    Medal,
    Zap,
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
                    getLeaderboard(50, apiPeriod),
                    getMyStats(),
                    getCurrentUser()
                ]);

                if (Array.isArray(list)) {
                    setLeaderboard(list);
                }
                if (stats) {
                    setMyStats(stats);
                }
                const u = user as { id?: string; Id?: string } | null;
                if (u?.id) {
                    setCurrentUserId(u.id);
                } else if (u?.Id) {
                    setCurrentUserId(u.Id);
                }
            } catch (error) {
                console.error("Failed to load leaderboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [timeTab]);

    const myEntry = leaderboard.find(item => item.userId === currentUserId);
    const currentUserRank = myEntry ? myEntry.rank : (leaderboard.length > 0 ? leaderboard.length + 1 : 1);
    const myTotalXp = myEntry ? myEntry.totalXp : (myStats?.totalXp || 0);
    const myLevel = myEntry ? myEntry.currentLevel : (myStats?.currentLevel || 1);
    const myStreak = myEntry ? myEntry.currentStreak : (myStats?.currentStreak || 0);

    const top10Leaderboard = leaderboard.slice(0, 10);

    if (loading && leaderboard.length === 0) {
        return (
            <div className="flex flex-col gap-6 pb-20 pt-6 max-w-5xl mx-auto w-full px-5 sm:px-6 min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-brand border-t-transparent animate-spin" />
                    <p className="body-2 text-dark500_light400 font-medium">Loading rankings...</p>
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
                            <h1 className="h2 text-dark100_light900 font-bold">Leaderboard</h1>
                            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand dark:bg-brand/20 border border-brand/20">
                                <Trophy className="w-3.5 h-3.5" />
                                Top 10 Champions
                            </span>
                        </div>
                        <p className="body-2 text-dark500_light400 mt-0.5">
                            Compete with top learners across weekly, monthly, and all-time XP milestones.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full space-y-6">
                <div className="bg-light-800 dark:bg-dark-300 p-1.5 rounded-2xl border border-light-700 dark:border-dark-400 grid grid-cols-3 gap-1 shadow-inner">
                    {[
                        { id: 'weekly', label: 'Weekly' },
                        { id: 'monthly', label: 'Monthly' },
                        { id: 'allTime', label: 'All Time' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setTimeTab(tab.id as 'weekly' | 'monthly' | 'allTime')}
                            className={`py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer text-center ${
                                timeTab === tab.id
                                    ? 'bg-brand text-white shadow-drop-2'
                                    : 'text-dark500_light400 hover:text-dark100_light900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-gradient-to-r from-brand/15 via-emerald-500/10 to-transparent border-2 border-brand/40 dark:border-brand/30 rounded-3xl p-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-drop-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                            #{currentUserRank}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="h4 text-dark100_light900 font-extrabold">
                                    {myEntry?.fullName || 'Your Current Standing'}
                                </h3>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand/20 text-brand border border-brand/30">
                                    You
                                </span>
                            </div>
                            <p className="body-2 text-dark500_light400 mt-0.5 flex items-center gap-3">
                                <span>Level {myLevel}</span>
                                {myStreak > 0 && <span className="text-orange-500 font-bold">🔥 {myStreak}d Streak</span>}
                                <span>• {currentUserRank <= 10 ? 'Inside Top 10 🎉' : `${currentUserRank - 10} spots away from Top 10`}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white dark:bg-dark-200 px-4 py-2 rounded-2xl border border-light-700 dark:border-dark-400 shadow-xs self-stretch sm:self-auto justify-center">
                        <Zap className="w-5 h-5 text-brand fill-brand shrink-0" />
                        <span className="text-lg font-black text-dark100_light900">
                            {myTotalXp.toLocaleString()}
                        </span>
                        <span className="caption font-bold text-dark500_light400 ml-0.5">XP</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-2 pt-2">
                        <span className="text-xs font-bold text-dark500_light400 uppercase tracking-wider">
                            Rank & Learner
                        </span>
                        <span className="text-xs font-bold text-dark500_light400 uppercase tracking-wider">
                            Total XP
                        </span>
                    </div>

                    {loading ? (
                        <div className="bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-3xl p-12 text-center shadow-drop-1 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-4 border-brand border-t-transparent animate-spin mb-3" />
                            <p className="body-2 text-dark500_light400 font-bold">Refreshing Top 10...</p>
                        </div>
                    ) : top10Leaderboard.length > 0 ? (
                        top10Leaderboard.map((user) => {
                            const isMe = user.userId === currentUserId;
                            const avatarChar = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

                            let rankNode = <span className="w-6 text-center font-bold text-dark500_light400">{user.rank}</span>;
                            if (user.rank === 1) rankNode = <Crown className="w-6 h-6 text-amber-500 fill-amber-500 shrink-0" />;
                            else if (user.rank === 2) rankNode = <Medal className="w-6 h-6 text-slate-400 shrink-0" />;
                            else if (user.rank === 3) rankNode = <Medal className="w-6 h-6 text-amber-700 shrink-0" />;

                            return (
                                <div
                                    key={user.userId || user.rank}
                                    className={`rounded-3xl p-4 sm:px-6 border transition-all duration-200 flex items-center justify-between gap-4 ${
                                        isMe
                                            ? 'bg-brand/5 dark:bg-brand/10 border-brand shadow-drop-2 ring-1 ring-brand/30 font-bold'
                                            : 'bg-white dark:bg-dark-200 border-light-700 dark:border-dark-400 shadow-xs hover:border-brand/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                                        <div className="flex items-center justify-center w-6 shrink-0">
                                            {rankNode}
                                        </div>

                                        <div className="w-10 h-10 rounded-2xl bg-light-800 dark:bg-dark-300 border border-light-700 dark:border-dark-400 text-brand font-extrabold flex items-center justify-center shrink-0 text-base shadow-inner">
                                            {avatarChar}
                                        </div>

                                        <div className="truncate">
                                            <p className={`h4 truncate ${isMe ? 'text-brand font-extrabold' : 'text-dark100_light900 font-bold'}`}>
                                                {user.fullName} {isMe && '(You)'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="caption text-dark500_light400 font-semibold">
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
                                        <Zap className="w-4 h-4 text-brand fill-brand shrink-0" />
                                        <span className="text-base sm:text-lg font-extrabold text-dark100_light900">
                                            {user.totalXp.toLocaleString()}
                                        </span>
                                        <span className="caption font-bold text-dark500_light400 ml-0.5">XP</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white dark:bg-dark-200 border border-light-700 dark:border-dark-400 rounded-3xl p-12 text-center shadow-drop-1">
                            <Trophy className="w-10 h-10 text-brand mx-auto mb-3 opacity-80" />
                            <h3 className="h4 text-dark100_light900 font-bold">Leaderboard is updating</h3>
                            <p className="body-2 text-dark500_light400 mt-1">Complete flashcards and take quizzes to earn XP and be the first on the ranking.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}