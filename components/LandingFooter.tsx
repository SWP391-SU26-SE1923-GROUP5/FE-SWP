'use client';

import { BookOpen, GitBranch, Link as LinkIcon, Share2 } from 'lucide-react';
import Link from 'next/link';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: 'Tính năng', href: '#features' },
      { label: 'Bảng giá', href: '#pricing' },
      { label: 'Bảo mật', href: '#' },
      { label: 'Blog', href: '#' },
    ],
    Company: [
      { label: 'Về chúng tôi', href: '#' },
      { label: 'Liên hệ', href: '#contact' },
      { label: 'Sự nghiệp', href: '#' },
      { label: 'Báo chí', href: '#' },
    ],
    Legal: [
      { label: 'Điều khoản dịch vụ', href: '#' },
      { label: 'Chính sách bảo mật', href: '#' },
      { label: 'Chính sách cookie', href: '#' },
      { label: 'Quản lý tùy chọn', href: '#' },
    ],
  };

  const socialLinks = [
    { icon: Share2, href: '#', label: 'Twitter' },
    { icon: GitBranch, href: '#', label: 'GitHub' },
    { icon: LinkIcon, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg text-white">AIStudyHub</span>
            </div>
            <p className="text-sm text-gray-400">
              Nền tảng học tập thông minh, được hỗ trợ bởi AI để giúp bạn học hiệu quả hơn.
            </p>
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="text-gray-400 hover:text-emerald-400 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} AIStudyHub. Bản quyền được bảo vệ.
            </p>
            <p className="text-sm text-gray-400">
              Thiết kế với ❤️ cho những người yêu học tập.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
