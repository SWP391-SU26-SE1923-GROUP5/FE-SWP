'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    ShieldAlert,
    Zap,
    Rocket,
    Trophy,
    GraduationCap,
    Compass,
    ArrowUpRight
} from 'lucide-react';
import { getAnalyticsDashboard } from '@/lib/actions/analytics.actions';
import { AiTipDto } from '@/types';

export default function AIInsightsPage() {
    const [tips, setTips] = useState<AiTipDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function fetchInsights() {
            setLoading(true);
            try {
                const data = await getAnalyticsDashboard();
                if (data && data.aiTips) {
                    setTips(data.aiTips);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchInsights();
    }, []);

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-[#10b981] border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen pb-16 pt-4 sm:pt-6 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="mb-8 pb-4 border-b border-light-700">
                    <Link
                        href="/analytics"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-light-700 text-dark-200 hover:text-[#10b981] hover:border-[#10b981] shadow-drop-3 font-semibold text-sm transition-all duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Analytics</span>
                    </Link>
                </div>

                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Rocket className="w-7 h-7 text-[#10b981]" />
                        <h1 className="h1 text-dark-200 tracking-tight">
                            All AI Recommendations
                        </h1>
                    </div>
                    <p className="body-1 text-slate-500 mt-1">
                        AI-generated analysis and Spaced Repetition scheduling designed to optimize your study performance and quiz scores.
                    </p>
                </div>

                <div className="space-y-4">
                    {tips.length > 0 ? (
                        tips.map((tip, index) => {
                            const sev = tip.severity?.toLowerCase() || '';
                            const titleLower = tip.title?.toLowerCase() || '';

                            let cardBg = 'bg-[#10b981]/5 border-[#10b981]/20 hover:bg-[#10b981]/10';
                            let titleColor = 'text-dark-200 font-bold';
                            let textColor = 'text-slate-600';
                            let iconNode = <Compass className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />;

                            if (sev === 'danger' || sev === 'error') {
                                cardBg = 'bg-rose-50/80 border-rose-200 hover:bg-rose-50';
                                titleColor = 'text-rose-900 font-bold';
                                textColor = 'text-rose-700/90';
                                iconNode = <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
                            } else if (sev === 'warning' || titleLower.includes('focus') || titleLower.includes('review')) {
                                cardBg = 'bg-amber-50/80 border-amber-200 hover:bg-amber-50';
                                titleColor = 'text-amber-900 font-bold';
                                textColor = 'text-amber-700/90';
                                iconNode = <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
                            } else if (titleLower.includes('streak') || titleLower.includes('mastery') || titleLower.includes('great')) {
                                iconNode = <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
                            } else if (titleLower.includes('quiz') || titleLower.includes('score')) {
                                iconNode = <GraduationCap className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />;
                            }

                            return (
                                <div
                                    key={index}
                                    className={`rounded-[20px] p-6 border shadow-drop-3 transition-all duration-200 flex items-start gap-4 ${cardBg}`}
                                >
                                    {iconNode}

                                    <div className="space-y-1.5 flex-1">
                                        <h3 className={`h4 ${titleColor}`}>
                                            {tip.title}
                                        </h3>

                                        <p className={`body-2 leading-relaxed ${textColor}`}>
                                            {tip.message}
                                        </p>

                                        {sev !== 'danger' && sev !== 'error' && (
                                            <div className="pt-2">
                                                <Link
                                                    href="/flashcards"
                                                    className="inline-flex items-center gap-1 font-bold text-sm text-[#10b981] hover:underline"
                                                >
                                                    <span>Start Review now</span>
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-[20px] p-8 border border-light-700 bg-white shadow-drop-3 text-center">
                            <Rocket className="w-8 h-8 text-[#10b981] mx-auto mb-3" />
                            <h3 className="h4 text-dark-200 font-bold">No AI Recommendations Yet</h3>
                            <p className="body-2 text-slate-500 mt-1 max-w-md mx-auto">
                                Complete more quizzes and upload study materials to receive tailored AI coaching tips and Spaced Repetition schedules.
                            </p>
                            <Link
                                href="/home"
                                className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 rounded-full bg-[#10b981] text-white font-bold text-sm shadow-drop-2 hover:bg-emerald-600 transition-all"
                            >
                                <span>Go to Home</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}