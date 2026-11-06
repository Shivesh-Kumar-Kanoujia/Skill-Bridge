'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { 
  LayoutDashboard, 
  Compass, 
  Users, 
  FileText, 
  UserCircle, 
  ShieldCheck
} from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, applications, invitations } = useSkillBridge();

  const pendingCount = applications.filter(
    a => a.applicantId === currentUser.id && a.status === 'Pending'
  ).length + invitations.filter(
    i => i.receiverId === currentUser.id && i.status === 'Pending'
  ).length;

  const links = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Discover Projects', href: '/projects', icon: Compass },
    { label: 'Find Teammates', href: '/teammates', icon: Users },
    { 
      label: 'Applications & Teams', 
      href: '/applications', 
      icon: FileText,
      badge: pendingCount > 0 ? pendingCount : undefined 
    },
    { label: 'My Student Profile', href: '/profile', icon: UserCircle },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-6 py-6 pr-6 border-r border-[#E3E2D9] min-h-[calc(100vh-4rem)]">
      {/* Student Mini Card */}
      <div className="p-4 rounded-xl clay-widget">
        <div className="flex items-center gap-3">
          <img
            src={getAvatarUrl(currentUser.avatar, currentUser.name)}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#D8E3D0] shadow-2xs"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-serif font-bold text-[#292F2B] truncate">
              {currentUser.name}
            </h4>
            <p className="text-[11px] text-[#68716B] truncate">
              {currentUser.department}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#ECE8DD] flex items-center justify-between text-xs">
          <span className="text-[#8E9690]">Availability:</span>
          <span className="font-semibold text-[#31594B]">{currentUser.availability.hoursPerWeek}h / week</span>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex flex-col gap-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#31594B] text-white shadow-xs font-semibold'
                  : 'text-[#68716B] hover:text-[#31594B] hover:bg-white hover:border hover:border-[#E3E2D9]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8E9690]'}`} />
                <span>{link.label}</span>
              </div>
              {link.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-[#D99A62] text-white' : 'bg-[#D8E3D0] text-[#31594B]'
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Campus Guidelines / Status Box */}
      <div className="mt-auto p-4 rounded-xl bg-[#F0F5EC] border border-[#D8E3D0] text-xs text-[#31594B] shadow-2xs">
        <div className="flex items-center gap-2 font-serif font-bold mb-1">
          <ShieldCheck className="w-4 h-4 text-[#31594B]" />
          <span>Campus Verified</span>
        </div>
        <p className="text-[11px] text-[#68716B] leading-relaxed">
          Students collaborate under the academic honesty and project guidelines of Apex Institute.
        </p>
      </div>
    </aside>
  );
}
