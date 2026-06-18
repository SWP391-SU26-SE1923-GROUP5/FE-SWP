'use client';

import { Brain, MessageSquare, BarChart3, Zap } from 'lucide-react';

const features = [
  {
    id: 1,
    icon: Brain,
    title: 'Personalized Learning',
    description: 'AI analyzes your learning style and adjusts content to match your pace and learning preferences.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    icon: MessageSquare,
    title: 'AI Support 24/7',
    description: 'Get instant answers to any question. Our AI assistant is always ready to help you understand difficult concepts.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 3,
    icon: BarChart3,
    title: 'Detailed Progress Tracking',
    description: 'Track your learning progress in detail with visual charts and personalized recommendations.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 4,
    icon: Zap,
    title: 'More Effective Learning',
    description: 'Save time with optimized lessons, smart flashcards, and AI-generated quizzes.',
    gradient: 'from-amber-500 to-orange-500',
  },
];

export default function LandingFeaturesSection() {
  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Highlighted Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover powerful features designed to help you learn more effectively and achieve your goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group rounded-xl bg-white border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>

                <div className={`mt-4 h-1 w-0 bg-gradient-to-r ${feature.gradient} group-hover:w-8 transition-all duration-300`} />
              </div>
            );
          })}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">500+</div>
            <p className="text-gray-600">Available Courses</p>
          </div>
          <div className="text-center border-l border-r border-gray-200">
            <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
            <p className="text-gray-600">Supported Topics</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">AI</div>
            <p className="text-gray-600">Cutting-Edge Technology</p>
          </div>
        </div>
      </div>
    </section>
  );
}
