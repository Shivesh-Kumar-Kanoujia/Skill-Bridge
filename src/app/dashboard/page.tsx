'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { ApplyModal } from '@/components/shared/ApplyModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { calculateMatchScore } from '@/lib/matching';
import { Project } from '@/types';
import { 
  FolderKanban, 
  Send, 
  Mail, 
  Star, 
  Compass, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DashboardPage() {
  const { currentUser, projects, applications, invitations } = useSkillBridge();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [simulateNewUser, setSimulateNewUser] = useState(false);

  // Projects where current user is owner or team member
  const myActiveProjects = simulateNewUser 
    ? [] 
    : projects.filter(p => 
        p.ownerId === currentUser.id || 
        p.currentMembers.some(m => m.studentId === currentUser.id)
      );

  // Submitted applications
  const myApplications = simulateNewUser 
    ? [] 
    : applications.filter(a => a.applicantId === currentUser.id);

  // Invitations
  const myInvitations = simulateNewUser 
    ? [] 
    : invitations.filter(i => i.receiverId === currentUser.id);

  // Rule-based recommended projects (ranked by compatibility score)
  const rankedProjects = [...projects]
    .filter(p => p.ownerId !== currentUser.id)
    .map(p => ({
      project: p,
      match: calculateMatchScore(currentUser, p)
    }))
    .sort((a, b) => b.match.score - a.match.score);

  // Profile completion calculation
  let completionPoints = 0;
  if (currentUser.name) completionPoints += 20;
  if (currentUser.bio) completionPoints += 20;
  if (currentUser.skills.length >= 3) completionPoints += 25;
  if (currentUser.githubUrl || currentUser.portfolioUrl) completionPoints += 20;
  if (currentUser.completedProjects.length > 0) completionPoints += 15;
  const profileCompletion = Math.min(100, completionPoints);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col">
      <div className="flex gap-8">
        <AppSidebar />

        {/* Main Dashboard Content */}
        <main className="flex-1 py-8 flex flex-col gap-8 min-w-0">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E3E2D9]">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#31594B]">
                  Welcome back, {currentUser.name.split(' ')[0]}
                </h1>
                <Badge variant="sage" size="sm">
                  {currentUser.department.split('&')[0].trim()}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-[#68716B] mt-1">
                Explore recommended collaborations or track your active team requests.
              </p>
            </div>

            {/* View toggle for evaluation */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E3E2D9] shadow-2xs">
              <span className="text-xs text-[#8E9690]">View:</span>
              <button
                onClick={() => setSimulateNewUser(!simulateNewUser)}
                className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  simulateNewUser 
                    ? 'bg-[#31594B] text-white' 
                    : 'bg-[#ECE8DD] text-[#292F2B] hover:bg-[#E2DDD0]'
                }`}
              >
                {simulateNewUser ? 'New Student' : 'Active Student'}
              </button>
            </div>
          </div>

          {/* Profile Completion Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="p-5 rounded-2xl clay-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-bold text-[#292F2B]">Student Profile Strength</span>
                <span className="font-semibold text-[#31594B]">{profileCompletion}% Complete</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#ECE8DD] overflow-hidden">
                <div
                  className="h-full bg-[#31594B] rounded-full transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <p className="text-[11px] text-[#68716B] mt-2">
                Complete profiles with portfolio links receive 3.2x more teammate invitations.
              </p>
            </div>
            <Link href="/profile">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          </motion.div>

          {/* Key Metrics Overview (Tactile Clay Widgets) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="clay-widget p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8E9690] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Projects</span>
                <FolderKanban className="w-4 h-4 text-[#31594B]" />
              </div>
              <div className="text-2xl font-serif font-bold text-[#292F2B]">{myActiveProjects.length}</div>
              <div className="text-[11px] text-[#68716B] mt-1">Campus initiatives</div>
            </div>

            <div className="clay-widget p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8E9690] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Applications</span>
                <Send className="w-4 h-4 text-[#31594B]" />
              </div>
              <div className="text-2xl font-serif font-bold text-[#292F2B]">{myApplications.length}</div>
              <div className="text-[11px] text-[#68716B] mt-1">Pending reviews</div>
            </div>

            <div className="clay-widget p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8E9690] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Invitations</span>
                <Mail className="w-4 h-4 text-[#D99A62]" />
              </div>
              <div className="text-2xl font-serif font-bold text-[#292F2B]">{myInvitations.length}</div>
              <div className="text-[11px] text-[#68716B] mt-1">From coordinators</div>
            </div>

            <div className="clay-widget p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8E9690] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Reliability</span>
                <Star className="w-4 h-4 text-[#D99A62] fill-[#D99A62]" />
              </div>
              <div className="text-2xl font-serif font-bold text-[#292F2B]">{currentUser.stats.reliabilityRating}</div>
              <div className="text-[11px] text-[#68716B] mt-1">Peer feedback score</div>
            </div>
          </div>

          {/* Section: Recommended Projects (Rule-based matching) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#292F2B]">
                  Recommended For Your Skills
                </h2>
                <p className="text-xs text-[#68716B] mt-0.5">
                  Ranked by objective skill overlap and stated availability—not opaque ML.
                </p>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
                  Explore All
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rankedProjects.slice(0, 2).map(({ project }) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onApplyClick={(p) => setSelectedProject(p)}
                />
              ))}
            </div>
          </div>

          {/* Dual Column: My Active Projects / Empty State & Pending Applications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Active Projects */}
            <div className="clay-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ECE8DD]">
                  <h3 className="text-sm font-serif font-bold text-[#292F2B]">
                    My Active Teams & Projects
                  </h3>
                  <span className="text-xs text-[#8E9690]">{myActiveProjects.length} active</span>
                </div>

                {myActiveProjects.length === 0 ? (
                  <EmptyState
                    icon={FolderKanban}
                    title="No active projects yet"
                    description="You haven't joined or created a project this semester. Discover open hackathon squads and capstone teams."
                    actionLabel="Discover Projects"
                    onAction={() => window.location.href = '/projects'}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {myActiveProjects.map(proj => (
                      <div
                        key={proj.id}
                        className="p-3.5 rounded-xl border border-[#E3E2D9] bg-[#FAF8F5] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="category" size="sm">{proj.category}</Badge>
                            {proj.ownerId === currentUser.id && (
                              <Badge variant="forest" size="sm">Owner</Badge>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-[#292F2B] mt-1.5">
                            {proj.title}
                          </h4>
                          <p className="text-[11px] text-[#68716B] mt-0.5">
                            {proj.teamSize.current}/{proj.teamSize.max} members • Deadline: {proj.deadline}
                          </p>
                        </div>
                        <Link href={`/projects/${proj.id}`}>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Applications & Invitations */}
            <div className="clay-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ECE8DD]">
                  <h3 className="text-sm font-serif font-bold text-[#292F2B]">
                    Pending Applications & Invitations
                  </h3>
                  <Link href="/applications" className="text-xs font-semibold text-[#31594B] hover:underline">
                    View All
                  </Link>
                </div>

                {myApplications.length === 0 && myInvitations.length === 0 ? (
                  <EmptyState
                    icon={Send}
                    title="No pending requests"
                    description="You have no active applications or teammate invitations awaiting response."
                    actionLabel="Find Teammates"
                    onAction={() => window.location.href = '/teammates'}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {myInvitations.map(inv => (
                      <div
                        key={inv.id}
                        className="p-3.5 rounded-xl border border-[#F3E5D8] bg-[#FBF4EC] flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C5323]">
                            <Mail className="w-3.5 h-3.5" />
                            <span>Team Invitation from {inv.senderName}</span>
                          </div>
                          <p className="text-xs font-semibold text-[#292F2B] mt-1">
                            Role: {inv.role}
                          </p>
                          <p className="text-[11px] text-[#68716B] mt-0.5 line-clamp-1">
                            {inv.projectTitle}
                          </p>
                        </div>
                        <Link href="/applications">
                          <Button variant="secondary" size="sm">
                            Review
                          </Button>
                        </Link>
                      </div>
                    ))}

                    {myApplications.map(app => (
                      <div
                        key={app.id}
                        className="p-3.5 rounded-xl border border-[#E3E2D9] bg-[#FAF8F5] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F0F5EC] text-[#31594B]">
                              {app.status}
                            </span>
                            <span className="text-xs font-bold text-[#292F2B] truncate max-w-[180px]">
                              {app.projectTitle}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#68716B] mt-1">
                            Role: {app.roleApplied} • Match Score: {app.matchScore}%
                          </p>
                        </div>
                        <Link href="/applications">
                          <Button variant="outline" size="sm">
                            Status
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <ApplyModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
