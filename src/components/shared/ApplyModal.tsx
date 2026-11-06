'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { calculateMatchScore } from '@/lib/matching';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApplyModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplyModal({ project, isOpen, onClose }: ApplyModalProps) {
  const { currentUser, applyToProject } = useSkillBridge();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [statement, setStatement] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!project) return null;

  const match = calculateMatchScore(currentUser, project);
  const roles = project.openRoles.map(r => r.title);
  const activeRole = selectedRole || roles[0] || 'Team Contributor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) {
      setError('Please provide a brief statement on your relevant experience and motivation.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    await new Promise(res => setTimeout(res, 500));
    const result = applyToProject(project.id, activeRole, statement);
    setIsSubmitting(false);

    if (result.success) {
      setStatement('');
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply to ${project.title}`}
      description="Submit your application directly to the project coordinator."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Match estimate summary box */}
        <div className="p-3.5 rounded-xl bg-[#F0F5EC] border border-[#D8E3D0] flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-[#31594B] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
            {match.score}%
          </div>
          <div className="text-xs">
            <p className="font-semibold text-[#31594B]">
              Estimated Compatibility: {match.label}
            </p>
            <p className="text-[#68716B] mt-0.5 leading-relaxed">
              {match.explanation}
            </p>
          </div>
        </div>

        {/* Role selection */}
        <div>
          <label htmlFor="role-select" className="block text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5">
            Select Role Applied For
          </label>
          <select
            id="role-select"
            value={activeRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[#E3E2D9] bg-white text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B]"
          >
            {project.openRoles.map((role) => (
              <option key={role.id} value={role.title}>
                {role.title} ({role.spots - role.filled} spot{role.spots - role.filled > 1 ? 's' : ''} open)
              </option>
            ))}
          </select>
        </div>

        {/* Applicant summary check */}
        <div className="text-xs text-[#68716B] bg-[#F4F1E8] p-3 rounded-lg border border-[#E3E2D9]">
          <span className="font-semibold text-[#292F2B]">Applying as: </span>
          {currentUser.name} ({currentUser.department}, Sem {currentUser.semester})
          <div className="text-[11px] text-[#8E9690] mt-1">
            Availability: {currentUser.availability.hoursPerWeek} hrs/week • Rating: {currentUser.stats.reliabilityRating}/5.0
          </div>
        </div>

        {/* Statement / Pitch */}
        <div>
          <label htmlFor="statement-input" className="block text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5">
            Statement & Relevant Experience
          </label>
          <textarea
            id="statement-input"
            rows={4}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Briefly describe why you are interested in this project, your experience with the required tech stack, and what you can contribute..."
            className="w-full p-3 rounded-lg border border-[#E3E2D9] bg-white text-sm text-[#292F2B] placeholder:text-[#8E9690] focus:outline-none focus:ring-2 focus:ring-[#31594B]"
          />
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B5473C] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E3E2D9]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Submit Application
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
