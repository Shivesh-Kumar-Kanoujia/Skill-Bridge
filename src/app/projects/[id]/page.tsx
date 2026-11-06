'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { ApplyModal } from '@/components/shared/ApplyModal';
import { MatchBadge } from '@/components/shared/MatchBadge';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { calculateMatchScore } from '@/lib/matching';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Check, 
  AlertCircle,
  Share2,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { projects, currentUser, applications } = useSkillBridge();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const projectId = params.id as string;
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-serif font-bold text-[#292F2B]">Project Not Found</h2>
        <p className="text-xs text-[#68716B] mt-2">
          The requested project does not exist or may have completed recruitment.
        </p>
        <Link href="/projects" className="mt-6 inline-block">
          <Button variant="primary" size="sm">
            Back to All Projects
          </Button>
        </Link>
      </div>
    );
  }

  const match = calculateMatchScore(currentUser, project);
  const existingApp = applications.find(
    a => a.projectId === project.id && a.applicantId === currentUser.id && a.status !== 'Withdrawn'
  );
  const isOwner = project.ownerId === currentUser.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col gap-8">
      {/* Back button & Category */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68716B] hover:text-[#31594B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="category">{project.category}</Badge>
          <span className="text-xs font-semibold text-[#31594B] px-2.5 py-0.5 rounded-md bg-[#D8E3D0] border border-[#C8D9C2]/60">
            {project.status}
          </span>
        </div>
      </div>

      {/* Main Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="clay-card p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#292F2B] leading-tight">
              {project.title}
            </h1>
            <p className="text-sm sm:text-base text-[#68716B] mt-2.5 leading-relaxed">
              {project.tagline}
            </p>

            {/* Coordinator Info */}
            <div className="mt-6 flex items-center gap-3.5 pt-6 border-t border-[#ECE8DD]">
              <img
                src={project.ownerAvatar}
                alt={project.ownerName}
                className="w-11 h-11 rounded-full object-cover border-2 border-[#D8E3D0] shadow-2xs"
              />
              <div>
                <p className="text-xs font-serif font-bold text-[#292F2B]">
                  Coordinated by {project.ownerName}
                </p>
                <p className="text-xs text-[#68716B]">
                  {project.ownerDepartment} • Apex Institute of Technology
                </p>
              </div>
            </div>
          </div>

          {/* Action Box / Application State */}
          <div className="lg:w-72 shrink-0 bg-[#FAF8F5] p-5 rounded-2xl border border-[#E3E2D9] shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8E9690]">Your Fit:</span>
              <MatchBadge match={match} />
            </div>

            <div className="text-xs text-[#68716B] border-t border-[#ECE8DD] pt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Team Spots:</span>
                <span className="font-semibold text-[#292F2B]">
                  {project.teamSize.current} / {project.teamSize.max} Filled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duration:</span>
                <span className="font-semibold text-[#292F2B]">{project.duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Deadline:</span>
                <span className="font-semibold text-[#292F2B]">{project.deadline}</span>
              </div>
            </div>

            {isOwner ? (
              <div className="p-2.5 rounded-xl bg-[#EAF0E8] text-[#31594B] text-xs font-semibold text-center border border-[#C8D9C2]">
                You are the project coordinator
              </div>
            ) : existingApp ? (
              <div className="p-3 rounded-xl bg-white border border-[#E3E2D9] flex flex-col gap-1 text-center shadow-2xs">
                <span className="text-xs font-bold text-[#31594B]">Application {existingApp.status}</span>
                <span className="text-[11px] text-[#68716B]">Applied for {existingApp.roleApplied}</span>
                <Link href="/applications" className="mt-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View in Applications
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsApplyModalOpen(true)}
                className="w-full"
              >
                Apply to Project
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Two Column Details: Left (Description, Roles) / Right (Match Breakdown, Members) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Detailed Scope & Open Roles */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Detailed Project Scope */}
          <div className="clay-card p-6">
            <h2 className="text-base font-serif font-bold text-[#292F2B] uppercase tracking-wider mb-4 border-b border-[#ECE8DD] pb-3">
              Project Description & Objectives
            </h2>
            <div className="text-sm text-[#68716B] leading-relaxed whitespace-pre-line space-y-4">
              {project.description}
            </div>
          </div>

          {/* Open Roles & Deliverables */}
          <div className="clay-card p-6">
            <h2 className="text-base font-serif font-bold text-[#292F2B] uppercase tracking-wider mb-4 border-b border-[#ECE8DD] pb-3">
              Open Roles & Technical Requirements
            </h2>

            <div className="flex flex-col gap-4">
              {project.openRoles.map((role) => (
                <div
                  key={role.id}
                  className="p-4 rounded-xl border border-[#E3E2D9] bg-[#FAF8F5] flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-serif font-bold text-[#292F2B]">
                        {role.title}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#D8E3D0] text-[#31594B] border border-[#C8D9C2]/50">
                        {role.spots - role.filled} spot open
                      </span>
                    </div>
                    <p className="text-xs text-[#68716B] mt-1.5 leading-relaxed">
                      {role.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {role.skills.map((s) => (
                        <span
                          key={s}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-[#ECE8DD] text-[#292F2B] border border-[#E3E2D9] font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!isOwner && !existingApp && (
                    <div className="pt-2 border-t border-[#ECE8DD] flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsApplyModalOpen(true)}
                      >
                        Apply for this Role
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Match Breakdown & Current Team */}
        <div className="flex flex-col gap-6">
          {/* Match Score Explanation Card */}
          <div className="clay-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#31594B]" />
              <h3 className="text-xs font-serif font-bold text-[#31594B] uppercase tracking-wider">
                Compatibility Breakdown
              </h3>
            </div>
            <p className="text-xs text-[#68716B] leading-relaxed">
              SkillBridge estimates match compatibility based purely on overlapping technical proficiencies and stated availability.
            </p>

            <div className="mt-4 pt-3 border-t border-[#ECE8DD] flex flex-col gap-2.5 text-xs">
              <div>
                <span className="font-semibold text-[#292F2B] block mb-1">
                  Matched Skills ({match.matchedSkills.length}/{project.requiredSkills.length}):
                </span>
                <div className="flex flex-wrap gap-1">
                  {match.matchedSkills.length > 0 ? (
                    match.matchedSkills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-[#D8E3D0] text-[#31594B] text-[11px] font-semibold flex items-center gap-1 border border-[#C8D9C2]/60">
                        <Check className="w-3 h-3" /> {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#8E9690]">No exact matches yet</span>
                  )}
                </div>
              </div>

              {match.missingSkills.length > 0 && (
                <div className="mt-1">
                  <span className="text-[#8E9690] block mb-1">Skills to cover or learn:</span>
                  <div className="flex flex-wrap gap-1">
                    {match.missingSkills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-[#ECE8DD] text-[#68716B] text-[11px] border border-[#E3E2D9]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Current Team Members */}
          <div className="clay-card p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#ECE8DD]">
              <h3 className="text-xs font-serif font-bold text-[#292F2B] uppercase tracking-wider">
                Current Team ({project.currentMembers.length})
              </h3>
              <Users className="w-4 h-4 text-[#8E9690]" />
            </div>

            <div className="flex flex-col gap-3">
              {project.currentMembers.map((member) => (
                <div key={member.studentId} className="flex items-center gap-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#D8E3D0] shadow-2xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-serif font-bold text-[#292F2B] truncate">
                      {member.name} {member.isOwner && <span className="text-[10px] text-[#31594B] font-normal">(Coordinator)</span>}
                    </p>
                    <p className="text-[11px] text-[#68716B] truncate">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ApplyModal
        project={project}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <React.Suspense fallback={<div className="max-w-5xl mx-auto p-8 text-xs text-[#68716B]">Loading project details...</div>}>
      <ProjectDetailContent />
    </React.Suspense>
  );
}
