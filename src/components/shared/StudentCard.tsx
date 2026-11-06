'use client';

import React from 'react';
import Link from 'next/link';
import { Student } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MatchBadge } from './MatchBadge';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { calculateStudentToStudentMatch } from '@/lib/matching';
import { Star, MailPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { getAvatarUrl } from '@/lib/utils';

interface StudentCardProps {
  student: Student;
  onInviteClick?: (student: Student) => void;
}

export function StudentCard({ student, onInviteClick }: StudentCardProps) {
  const { currentUser } = useSkillBridge();
  const isSelf = currentUser.id === student.id;
  const match = calculateStudentToStudentMatch(currentUser, student);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="clay-card p-5 sm:p-6 flex flex-col justify-between group"
    >
      <div>
        {/* Top: Avatar, Name, Match */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={getAvatarUrl(student.avatar, student.name)}
              alt={student.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#D8E3D0] shadow-2xs"
            />
            <div>
              <Link href={`/students/${student.id}`} className="group-hover:text-[#31594B] transition-colors">
                <h3 className="text-base font-serif font-bold text-[#292F2B] leading-tight">
                  {student.name}
                </h3>
              </Link>
              <p className="text-xs text-[#68716B] mt-0.5">
                Sem {student.semester} • {student.department.split('&')[0].trim()}
              </p>
            </div>
          </div>

          {!isSelf && (
            <MatchBadge match={match} />
          )}
          {isSelf && (
            <Badge variant="sage">You</Badge>
          )}
        </div>

        {/* Headline & bio snippet */}
        <p className="text-xs font-semibold text-[#31594B] mt-1 leading-snug">
          {student.headline}
        </p>
        <p className="text-xs text-[#68716B] mt-2 line-clamp-2 leading-relaxed">
          {student.bio}
        </p>

        {/* Availability & Rating */}
        <div className="mt-3.5 flex items-center gap-3 text-xs text-[#68716B]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F0F5EC] border border-[#D8E3D0] text-[11px] font-medium text-[#31594B]">
            {student.availability.status} · {student.availability.hoursPerWeek}h/wk
          </span>
          <span className="text-[11px] text-[#68716B] flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-[#D99A62] fill-[#D99A62]" />
            {student.stats.reliabilityRating} Rating
          </span>
        </div>

        {/* Top Skills */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {student.skills.slice(0, 4).map((skill) => (
            <span
              key={skill.name}
              className="text-[11px] px-2 py-0.5 rounded-md bg-[#ECE8DD] text-[#292F2B] border border-[#E3E2D9]"
            >
              {skill.name}
              <span className="ml-1 text-[10px] text-[#8E9690]">
                {skill.level === 'Advanced' ? '★' : ''}
              </span>
            </span>
          ))}
          {student.skills.length > 4 && (
            <span className="text-[10px] text-[#8E9690] self-center">
              +{student.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-4 border-t border-[#E3E2D9] flex items-center justify-between gap-2">
        <Link href={`/students/${student.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View Profile
          </Button>
        </Link>
        {!isSelf && onInviteClick && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onInviteClick(student)}
            leftIcon={<MailPlus className="w-3.5 h-3.5" />}
          >
            Invite
          </Button>
        )}
      </div>
    </motion.div>
  );
}
