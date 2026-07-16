'use client'

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Clock,
    Layers,
    TrendingUp,
    Award,
    AlertCircle,
    Sparkles,
    ChevronRight,
    ArrowUpRight,
    ArrowLeft
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { getAnalyticsDashboard } from "@/lib/actions/analytics.actions";
import { DashboardDto } from "@/types";

export default function AnalyticsPage() {
    const [dashboardData, setDashboardData] = useState<DashboardDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const data = await getAnalyticsDashboard();
                if (data) {
                    setDashboardData(data);
                }
            } catch (error) {
                console.error("Failed to fetch analytics dashboard:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const kpis = dashboardData?.kpis || {
        totalStudyHours: 0,
        totalStudyMinutes: 0,
        cardsReviewed: 0,
        averageAccuracy: 0,
        efficiencyScore: 0,
        currentStreakDays: 0,
        flashcardsDueToday: 0
    };

    const accuracyTrend = (dashboardData?.accuracyTrend || []).map(point => ({
        day: point.date,
        accuracy: point.accuracyPercent ?? null
    }));

    const flashcardVolumeTrend = (dashboardData?.cardsReviewedTrend || []).map(point => ({
        day: point.date,
        count: point.cardsCount
    }));

    const quizVolumeTrend = (dashboardData?.accuracyTrend || []).map(point => ({
        day: point.date,
        count: point.cardsCount
    }));

    const subjectMasteries = dashboardData?.subjectMasteries || [];
    const aiTips = dashboardData?.aiTips || [];

    if (loading) {
        return (
            <div className="flex flex-col gap-6 pb-20 pt-6 max-w-7xl mx-auto w-full px-5 sm:px-6 min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-brand border-t-transparent animate-spin" />
                    <p className="body-2 text-light-200 dark:text-dark-400 font-medium">Loading your AI study analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-20 pt-6 max-w-7xl mx-auto w-full px-5 sm:px-6 animate-in fade-in duration-500">
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
                            <h1 className="h2 text-dark100_light900 font-bold">Learning Analytics</h1>
                        </div>
                        <p className="body-2 text-dark500_light400 mt-0.5">Track your progress and review detailed metrics across your study sessions.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 border border-light-700 dark:border-dark-400 shadow-drop-1 hover:shadow-drop-3 hover:border-brand/40 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-brand/10 dark:bg-brand/20 rounded-2xl text-brand">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="subtitle-2 text-dark200_light800 font-bold">Study Time</span>
                            </div>
                            <span className="text-[11px] font-semibold text-light-200 dark:text-dark-400 uppercase tracking-wider">Total</span>
                        </div>
                        <div className="text-3xl font-extrabold text-dark100_light900 tracking-tight mt-2 group-hover:scale-[1.02] transition-transform origin-left">
                            {kpis.totalStudyHours}h {kpis.totalStudyMinutes}m
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-light-700/60 dark:border-dark-400/60 text-xs text-light-200 dark:text-dark-400">
                        <span>Active session hours</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 border border-light-700 dark:border-dark-400 shadow-drop-1 hover:shadow-drop-3 hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <span className="subtitle-2 text-dark200_light800 font-bold">Cards Reviewed</span>
                            </div>
                            <span className="text-[11px] font-semibold text-light-200 dark:text-dark-400 uppercase tracking-wider">All Time</span>
                        </div>
                        <div className="text-3xl font-extrabold text-dark100_light900 tracking-tight mt-2 group-hover:scale-[1.02] transition-transform origin-left">
                            {kpis.cardsReviewed.toLocaleString()}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-light-700/60 dark:border-dark-400/60 text-xs text-light-200 dark:text-dark-400">
                        <span>Flashcard interactions</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 border border-light-700 dark:border-dark-400 shadow-drop-1 hover:shadow-drop-3 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="subtitle-2 text-dark200_light800 font-bold">Average Accuracy</span>
                            </div>
                            <span className="text-[11px] font-semibold text-light-200 dark:text-dark-400 uppercase tracking-wider">Quiz Score</span>
                        </div>
                        <div className="text-3xl font-extrabold text-dark100_light900 tracking-tight mt-2 group-hover:scale-[1.02] transition-transform origin-left">
                            {Number(kpis.averageAccuracy).toFixed(1)}%
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-light-700/60 dark:border-dark-400/60 text-xs text-light-200 dark:text-dark-400">
                        <span>Overall quiz performance</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 border border-light-700 dark:border-dark-400 shadow-drop-1 hover:shadow-drop-3 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-2xl text-purple-600 dark:text-purple-400">
                                    <Award className="w-5 h-5" />
                                </div>
                                <span className="subtitle-2 text-dark200_light800 font-bold">Efficiency</span>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                🔥 {kpis.currentStreakDays}d streak
                            </span>
                        </div>
                        <div className="text-3xl font-extrabold text-dark100_light900 tracking-tight mt-2 group-hover:scale-[1.02] transition-transform origin-left">
                            {kpis.efficiencyScore}%
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-light-700/60 dark:border-dark-400/60 text-xs text-light-200 dark:text-dark-400">
                        <span>Study momentum</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-dark-200 rounded-3xl p-6 sm:p-8 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                            <div>
                                <h2 className="h3 font-bold text-dark100_light900">Accuracy Trend</h2>
                                <p className="body-2 text-light-200 dark:text-dark-400">Your average quiz precision over the past 14 days</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-light-800 dark:bg-dark-300 text-dark200_light800 border border-light-700 dark:border-dark-400 self-start sm:self-center">
                                14-Day Window
                            </span>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={accuracyTrend} margin={{ top: 10, right: 20, bottom: 5, left: -15 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f1117', borderRadius: '16px', border: '1px solid #334155', color: '#fff', padding: '12px 16px' }}
                                        formatter={(value) => [`${value}%`, 'Accuracy']}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="accuracy" 
                                        stroke="#10b981" 
                                        strokeWidth={3} 
                                        connectNulls={true}
                                        dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} 
                                        activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 sm:p-8 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col justify-between">
                    <div>
                        <h2 className="h3 font-bold text-dark100_light900 mb-1">Subject Mastery</h2>
                        <p className="body-2 text-light-200 dark:text-dark-400 mb-6">Proficiency level breakdown across topics</p>
                        
                        <div className="space-y-5">
                            {subjectMasteries.length > 0 ? (
                                subjectMasteries.map((sub) => (
                                    <div key={sub.subjectId} className="space-y-2">
                                        <div className="flex justify-between text-sm font-semibold">
                                            <span className="text-dark200_light800 line-clamp-1 pr-2">{sub.subjectName}</span>
                                            <span className="text-brand font-bold shrink-0">{Number(sub.masteryPercent).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-light-800 dark:bg-dark-300 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-brand rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.min(100, Math.max(0, sub.masteryPercent))}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center bg-light-800/50 dark:bg-dark-300/50 rounded-2xl border border-dashed border-light-700 dark:border-dark-400">
                                    <p className="text-sm font-medium text-light-200 dark:text-dark-400">No subject mastery data yet</p>
                                    <p className="text-xs text-light-200/80 dark:text-dark-400/80 mt-1">Complete study sessions to generate breakdown</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 sm:p-8 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-dark100_light900">Flashcards Volume</h2>
                                <p className="text-xs text-light-200 dark:text-dark-400 mt-1">Cards reviewed daily</p>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={flashcardVolumeTrend} margin={{ top: 10, right: 0, bottom: 5, left: -25 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                                        contentStyle={{ backgroundColor: '#0f1117', borderRadius: '16px', border: '1px solid #334155', color: '#fff', padding: '12px 16px' }}
                                        formatter={(value) => [value, 'Cards Reviewed']}
                                    />
                                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 sm:p-8 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-dark100_light900">Quiz Volume</h2>
                                <p className="text-xs text-light-200 dark:text-dark-400 mt-1">Quizzes completed daily</p>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={quizVolumeTrend} margin={{ top: 10, right: 0, bottom: 5, left: -25 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                                        contentStyle={{ backgroundColor: '#0f1117', borderRadius: '16px', border: '1px solid #334155', color: '#fff', padding: '12px 16px' }}
                                        formatter={(value) => [value, 'Quizzes Completed']}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-200 rounded-3xl p-6 sm:p-8 border border-light-700 dark:border-dark-400 shadow-drop-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-brand/10 dark:bg-brand/20 rounded-xl text-brand">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h2 className="h3 font-bold text-dark100_light900">AI Coaching</h2>
                            </div>
                            <span className="text-xs font-bold text-brand uppercase tracking-wider">Live Tips</span>
                        </div>
                        <p className="body-2 text-light-200 dark:text-dark-400 mb-6">Personalized study advice based on your retention metrics</p>

                        <div className="space-y-4">
                            {aiTips.length > 0 ? (
                                aiTips.map((tip, index) => {
                                    const isDanger = tip.severity === "danger" || tip.severity === "warning";
                                    return (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-2xl border transition-all ${
                                                isDanger
                                                    ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10 dark:bg-red-500/10 dark:border-red-500/30"
                                                    : "bg-brand/5 border-brand/20 hover:bg-brand/10 dark:bg-brand/10 dark:border-brand/30"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {isDanger ? (
                                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                ) : (
                                                    <TrendingUp className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className={`text-sm font-bold ${isDanger ? "text-red-600 dark:text-red-400" : "text-dark100_light900"}`}>
                                                        {tip.title}
                                                    </h3>
                                                    <p className={`text-xs mt-1 leading-relaxed ${isDanger ? "text-red-600/90 dark:text-red-300/90" : "text-light-200 dark:text-dark-400"}`}>
                                                        {tip.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-5 rounded-2xl bg-brand/5 dark:bg-brand/10 border border-brand/20">
                                    <div className="flex items-start gap-3.5">
                                        <TrendingUp className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-dark100_light900">Keep up the momentum</h3>
                                            <p className="text-xs text-light-200 dark:text-dark-400 mt-1 leading-relaxed">
                                                Continue reviewing flashcards and taking quizzes to generate more personalized AI coaching insights.
                                            </p>
                                            <Link href="/flashcards" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand mt-3 hover:underline">
                                                <span>Start Review now</span>
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Link
                        href="/analytics/insights"
                        className="w-full mt-8 py-3.5 bg-brand hover:bg-brand-100 text-white font-bold rounded-full flex items-center justify-center gap-2 shadow-drop-1 transition-all cursor-pointer text-sm"
                    >
                        <span>View Deep AI Insights</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
