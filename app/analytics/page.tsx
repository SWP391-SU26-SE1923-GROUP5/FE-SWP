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
    ChevronLeft,
    ChevronRight,
    ArrowUpRight
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
                console.error(error);
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

    const cardsReviewedTrend = (dashboardData?.cardsReviewedTrend || []).map(point => ({
        day: point.date,
        count: point.cardsCount
    }));

    const subjectMasteries = dashboardData?.subjectMasteries || [];
    const aiTips = dashboardData?.aiTips || [];

    if (loading) {
        return (
            <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 rounded-full border-4 border-[#10b981] border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex flex-col flex-1 h-full animate-in fade-in duration-500">
            <div className="mb-8">
                <Link
                    href="/home"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#10b981] transition-colors mb-4"
                >
                    <ChevronLeft className="h-4 w-4" /> Back to Home
                </Link>
                <h1 className="text-3xl font-bold text-dark-200 tracking-tight">
                    Learning Analytics
                </h1>
                <p className="text-slate-500 mt-2">
                    Track your progress and get AI-powered insights from your study sessions.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-[20px] p-6 border border-light-700 shadow-drop-3 hover:border-[#10b981] hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-[#10b981]/10 rounded-xl text-[#10b981]">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">Study Time</span>
                    </div>
                    <div className="text-3xl font-extrabold text-dark-200 tracking-tight">
                        {kpis.totalStudyHours}h {kpis.totalStudyMinutes}m
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">Total accumulated</div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-light-700 shadow-drop-3 hover:border-[#10b981] hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-[#10b981]/10 rounded-xl text-[#10b981]">
                            <Layers className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">Cards Reviewed</span>
                    </div>
                    <div className="text-3xl font-extrabold text-dark-200 tracking-tight">
                        {kpis.cardsReviewed}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">All time interactions</div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-light-700 shadow-drop-3 hover:border-[#10b981] hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-[#10b981]/10 rounded-xl text-[#10b981]">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">Accuracy</span>
                    </div>
                    <div className="text-3xl font-extrabold text-dark-200 tracking-tight">
                        {Number(kpis.averageAccuracy).toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">Average quiz score</div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-light-700 shadow-drop-3 hover:border-[#10b981] hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-[#10b981]/10 rounded-xl text-[#10b981]">
                            <Award className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500 font-medium text-sm">Efficiency</span>
                    </div>
                    <div className="text-3xl font-extrabold text-dark-200 tracking-tight">
                        {kpis.efficiencyScore}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">
                        {kpis.currentStreakDays} days streak
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white rounded-[20px] p-6 border border-light-700 shadow-drop-3 flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-dark-200 mb-6">Accuracy Trend (14 days)</h2>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={accuracyTrend} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f1117', borderRadius: '12px', border: 'none', color: '#fff' }} formatter={(value) => [`${value}%`, 'Accuracy']} />
                                    <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-light-700 shadow-drop-3 flex flex-col justify-between">
                    <h2 className="text-lg font-bold text-dark-200 mb-6">Subject Mastery</h2>
                    <div className="space-y-5 flex-1 flex flex-col justify-center">
                        {subjectMasteries.length > 0 ? (
                            subjectMasteries.map((sub) => (
                                <div key={sub.subjectId} className="space-y-2">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-dark-200">{sub.subjectName}</span>
                                        <span className="text-[#10b981] font-bold">{Number(sub.masteryPercent).toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#10b981] rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${sub.masteryPercent}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-4">No subject mastery data available</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[20px] p-6 border border-light-700 shadow-drop-3">
                    <h2 className="text-lg font-bold text-dark-200 mb-6">Cards Reviewed Per Day</h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cardsReviewedTrend} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0f1117', borderRadius: '12px', border: 'none', color: '#fff' }} formatter={(value) => [value, 'Cards Reviewed']} />
                                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-[20px] p-6 border border-light-700 shadow-drop-3 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-[#10b981]" />
                            <h2 className="text-lg font-bold text-dark-200">AI Recommendations</h2>
                        </div>

                        <div className="space-y-4">
                            {aiTips.length > 0 ? (
                                aiTips.map((tip, index) => {
                                    const isDanger = tip.severity === "danger" || tip.severity === "warning";
                                    return (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-xl border transition-all ${
                                                isDanger
                                                    ? "bg-red-50/80 border-red-100 hover:bg-red-50"
                                                    : "bg-[#10b981]/5 border-[#10b981]/20 hover:bg-[#10b981]/10"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {isDanger ? (
                                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <TrendingUp className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className={`text-sm font-bold ${isDanger ? "text-red-900" : "text-dark-200"}`}>
                                                        {tip.title}
                                                    </h3>
                                                    <p className={`text-xs mt-1 leading-relaxed ${isDanger ? "text-red-700/90" : "text-slate-600"}`}>
                                                        {tip.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 rounded-xl bg-[#10b981]/5 border border-[#10b981]/20">
                                    <div className="flex items-start gap-3">
                                        <TrendingUp className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-dark-200">Keep up the momentum</h3>
                                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                                Continue reviewing flashcards and taking quizzes to generate more personalized AI coaching insights.
                                            </p>
                                            <Link href="/flashcards" className="inline-flex items-center gap-1 text-xs font-bold text-[#10b981] mt-2.5 hover:underline">
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
                        className="w-full mt-6 py-3 bg-[#10b981] hover:bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center gap-2 shadow-drop-2 transition-all cursor-pointer"
                    >
                        <span>View All AI Insights</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}