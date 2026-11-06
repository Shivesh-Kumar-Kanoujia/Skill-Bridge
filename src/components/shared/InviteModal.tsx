'use client';

import React, { useState } from 'react';
import { Student } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { AlertCircle, MailPlus } from 'lucide-react';

interface InviteModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ student, isOpen, onClose }: InviteModalProps) {
  const { projects, sendInvitation, currentUser } = useSkillBridge();
  
  const availableProjects = projects.filter(p => p.status === 'Recruiting');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    availableProjects[0]?.id || ''
  );
  const [role, setRole] = useState<string>('Collaborator / Engineer');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Please select a project to invite this student to.');
      return;
    }
    if (!role.trim()) {
      setError('Please specify a role title.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    await new Promise(res => setTimeout(res, 500));
    const result = sendInvitation(
      student.id,
      selectedProjectId,
      role,
      message || `Hey ${student.name}, we would love to have your skills on our project!`
    );
    setIsSubmitting(false);

    if (result.success) {
      setMessage('');
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Invite ${student.name} to Collaborate`}
      description="Send a project invitation to join your team."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Recipient summary */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F4F1E8] border border-[#E3E2D9]">
          <img
            src={student.avatar}
            alt={student.name}
            className="w-10 h-10 rounded-full object-cover border border-[#D8E3D0] shadow-2xs"
          />
          <div>
            <p className="text-xs font-bold text-[#292F2B]">{student.name}</p>
            <p className="text-[11px] text-[#68716B]">
              {student.department} • {student.availability.status} ({student.availability.hoursPerWeek}h/wk)
            </p>
          </div>
        </div>

        {/* Project Selector */}
        <div>
          <label htmlFor="project-select" className="block text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5">
            Select Project
          </label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[#E3E2D9] bg-white text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B]"
          >
            {availableProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.category})
              </option>
            ))}
          </select>
        </div>

        {/* Role input */}
        <div>
          <label htmlFor="role-input" className="block text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5">
            Proposed Role
          </label>
          <input
            id="role-input"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Lead Frontend Developer, ML Researcher"
            className="w-full h-10 px-3.5 rounded-lg border border-[#E3E2D9] bg-white text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B]"
          />
        </div>

        {/* Invitation Message */}
        <div>
          <label htmlFor="message-input" className="block text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5">
            Personal Message (Optional)
          </label>
          <textarea
            id="message-input"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Hi ${student.name}, noticed your background in ${student.skills[0]?.name || 'tech'}. We have an open spot on our project...`}
            className="w-full p-3 rounded-lg border border-[#E3E2D9] bg-white text-sm text-[#292F2B] placeholder:text-[#8E9690] focus:outline-none focus:ring-2 focus:ring-[#31594B]"
          />
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B5473C] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E3E2D9]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} leftIcon={<MailPlus className="w-3.5 h-3.5" />}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
