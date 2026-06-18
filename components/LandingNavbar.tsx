'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, BookOpen } from 'lucide-react';

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">AIStudyHub</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-gray-700 hover:text-emerald-600 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              asChild
            >
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              asChild
            >
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>

          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-4 py-2 text-gray-700 hover:text-emerald-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="px-4 pt-3 border-t border-gray-200 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700"
                  asChild
                >
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  asChild
                >
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
