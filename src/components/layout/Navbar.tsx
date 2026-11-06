'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { Button } from '@/components/ui/Button';
import { PillNav, PillNavItem } from '@/components/ui/PillNav';
import { 
  Compass, 
  Users, 
  LayoutDashboard, 
  FileText, 
  User, 
  LogOut
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, logout, applications } = useSkillBridge();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pendingAppsCount = applications.filter(
    a => (a.applicantId === currentUser.id && a.status === 'Pending') ||
         (a.projectId === 'proj-5' && a.status === 'Pending')
  ).length;

  // Navigation routes mapped to actual dashboard pages
  const navItems: PillNavItem[] = isAuthenticated
    ? [
        { 
          label: 'Dashboard', 
          href: '/dashboard', 
          icon: <LayoutDashboard className="w-4 h-4" /> 
        },
        { 
          label: 'Discover Projects', 
          href: '/projects', 
          icon: <Compass className="w-4 h-4" /> 
        },
        { 
          label: 'Find Teammates', 
          href: '/teammates', 
          icon: <Users className="w-4 h-4" /> 
        },
        { 
          label: 'Applications', 
          href: '/applications', 
          icon: <FileText className="w-4 h-4" />,
          badge: pendingAppsCount > 0 ? pendingAppsCount : undefined
        },
        { 
          label: 'My Profile', 
          href: '/profile', 
          icon: <User className="w-4 h-4" /> 
        },
      ]
    : [
        { 
          label: 'Discover Projects', 
          href: '/projects', 
          icon: <Compass className="w-4 h-4" /> 
        },
        { 
          label: 'Find Teammates', 
          href: '/teammates', 
          icon: <Users className="w-4 h-4" /> 
        },
      ];

  // Mobile menu footer actions
  const panelFooter = isAuthenticated ? (
    <div className="flex items-center justify-between p-2.5 bg-[#F4F1E8] rounded-xl border border-[#E3E2D9]">
      <Link href="/profile" className="flex items-center gap-2.5 min-w-0">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full object-cover border border-[#D8E3D0] shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-[#292F2B] truncate leading-tight">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-[#68716B] truncate">
            Sem {currentUser.semester} • {currentUser.department.split(' ')[0]}
          </span>
        </div>
      </Link>
      <button
        onClick={logout}
        title="Sign out"
        className="p-2 text-[#8E9690] hover:text-[#B5473C] hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
        aria-label="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-2 pt-1">
      <Link href="/login" className="w-full">
        <Button variant="outline" size="sm" className="w-full">
          Sign In
        </Button>
      </Link>
      <Link href="/signup" className="w-full">
        <Button variant="primary" size="sm" className="w-full">
          Create Free Account
        </Button>
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-[#F4F1E8]/95 backdrop-blur-md border-b border-[#E3E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Main PillNav Navigation */}
          <PillNav
            logo={
              <div 
                className="w-[22px] h-[22px] rounded-[6px] bg-[#31594B] text-white flex items-center justify-center shadow-2xs font-serif font-bold text-xs select-none"
                title="SkillBridge"
              >
                S
              </div>
            }
            logoHref="/"
            logoAlt="SkillBridge Home"
            items={navItems}
            activeHref={pathname}
            linkComponent={Link}
            theme="light"
            layout="split"
            itemStyle="pill"
            hoverEffect="fill"
            indicator="dot"
            surface="solid"
            size="md"
            highlightColor="#31594B"
            highlightTextColor="#FFFFFF"
            barColor="#FFFFFF"
            textColor="#292F2B"
            collapse="auto"
            onCollapseChange={setIsCollapsed}
            panelFooter={panelFooter}
            className="flex-1 min-w-0"
          />

          {/* Desktop Right Side User / Auth Controls */}
          {!isCollapsed && (
            <div className="hidden md:flex items-center gap-3 shrink-0 ml-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 p-1 pl-1.5 pr-3 rounded-full border border-[#E3E2D9] bg-white hover:border-[#CAD8C1] hover:shadow-2xs transition-all text-left"
                    title="View My Profile"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover border border-[#D8E3D0]"
                    />
                    <div className="hidden lg:flex flex-col">
                      <span className="text-xs font-semibold text-[#292F2B] leading-tight">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-[#68716B]">
                        Sem {currentUser.semester} • {currentUser.department.split(' ')[0]}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    title="Sign out"
                    className="p-2 text-[#8E9690] hover:text-[#292F2B] hover:bg-white rounded-full border border-transparent hover:border-[#E3E2D9] transition-all cursor-pointer"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="primary" size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
