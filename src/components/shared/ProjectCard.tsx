'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MatchBadge } from './MatchBadge';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { calculateMatchScore } from '@/lib/matching';
import { Users, Clock, Calendar, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectCardProps {
  project: Project;
  onApplyClick?: (project: Project) => void;
}

export function ProjectCard({ project, onApplyClick }: ProjectCardProps) {
  const { currentUser, applications } = useSkillBridge();
  const match = calculateMatchScore(currentUser, project);

  const hasApplied = applications.some(
    a => a.projectId === project.id && a.applicantId === currentUser.id && a.status !== 'Withdrawn'
  );

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`p-5 sm:p-6 flex flex-col justify-between group ${
        project.featured ? 'clay-card-featured' : 'clay-card'
      }`}
    >
      <div>
        {/* Top Header: Category & Match estimate */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="category">{project.category}</Badge>
            {project.featured && (
              <Badge variant="amber" size="sm">Featured</Badge>
            )}
            {hasApplied && (
              <Badge variant="forest" size="sm">Applied</Badge>
            )}
          </div>
          <MatchBadge match={match} />
        </div>

        {/* Title and tagline */}
        <Link href={`/projects/${project.id}`} className="group-hover:text-[#31594B] transition-colors">
          <h3 className="text-base sm:text-lg font-serif font-bold text-[#292F2B] leading-snug">
            {project.title}
          </h3>
        </Link>
        <p className="text-xs sm:text-sm text-[#68716B] mt-2 line-clamp-2 leading-relaxed">
          {project.tagline}
        </p>

        {/* Required Skills tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.requiredSkills.slice(0, 4).map((skill) => {
            const isMatched = match.matchedSkills.includes(skill);
            return (
              <span
                key={skill}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                  isMatched
                    ? 'bg-[#D8E3D0] text-[#31594B] font-semibold border border-[#C8D9C2]/70 shadow-2xs'
                    : 'bg-[#ECE8DD] text-[#292F2B] border border-[#E3E2D9]'
                }`}
              >
                {skill}
              </span>
            );
          })}
          {project.requiredSkills.length > 4 && (
            <span className="text-[10px] text-[#8E9690] self-center">
              +{project.requiredSkills.length - 4} more
            </span>
          )}
        </div>

        {/* Open Roles highlight */}
        {project.openRoles.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-[#ECE8DD] text-xs">
            <span className="text-[#8E9690] font-medium">Looking for: </span>
            <span className="text-[#292F2B] font-semibold">
              {project.openRoles.map(r => r.title).join(' • ')}
            </span>
          </div>
        )}
      </div>

      {/* Footer Info: Owner, Team Size, CTA */}
      <div className="mt-5 pt-4 border-t border-[#E3E2D9] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src={project.ownerAvatar}
            alt={project.ownerName}
            className="w-7 h-7 rounded-full object-cover border border-[#D8E3D0] shadow-2xs"
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#292F2B] truncate max-w-[120px] sm:max-w-[150px]">
              {project.ownerName}
            </span>
            <span className="text-[10px] text-[#68716B] flex items-center gap-1">
              <Users className="w-3 h-3 text-[#31594B]" />
              {project.teamSize.current}/{project.teamSize.max} members
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
              Details
            </Button>
          </Link>
          {onApplyClick && !hasApplied && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApplyClick(project)}
            >
              Apply
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
