'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { Plus, Trash2, Users, Calendar, Clock, Layers, Sparkles } from 'lucide-react';
import { ProjectCategory } from '@/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

interface OpenRoleDraft {
  title: string;
  spots: number;
  description: string;
  skills: string[];
  currentSkillInput?: string;
}

const CATEGORIES: ProjectCategory[] = [
  'Hackathon',
  'Capstone',
  'Coursework',
  'Open Source',
  'Research',
  'Startup',
];

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const { createProject, currentUser } = useSkillBridge();

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Coursework');
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);
  const [duration, setDuration] = useState('8 Weeks');
  const [deadline, setDeadline] = useState('2026-12-31');

  // Overall required skills
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['React', 'TypeScript']);
  const [skillInput, setSkillInput] = useState('');

  // Open Roles draft
  const [roles, setRoles] = useState<OpenRoleDraft[]>([
    {
      title: 'Frontend Developer',
      spots: 1,
      description: 'Build polished React components with responsive styling.',
      skills: ['React', 'Tailwind CSS'],
    },
    {
      title: 'Backend / API Specialist',
      spots: 1,
      description: 'Develop endpoints, database models, and service logic.',
      skills: ['Python', 'FastAPI'],
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddSkill = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skillToRemove));
  };

  const handleAddRole = () => {
    setRoles([
      ...roles,
      {
        title: '',
        spots: 1,
        description: '',
        skills: [],
      },
    ]);
  };

  const handleRemoveRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleUpdateRole = (index: number, patch: Partial<OpenRoleDraft>) => {
    setRoles(roles.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const handleAddRoleSkill = (index: number, skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    const role = roles[index];
    if (!role.skills.includes(trimmed)) {
      handleUpdateRole(index, {
        skills: [...role.skills, trimmed],
        currentSkillInput: '',
      });
    }
  };

  const handleRemoveRoleSkill = (roleIndex: number, skillToRemove: string) => {
    const role = roles[roleIndex];
    handleUpdateRole(roleIndex, {
      skills: role.skills.filter(s => s !== skillToRemove),
    });
  };

  const resetForm = () => {
    setTitle('');
    setTagline('');
    setDescription('');
    setCategory('Coursework');
    setMaxTeamSize(4);
    setDuration('8 Weeks');
    setDeadline('2026-12-31');
    setRequiredSkills(['React', 'TypeScript']);
    setSkillInput('');
    setRoles([
      {
        title: 'Frontend Developer',
        spots: 1,
        description: 'Build polished React components with responsive styling.',
        skills: ['React', 'Tailwind CSS'],
      },
    ]);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || title.trim().length < 3) {
      setError('Project title must be at least 3 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a clear project description (at least 10 characters).');
      return;
    }
    if (roles.length === 0) {
      setError('Please add at least one open role for teammates to apply to.');
      return;
    }
    for (const r of roles) {
      if (!r.title.trim()) {
        setError('All roles must have a role title (e.g. "Frontend Engineer").');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await createProject({
        title: title.trim(),
        tagline: tagline.trim() || undefined,
        description: description.trim(),
        category,
        maxTeamSize: Number(maxTeamSize) || 4,
        duration: duration.trim() || '8 Weeks',
        deadline: deadline.trim() || undefined,
        requiredSkills,
        openRoles: roles.map(r => ({
          title: r.title.trim(),
          spots: Number(r.spots) || 1,
          description: r.description.trim() || undefined,
          skills: r.skills,
        })),
      });

      if (res.success && res.project) {
        resetForm();
        onClose();
        if (onSuccess) onSuccess(res.project.id);
      } else {
        setError(res.error || 'Failed to create project. Please verify inputs.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Recruit Teammates for a Project"
      description="Create a structured project posting to invite collaborators and accept applications."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#B5473C] font-medium">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="flex flex-col gap-3">
          <Input
            label="Project Title *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. AI-Powered Smart Campus Navigation"
            required
          />

          <Input
            label="Brief Hook / Tagline"
            value={tagline}
            onChange={e => setTagline(e.target.value)}
            placeholder="e.g. Real-time AR navigation for university lecture halls"
            helperText="A single punchy sentence shown on project cards."
          />

          <div>
            <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
              Project Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Outline the problem you're tackling, architecture, timeline, and what you want to achieve together..."
              required
              className="w-full p-3 rounded-xl border border-[#E3E2D9] text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] bg-white resize-y"
            />
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
              Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ProjectCategory)}
                className="w-full h-10 px-3 rounded-xl border border-[#E3E2D9] text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] bg-white cursor-pointer"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
              Team Capacity
            </label>
            <div className="relative">
              <input
                type="number"
                min={2}
                max={15}
                value={maxTeamSize}
                onChange={e => setMaxTeamSize(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-[#E3E2D9] text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="e.g. 8 Weeks"
              className="w-full h-10 px-3 rounded-xl border border-[#E3E2D9] text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] bg-white"
            />
          </div>
        </div>

        {/* Application Deadline */}
        <div>
          <Input
            label="Application Deadline"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            helperText="Date after which new applications close."
          />
        </div>

        {/* Required Tech Skills */}
        <div>
          <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
            Core Technologies & Skills
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="Add skill (e.g. Next.js, PyTorch) and press Enter"
              className="flex-1 h-9 px-3 rounded-xl border border-[#E3E2D9] text-xs text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] bg-white"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSkill}
              className="h-9 px-3 text-xs"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {requiredSkills.map(sk => (
              <span
                key={sk}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F0F5EC] border border-[#D8E3D0] text-[#31594B]"
              >
                {sk}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(sk)}
                  className="hover:text-red-600 cursor-pointer"
                  aria-label={`Remove ${sk}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Open Roles Builder */}
        <div className="pt-2 border-t border-[#E3E2D9]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider">
                Open Roles ({roles.length})
              </h4>
              <p className="text-[11px] text-[#68716B]">
                Specify specific seats so students know where they best fit.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRole}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Add Role
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {roles.map((role, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#E3E2D9] bg-[#FAF8F5] flex flex-col gap-2.5 relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-semibold text-[#68716B] uppercase tracking-wider mb-1 block">
                        Role Title *
                      </label>
                      <input
                        type="text"
                        value={role.title}
                        onChange={e => handleUpdateRole(idx, { title: e.target.value })}
                        placeholder="e.g. UI/UX Designer, ML Engineer"
                        required
                        className="w-full h-8 px-2.5 rounded-lg border border-[#E3E2D9] text-xs text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[#68716B] uppercase tracking-wider mb-1 block">
                        Spots
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={role.spots}
                        onChange={e => handleUpdateRole(idx, { spots: Number(e.target.value) })}
                        className="w-full h-8 px-2.5 rounded-lg border border-[#E3E2D9] text-xs text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] bg-white"
                      />
                    </div>
                  </div>

                  {roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(idx)}
                      className="p-1.5 text-[#8E9690] hover:text-[#B5473C] transition-colors rounded-md"
                      title="Remove Role"
                      aria-label="Remove Role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[#68716B] uppercase tracking-wider mb-1 block">
                    Role Responsibilities
                  </label>
                  <input
                    type="text"
                    value={role.description}
                    onChange={e => handleUpdateRole(idx, { description: e.target.value })}
                    placeholder="e.g. Responsible for design system and Figma wireframes"
                    className="w-full h-8 px-2.5 rounded-lg border border-[#E3E2D9] text-xs text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] bg-white"
                  />
                </div>

                {/* Role Specific Skills */}
                <div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={role.currentSkillInput || ''}
                      onChange={e => handleUpdateRole(idx, { currentSkillInput: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRoleSkill(idx, role.currentSkillInput || '');
                        }
                      }}
                      placeholder="Add role skill (press Enter)"
                      className="flex-1 h-7 px-2.5 rounded-lg border border-[#E3E2D9] text-[11px] text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B] bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddRoleSkill(idx, role.currentSkillInput || '')}
                      className="px-2 h-7 rounded-lg bg-[#EAE7DC] text-[#292F2B] text-[11px] font-medium hover:bg-[#DED9CC]"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {role.skills.map(sk => (
                      <span
                        key={sk}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-white border border-[#E3E2D9] text-[#292F2B]"
                      >
                        {sk}
                        <button
                          type="button"
                          onClick={() => handleRemoveRoleSkill(idx, sk)}
                          className="text-[#8E9690] hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E3E2D9]">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            leftIcon={!isSubmitting ? <Sparkles className="w-3.5 h-3.5" /> : undefined}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Project'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

