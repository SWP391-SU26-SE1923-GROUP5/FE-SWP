'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function LandingHeroSection() {
  return (
    <section id="home" className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-emerald-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full w-fit mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Powered by AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Smart Learning with{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                AI
              </span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              An AI-powered learning platform that helps you optimize your study process and achieve better results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white group rounded-lg"
                asChild
              >
                <Link href="/sign-up" className="flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 text-gray-900 hover:bg-gray-50 rounded-lg"
                asChild
              >
                <Link href="#features">Learn More</Link>
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-6 pt-8 border-t border-gray-200">
              <div>
                <p className="text-2xl font-bold text-gray-900">10K+</p>
                <p className="text-sm text-gray-600">Active Learners</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">4.8★</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-600">Free Trial</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-md">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 to-emerald-100 rounded-3xl opacity-20 blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-300 to-transparent rounded-3xl opacity-10 blur-2xl translate-x-8" />

              <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 flex flex-col items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                <Image 
                    src="/assets/images/dashboard-preview-v3.png"
                    alt="Dashboard interface"
                    width={800}
                    height={500}
                    className="w-full h-full object-cover"
                    priority
                />
                </div>

                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 max-w-xs border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <span className="text-emerald-600 font-bold text-sm">📊</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Learning Progress</p>
                      <p className="font-semibold text-gray-900">+45%</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 max-w-xs border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">🎯</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Today's Goal</p>
                      <p className="font-semibold text-gray-900">3 completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
