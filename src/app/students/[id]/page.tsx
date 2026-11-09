'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { InviteModal } from '@/components/shared/InviteModal';
import { MatchBadge } from '@/components/shared/MatchBadge';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { calculateStudentToStudentMatch } from '@/lib/matching';
import { 
  ArrowLeft, 
  Star, 
  Globe, 
  MailPlus, 
  Sparkles
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';
import { motion } from 'motion/react';
import { getAvatarUrl } from '@/lib/utils';

function StudentDetailContent() {
  const params = useParams();
  const { students, currentUser } = useSkillBridge();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const studentId = params.id as string;
  const student = students.find(s => s.id === studentId);

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-serif font-bold text-[#292F2B]">Student Profile Not Found</h2>
        <p className="text-xs text-[#68716B] mt-2">
          The requested student profile could not be located in the campus directory.
        </p>
        <Link href="/teammates" className="mt-6 inline-block">
          <Button variant="primary" size="sm">
            Back to Teammates Directory
          </Button>
        </Link>
      </div>
    );
  }

  const isSelf = currentUser.id === student.id;
  const match = calculateStudentToStudentMatch(currentUser, student);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col gap-8">
      {/* Back button */}
      <div>
        <Link
          href="/teammates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#68716B] hover:text-[#31594B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Teammate Directory</span>
        </Link>
      </div>

      {/* Main Student Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="clay-card p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <img
              src={getAvatarUrl(student.avatar, student.name)}
              alt={student.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-[#D8E3D0] shrink-0 shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#292F2B]">
                  {student.name}
                </h1>
                {isSelf && <Badge variant="sage">Your Profile</Badge>}
              </div>

              <p className="text-sm font-semibold text-[#31594B] mt-1">
                {student.headline}
              </p>
              <p className="text-xs text-[#68716B] mt-1">
                Semester {student.semester} • {student.department} {student.college ? `• ${student.college}` : ''}
              </p>

              {/* External Links */}
              <div className="mt-4 flex items-center gap-3 text-xs text-[#68716B]">
                {student.githubUrl && (
                  <a
                    href={student.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-[#31594B] transition-colors"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
                {student.linkedinUrl && (
                  <a
                    href={student.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-[#31594B] transition-colors"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {student.portfolioUrl && (
                  <a
                    href={student.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:text-[#31594B] transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action / Match Box */}
          <div className="lg:w-72 shrink-0 bg-[#FAF8F5] p-5 rounded-2xl border border-[#E3E2D9] shadow-2xs flex flex-col gap-4">
            {!isSelf && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8E9690]">Collaboration Fit:</span>
                <MatchBadge match={match} />
              </div>
            )}

            <div className="text-xs text-[#68716B] border-t border-[#ECE8DD] pt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className="font-semibold text-[#31594B]">{student.availability.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Time Commitment:</span>
                <span className="font-semibold text-[#292F2B]">{student.availability.hoursPerWeek} hrs / week</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reliability Rating:</span>
                <span className="font-semibold text-[#D99A62] flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#D99A62]" />
                  {student.stats.reliabilityRating} / 5.0
                </span>
              </div>
            </div>

            {isSelf ? (
              <Link href="/profile">
                <Button variant="primary" size="md" className="w-full">
                  Edit My Profile
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsInviteModalOpen(true)}
                className="w-full"
                leftIcon={<MailPlus className="w-4 h-4" />}
              >
                Invite to Project
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Two Columns: Left (Bio, Past Projects) / Right (Skills, Interests) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Personal Bio */}
          <div className="clay-card p-6">
            <h2 className="text-base font-serif font-bold text-[#292F2B] uppercase tracking-wider mb-3 border-b border-[#ECE8DD] pb-2">
              About
            </h2>
            <p className="text-sm text-[#68716B] leading-relaxed">
              {student.bio}
            </p>
            {student.availability.note && (
              <div className="mt-4 p-3 rounded-xl bg-[#FAF8F5] border border-[#E3E2D9] text-xs text-[#68716B]">
                <span className="font-semibold text-[#292F2B]">Availability Note: </span>
                {student.availability.note}
              </div>
            )}
          </div>

          {/* Previous Completed Projects */}
          <div className="clay-card p-6">
            <h2 className="text-base font-serif font-bold text-[#292F2B] uppercase tracking-wider mb-4 border-b border-[#ECE8DD] pb-3">
              Portfolio & Previous Projects ({student.completedProjects.length})
            </h2>

            <div className="flex flex-col gap-4">
              {student.completedProjects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E3E2D9] bg-[#FAF8F5] flex flex-col gap-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-serif font-bold text-[#292F2B]">
                      {proj.title}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#D8E3D0] text-[#31594B] border border-[#C8D9C2]/60">
                      {proj.role}
                    </span>
                  </div>
                  <p className="text-xs text-[#68716B] leading-relaxed">
                    {proj.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {proj.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#ECE8DD] text-[#292F2B] border border-[#E3E2D9]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Skills & Interests */}
        <div className="flex flex-col gap-6">
          {/* Skills with Proficiency */}
          <div className="clay-card p-5">
            <h3 className="text-xs font-serif font-bold text-[#292F2B] uppercase tracking-wider mb-4 border-b border-[#ECE8DD] pb-2">
              Verified Technical Skills
            </h3>

            <div className="flex flex-col gap-2.5">
              {student.skills.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#FAF8F5] border border-[#E3E2D9]/70"
                >
                  <span className="font-semibold text-[#292F2B]">{s.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    s.level === 'Advanced'
                      ? 'bg-[#31594B] text-white shadow-2xs'
                      : s.level === 'Intermediate'
                      ? 'bg-[#D8E3D0] text-[#31594B] border border-[#C8D9C2]/60'
                      : 'bg-[#ECE8DD] text-[#68716B]'
                  }`}>
                    {s.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interests & Preferred Roles */}
          <div className="clay-card p-5">
            <h3 className="text-xs font-serif font-bold text-[#292F2B] uppercase tracking-wider mb-3">
              Preferred Roles
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {student.preferredRoles.map((role) => (
                <Badge key={role} variant="category">
                  {role}
                </Badge>
              ))}
            </div>

            <h3 className="text-xs font-serif font-bold text-[#292F2B] uppercase tracking-wider mb-3 border-t border-[#ECE8DD] pt-4">
              Areas of Interest
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {student.interests.map((interest) => (
                <span
                  key={interest}
                  className="text-xs px-2.5 py-1 rounded-md bg-[#F0F5EC] text-[#31594B] border border-[#D8E3D0]"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <InviteModal
        student={student}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <React.Suspense fallback={<div className="max-w-5xl mx-auto p-8 text-xs text-[#68716B]">Loading student profile...</div>}>
      <StudentDetailContent />
    </React.Suspense>
  );
}
