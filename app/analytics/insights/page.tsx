import React from 'react';
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

export default async function AIInsightsPage() {
    const data = await getAnalyticsDashboard();
    const tips = data?.aiTips || [];

    return (
        <div className="flex flex-col gap-8 pb-20 pt-6 max-w-5xl mx-auto w-full px-5 sm:px-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-700 dark:border-dark-400 pb-5">
                <div className="flex items-center gap-3.5">
                    <Link
                        href="/analytics"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-dark-300 border border-light-700 dark:border-dark-400 shadow-xs hover:bg-light-800 dark:hover:bg-dark-400 text-dark300_light700 transition-all"
                        title="Back to Analytics"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="h2 text-dark100_light900 font-bold">All AI Recommendations</h1>
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand dark:bg-brand/20 border border-brand/20">
                                <Rocket className="w-3.5 h-3.5" />
                                SM-2 Engine
                            </span>
                        </div>
                        <p className="body-2 text-dark500_light400 mt-0.5">
                            AI-generated analysis and Spaced Repetition scheduling designed to optimize your study performance and quiz scores.
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full space-y-4">
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
    );
}