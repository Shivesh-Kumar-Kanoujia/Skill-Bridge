'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#E3E2D9] bg-[#ECE8DD]/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-1 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#31594B] text-white flex items-center justify-center shadow-xs">
                <span className="font-serif font-bold text-sm">S</span>
              </div>
              <span className="font-serif font-bold text-lg text-[#31594B]">SkillBridge</span>
            </div>
            <p className="text-xs text-[#68716B] leading-relaxed">
              Find the right people. Build better projects. A structured, skill-first collaboration platform designed for university students, hackathons, and capstones.
            </p>
            <div className="text-[11px] text-[#8E9690] mt-2">
              Apex Institute of Technology • Student Tech Consortium
            </div>
          </div>

          {/* Navigation links */}
          <div>
            <h4 className="text-xs font-bold text-[#31594B] uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-[#68716B]">
              <li>
                <Link href="/projects" className="hover:text-[#31594B] transition-colors">
                  Discover Projects
                </Link>
              </li>
              <li>
                <Link href="/teammates" className="hover:text-[#31594B] transition-colors">
                  Find Teammates
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#31594B] transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/applications" className="hover:text-[#31594B] transition-colors">
                  Applications & Teams
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-[#31594B] uppercase tracking-wider mb-3">
              Project Categories
            </h4>
            <ul className="space-y-2 text-xs text-[#68716B]">
              <li>
                <Link href="/projects?category=Hackathon" className="hover:text-[#31594B] transition-colors">
                  Hackathon Squads
                </Link>
              </li>
              <li>
                <Link href="/projects?category=Capstone" className="hover:text-[#31594B] transition-colors">
                  Semester Capstones
                </Link>
              </li>
              <li>
                <Link href="/projects?category=Open+Source" className="hover:text-[#31594B] transition-colors">
                  Open Source Initiatives
                </Link>
              </li>
              <li>
                <Link href="/projects?category=Startup" className="hover:text-[#31594B] transition-colors">
                  Student Startups & Utilities
                </Link>
              </li>
            </ul>
          </div>

          {/* Principles & Architecture */}
          <div>
            <h4 className="text-xs font-bold text-[#31594B] uppercase tracking-wider mb-3">
              Design Principles
            </h4>
            <ul className="space-y-2 text-xs text-[#68716B]">
              <li>• Rule-based explainable match scores</li>
              <li>• Department & semester skill verification</li>
              <li>• Transparent role requirements & time commits</li>
              <li>• FastAPI backend & Azure SQL database</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#E3E2D9] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E9690] gap-3">
          <p>© 2026 SkillBridge. Integrated Full-Stack Project.</p>
          <div className="flex items-center gap-4">
            <span>SkillBridge v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
