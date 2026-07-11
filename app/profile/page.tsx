'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Zap,
  CheckCircle2,
  Check,
  Sparkles,
  CreditCard,
  Database,
  Cpu,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CheckoutButton from '@/app/pricing/CheckoutButton';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { getMembershipTiers, getCurrentUserTier, createCheckoutSession } from '@/lib/actions/payment.actions';
import { getMyAchievements } from '@/lib/actions/profile.actions';
import { getMyStats } from '@/lib/actions/gamification.actions';
import { User, TierMembership, CurrentUserTier, AchievementDto, UserStatsResponseDto } from '@/types';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'subscription' | 'achievements'>('subscription');
  const [user, setUser] = useState<User | null>(null);
  const [currentTier, setCurrentTier] = useState<CurrentUserTier | null>(null);
  const [membershipTiers, setMembershipTiers] = useState<TierMembership[]>([]);
  const [achievements, setAchievements] = useState<AchievementDto[]>([]);
  const [userStats, setUserStats] = useState<UserStatsResponseDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);
      try {
        const [userData, myTierData, allTiersData, badgesData, statsData] = await Promise.all([
          getCurrentUser(),
          getCurrentUserTier(),
          getMembershipTiers(),
          getMyAchievements(),
          getMyStats()
        ]);

        if (userData) setUser(userData);
        if (myTierData) setCurrentTier(myTierData);
        if (Array.isArray(allTiersData)) setMembershipTiers(allTiersData);
        if (Array.isArray(badgesData)) setAchievements(badgesData);
        if (statsData) setUserStats(statsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, []);

  const handleUpgrade = async (tierId: string) => {
    setCheckoutLoading(tierId);
    try {
      await createCheckoutSession(tierId);
    } catch (error) {
      console.error(error);
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
        <div className="w-full min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-[#10b981] border-t-transparent animate-spin" />
        </div>
    );
  }

  const fullName = user?.fullName || 'Learner';
  const email = user?.email || 'learner@aistudyhub.com';
  const avatarChar = fullName.charAt(0).toUpperCase();
  const currentTierName = currentTier?.tierName || 'Free';
  const expireDateStr = currentTier?.tierExpireAt
      ? new Date(currentTier.tierExpireAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : 'No expiration';

  const storageLimit = currentTier?.storageLimitMb || 1024;
  const currentStorage = currentTier?.currentStorageMb || 0;
  const storagePercent = Math.min(Math.round((currentStorage / storageLimit) * 100), 100);

  const tokenLimit = currentTier?.aiTokens || 10000;
  const currentTokens = currentTier?.currentAiTokensUsed || 0;
  const tokenPercent = Math.min(Math.round((currentTokens / tokenLimit) * 100), 100);

  return (
      <div className="flex flex-col gap-8 pb-20 pt-6 max-w-7xl mx-auto w-full px-5 sm:px-6 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto w-full">
          {/* Top Navigation & Header Banner (Matching Trash/Analytics Pattern) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-700 dark:border-dark-400 pb-5 mb-8">
            <div className="flex items-center gap-3.5">
              <Link
                  href="/home"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-dark-300 border border-light-700 dark:border-dark-400 shadow-xs hover:bg-light-800 dark:hover:bg-dark-400 text-dark300_light700 transition-all"
                  title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="h2 text-dark100_light900 font-bold">Profile & Billing</h1>
                <p className="body-2 text-dark500_light400 mt-0.5">Manage your subscription, storage quotas, AI token usage, and earned badges.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-dark500_light400 uppercase tracking-wider bg-light-800 dark:bg-dark-300 px-3.5 py-2 rounded-xl border border-light-700 dark:border-dark-400">
              <Settings className="w-4 h-4 text-brand animate-spin-slow" />
              <span>Account Settings</span>
            </div>
          </div>

          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center text-2xl font-bold shadow-drop-3 shrink-0">
              {avatarChar}
            </div>
            <div>
              <h1 className="h2 text-dark-200 tracking-tight">{fullName}</h1>
              <p className="body-2 text-slate-500">{email}</p>
              <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                {currentTierName}
              </span>
              </div>
            </div>
          </div>

          {userStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-light-700 shadow-drop-3 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl mb-1">⚡</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Level</span>
                  <span className="h3 text-dark-200 font-extrabold mt-1">{userStats.currentLevel}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-light-700 shadow-drop-3 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl mb-1">🏆</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total XP</span>
                  <span className="h3 text-[#10b981] font-extrabold mt-1">{userStats.totalXp.toLocaleString()}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-light-700 shadow-drop-3 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl mb-1">🔥</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Streak</span>
                  <span className="h3 text-orange-500 font-extrabold mt-1">{userStats.currentStreak} Days</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-light-700 shadow-drop-3 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl mb-1">🎯</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Level</span>
                  <span className="h3 text-purple-600 font-extrabold mt-1">{userStats.xpToNextLevel.toLocaleString()} XP</span>
                </div>
              </div>
          )}

          <div className="bg-slate-100 p-1.5 rounded-full inline-flex gap-1 mb-8 shadow-inner border border-light-700">
            <button
                onClick={() => setActiveTab('subscription')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === 'subscription'
                        ? 'bg-[#10b981] text-white shadow-drop-2'
                        : 'text-slate-500 hover:text-dark-200'
                }`}
            >
              Subscription
            </button>
            <button
                onClick={() => setActiveTab('achievements')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === 'achievements'
                        ? 'bg-[#10b981] text-white shadow-drop-2'
                        : 'text-slate-500 hover:text-dark-200'
                }`}
            >
              Achievements ({achievements.filter(a => a.isUnlocked).length}/{achievements.length})
            </button>
          </div>

          {activeTab === 'subscription' && (
              <div className="space-y-8">
                <div className="bg-white border border-light-700 rounded-[20px] p-6 sm:p-8 shadow-drop-3">
                  <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#10b981]/10 text-[#10b981] rounded-xl">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Plan</span>
                        <h2 className="h2 text-dark-200">{currentTierName}</h2>
                        <p className="body-2 text-slate-500 mt-0.5">Expires: {expireDateStr}</p>
                      </div>
                    </div>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                  Active
                </span>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="flex items-center gap-2 text-dark-200 font-medium">
                      <Database className="w-4 h-4 text-[#10b981]" /> Storage
                    </span>
                        <span className="text-dark-200 font-bold">{currentStorage} / {storageLimit} MB</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#10b981] rounded-full transition-all duration-500" style={{ width: `${storagePercent}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="flex items-center gap-2 text-dark-200 font-medium">
                      <Cpu className="w-4 h-4 text-[#10b981]" /> AI Tokens
                    </span>
                        <span className="text-dark-200 font-bold">{currentTokens.toLocaleString()} / {tokenLimit.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#10b981] rounded-full transition-all duration-500" style={{ width: `${tokenPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="h3 text-dark-200 mb-4">Available Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {membershipTiers.length > 0 ? (
                        membershipTiers.map((tier, index) => {
                          const isPopular = index === 1;
                          const isFreePlan = !currentTier || currentTier.tierName.toLowerCase().includes("free");
                          const hasPaidPlan = !isFreePlan;
                          const isCurrentTier = tier.id === currentTier?.tierId || tier.tierName.toLowerCase() === currentTierName.toLowerCase();
                          const isUpgradeLocked = hasPaidPlan && !isCurrentTier;

                          const formattedPrice = tier.price && tier.price > 0
                              ? `${tier.price.toLocaleString('vi-VN')} VND`
                              : 'Free';
                          const storageStr = tier.storageLimitMb >= 1024
                              ? `${Math.round(tier.storageLimitMb / 1024)} GB`
                              : `${tier.storageLimitMb} MB`;

                          return (
                              <div
                                  key={tier.id}
                                  className={`relative flex flex-col p-8 rounded-[24px] bg-white transition-all duration-300 ${
                                      isPopular
                                          ? "ring-2 ring-brand shadow-drop-1 scale-105 z-10"
                                          : "border light-border shadow-sm hover:shadow-md"
                                  }`}
                              >
                                  {isPopular && (
                                      <div className="absolute top-0 inset-x-0 flex justify-center -mt-4">
                                          <span className="flex items-center justify-center gap-1 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                              <Sparkles className="h-3 w-3" /> Most Popular
                                          </span>
                                      </div>
                                  )}

                                  <div className="mb-6">
                                      <h3 className="text-2xl font-bold text-dark-100 mb-2">{tier.tierName}</h3>
                                      <div className="mt-2 mb-2 flex items-baseline gap-1">
                                          <span className="text-3xl font-extrabold text-dark-100">{formattedPrice}</span>
                                          {tier.price && tier.price > 0 && <span className="text-light-400 text-sm font-medium">/month</span>}
                                      </div>
                                      <p className="text-light-400 text-sm">Perfect for growing your knowledge base.</p>
                                  </div>

                                  <ul className="flex-1 space-y-4 mb-8">
                                      <li className="flex items-start gap-3">
                                          <div className="flex-shrink-0 mt-1">
                                              <Check className="h-5 w-5 text-brand" />
                                          </div>
                                          <span className="text-dark-200">
                                              <strong className="font-semibold text-dark-100">{storageStr}</strong> of secure cloud storage
                                          </span>
                                      </li>
                                      <li className="flex items-start gap-3">
                                          <div className="flex-shrink-0 mt-1">
                                              <Check className="h-5 w-5 text-brand" />
                                          </div>
                                          <span className="text-dark-200">
                                              <strong className="font-semibold text-dark-100">{tier.aiTokens.toLocaleString()}</strong> AI generation tokens
                                          </span>
                                      </li>
                                      <li className="flex items-start gap-3">
                                          <div className="flex-shrink-0 mt-1">
                                              <Check className="h-5 w-5 text-brand" />
                                          </div>
                                          <span className="text-dark-200">Priority email support</span>
                                      </li>
                                  </ul>

                                  {isCurrentTier ? (
                                      <Button disabled className="w-full h-[52px] rounded-full bg-light-300 text-light-400 font-bold opacity-100 cursor-default">
                                          Current Plan
                                      </Button>
                                  ) : isUpgradeLocked ? (
                                      <Button disabled className="w-full h-[52px] rounded-full bg-light-300 text-light-400 font-bold opacity-100 cursor-not-allowed">
                                          Upgrade Unavailable
                                      </Button>
                                  ) : (
                                      <CheckoutButton tierId={tier.id} isPopular={isPopular} />
                                  )}
                              </div>
                          );
                        })
                    ) : (
                        <div className="col-span-full bg-white border border-light-700 rounded-[20px] p-8 text-center text-slate-500 shadow-drop-3">
                          Loading membership plans...
                        </div>
                    )}
                  </div>
                </div>
              </div>
          )}

          {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.length > 0 ? (
                    achievements.map((item) => {
                      const target = item.targetValue || 1;
                      const progressPercent = Math.min(Math.round((item.currentProgress / target) * 100), 100);

                      return (
                          <div
                              key={item.id || item.code}
                              className={`bg-white rounded-[20px] p-6 transition-all duration-300 flex flex-col justify-between ${
                                  item.isUnlocked
                                      ? 'border-2 border-[#10b981]/50 shadow-drop-2 hover:scale-105'
                                      : 'border border-light-700 shadow-drop-3 hover:border-slate-300 hover:scale-105'
                              }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  <div
                                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                                          item.isUnlocked
                                              ? 'bg-[#10b981]/10 text-[#10b981] shadow-sm'
                                              : 'bg-slate-100 text-slate-400'
                                      }`}
                                  >
                                    <Trophy className="w-6 h-6" />
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <h3 className="h5 text-dark-200 font-bold">
                                        {item.title}
                                      </h3>
                                      {item.isUnlocked && (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                                  Unlocked
                                </span>
                                      )}
                                    </div>
                                    <p className="body-2 text-slate-500 mt-1 leading-snug">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>

                                <div className={`inline-flex items-center gap-1 text-sm font-bold shrink-0 px-3 py-1 rounded-full border ${
                                    item.isUnlocked
                                        ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  <Zap className="w-4 h-4 fill-current" />
                                  <span>{item.xpReward}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6">
                              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                        item.isUnlocked ? 'bg-[#10b981]' : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                                <span>{item.currentProgress} / {target}</span>
                                <span className="text-dark-200 font-semibold">{progressPercent}%</span>
                              </div>
                            </div>
                          </div>
                      );
                    })
                ) : (
                    <div className="col-span-full bg-white border border-light-700 rounded-[20px] p-12 text-center shadow-drop-3">
                      <Trophy className="w-10 h-10 text-[#10b981] mx-auto mb-3 opacity-80" />
                      <h3 className="h4 text-dark-200 font-bold">No achievements found</h3>
                      <p className="body-2 text-slate-500 mt-1">Start reviewing flashcards and submitting quizzes to unlock your first trophy!</p>
                    </div>
                )}
              </div>
          )}
        </div>
      </div>
  );
}