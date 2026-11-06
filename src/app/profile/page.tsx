'use client';

import React, { useState } from 'react';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { StudentSkill, SkillLevel } from '@/types';
import { 
  User, 
  Edit3, 
  Plus, 
  Trash2, 
  Globe, 
  Save, 
  X,
  Camera,
  Loader2
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';
import { getAvatarUrl } from '@/lib/utils';
import { motion } from 'motion/react';

export default function ProfilePage() {
  const { currentUser, updateProfile, uploadAvatar } = useSkillBridge();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    headline: currentUser.headline,
    bio: currentUser.bio,
    department: currentUser.department,
    semester: currentUser.semester,
    college: currentUser.college,
    hoursPerWeek: currentUser.availability.hoursPerWeek,
    availabilityStatus: currentUser.availability.status,
    availabilityNote: currentUser.availability.note || '',
    githubUrl: currentUser.githubUrl || '',
    linkedinUrl: currentUser.linkedinUrl || '',
    portfolioUrl: currentUser.portfolioUrl || '',
  });

  const [skills, setSkills] = useState<StudentSkill[]>(currentUser.skills);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Intermediate');
  const [newSkillCategory, setNewSkillCategory] = useState<StudentSkill['category']>('Frontend');

  const [interests, setInterests] = useState<string[]>(currentUser.interests);
  const [newInterest, setNewInterest] = useState('');

  const handleSave = () => {
    updateProfile({
      name: formData.name,
      headline: formData.headline,
      bio: formData.bio,
      department: formData.department,
      semester: Number(formData.semester),
      college: formData.college,
      githubUrl: formData.githubUrl,
      linkedinUrl: formData.linkedinUrl,
      portfolioUrl: formData.portfolioUrl,
      skills,
      interests,
      availability: {
        hoursPerWeek: Number(formData.hoursPerWeek),
        status: formData.availabilityStatus as any,
        note: formData.availabilityNote,
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser.name,
      headline: currentUser.headline,
      bio: currentUser.bio,
      department: currentUser.department,
      semester: currentUser.semester,
      college: currentUser.college,
      hoursPerWeek: currentUser.availability.hoursPerWeek,
      availabilityStatus: currentUser.availability.status,
      availabilityNote: currentUser.availability.note || '',
      githubUrl: currentUser.githubUrl || '',
      linkedinUrl: currentUser.linkedinUrl || '',
      portfolioUrl: currentUser.portfolioUrl || '',
    });
    setSkills(currentUser.skills);
    setInterests(currentUser.interests);
    setIsEditing(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Maximum size is 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      await uploadAvatar(file);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
    if (exists) return;

    setSkills([
      ...skills,
      {
        name: newSkillName.trim(),
        level: newSkillLevel,
        category: newSkillCategory,
      }
    ]);
    setNewSkillName('');
  };

  const removeSkill = (skillName: string) => {
    setSkills(skills.filter(s => s.name !== skillName));
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    if (interests.includes(newInterest.trim())) return;
    setInterests([...interests, newInterest.trim()]);
    setNewInterest('');
  };

  const removeInterest = (item: string) => {
    setInterests(interests.filter(i => i !== item));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col">
      <div className="flex gap-8">
        <AppSidebar />

        <main className="flex-1 py-8 flex flex-col gap-6 min-w-0">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E3E2D9]">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#292F2B]">
                  Student Profile
                </h1>
                <Badge variant={isEditing ? 'amber' : 'forest'}>
                  {isEditing ? 'Edit Mode' : 'View Mode'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-[#68716B] mt-1">
                Manage your technical credentials, availability commitments, and portfolio links.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave} leftIcon={<Save className="w-3.5 h-3.5" />}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Profile Card View / Edit */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="clay-card p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="relative group shrink-0">
                <img
                  src={getAvatarUrl(currentUser.avatar, currentUser.name)}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-[#D8E3D0] shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#31594B] text-white hover:bg-[#234237] transition-all shadow-md cursor-pointer border-2 border-white"
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1 flex flex-col gap-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                      label="Professional Headline"
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    />
                    <div>
                      <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-lg border border-[#E3E2D9] text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
                          Semester
                        </label>
                        <select
                          value={formData.semester}
                          onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                          className="w-full h-10 px-3 rounded-lg border border-[#E3E2D9] text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Hours / Week"
                        type="number"
                        value={formData.hoursPerWeek}
                        onChange={(e) => setFormData({ ...formData, hoursPerWeek: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-[#292F2B]">
                      {currentUser.name}
                    </h2>
                    <p className="text-sm font-semibold text-[#31594B] mt-1">
                      {currentUser.headline}
                    </p>
                    <p className="text-xs text-[#68716B] mt-1">
                      Semester {currentUser.semester} • {currentUser.department} • {currentUser.college}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-[#F0F5EC] border border-[#D8E3D0] text-[#31594B] font-semibold">
                        {currentUser.availability.status} ({currentUser.availability.hoursPerWeek} hrs/week)
                      </span>
                      <span className="text-[#68716B]">
                        {currentUser.completedProjects.length} completed projects
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bio Field */}
            <div className="mt-6 pt-6 border-t border-[#ECE8DD]">
              <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-2 block">
                Personal Statement & Experience
              </label>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-3 rounded-lg border border-[#E3E2D9] text-sm text-[#292F2B] focus:outline-none focus:ring-2 focus:ring-[#31594B]"
                />
              ) : (
                <p className="text-sm text-[#68716B] leading-relaxed">
                  {currentUser.bio}
                </p>
              )}
            </div>

            {/* Availability Note */}
            {isEditing && (
              <div className="mt-4">
                <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-1.5 block">
                  Availability Details & Scheduling Note
                </label>
                <input
                  type="text"
                  value={formData.availabilityNote}
                  onChange={(e) => setFormData({ ...formData, availabilityNote: e.target.value })}
                  placeholder="e.g. Free after 4 PM weekdays and full weekends"
                  className="w-full h-10 px-3.5 rounded-lg border border-[#E3E2D9] text-sm text-[#292F2B]"
                />
              </div>
            )}

            {/* External Links */}
            <div className="mt-6 pt-6 border-t border-[#ECE8DD]">
              <label className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider mb-3 block">
                Portfolio & Profiles
              </label>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="GitHub URL"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    leftIcon={<GithubIcon className="w-4 h-4" />}
                  />
                  <Input
                    label="LinkedIn URL"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    leftIcon={<LinkedinIcon className="w-4 h-4" />}
                  />
                  <Input
                    label="Portfolio Website"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    placeholder="https://yourportfolio.dev"
                    leftIcon={<Globe className="w-4 h-4" />}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#68716B]">
                  {currentUser.githubUrl ? (
                    <a href={currentUser.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#31594B]">
                      <GithubIcon className="w-4 h-4" />
                      <span>{currentUser.githubUrl.replace('https://', '')}</span>
                    </a>
                  ) : (
                    <span className="text-[#8E9690]">No GitHub added</span>
                  )}
                  {currentUser.linkedinUrl && (
                    <a href={currentUser.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#31594B]">
                      <LinkedinIcon className="w-4 h-4" />
                      <span>LinkedIn Profile</span>
                    </a>
                  )}
                  {currentUser.portfolioUrl && (
                    <a href={currentUser.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#31594B]">
                      <Globe className="w-4 h-4" />
                      <span>Personal Portfolio</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Technical Skills Section */}
          <div className="clay-card p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#ECE8DD]">
              <div>
                <h3 className="text-base font-serif font-bold text-[#292F2B]">
                  Verified Skills & Proficiencies
                </h3>
                <p className="text-xs text-[#68716B] mt-0.5">
                  Used by the deterministic matching engine to calculate project compatibility.
                </p>
              </div>
            </div>

            {/* Add Skill Form (when editing) */}
            {isEditing && (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3E2D9] mb-6 flex flex-col sm:flex-row items-end gap-3 shadow-2xs">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-bold text-[#8E9690] uppercase tracking-wider block mb-1">
                    Skill Name
                  </label>
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="e.g. Docker, PyTorch, GraphQL"
                    className="w-full h-9 px-3 rounded-lg border border-[#E3E2D9] bg-white text-xs text-[#292F2B] focus:outline-none focus:ring-1 focus:ring-[#31594B]"
                  />
                </div>

                <div className="w-full sm:w-36">
                  <label className="text-[10px] font-bold text-[#8E9690] uppercase tracking-wider block mb-1">
                    Proficiency
                  </label>
                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                    className="w-full h-9 px-2 rounded-lg border border-[#E3E2D9] bg-white text-xs text-[#292F2B] focus:outline-none focus:ring-1 focus:ring-[#31594B]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="w-full sm:w-36">
                  <label className="text-[10px] font-bold text-[#8E9690] uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value as any)}
                    className="w-full h-9 px-2 rounded-lg border border-[#E3E2D9] bg-white text-xs text-[#292F2B] focus:outline-none focus:ring-1 focus:ring-[#31594B]"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Design">Design</option>
                    <option value="Data">Data</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Core">Core</option>
                  </select>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={addSkill}
                  className="w-full sm:w-auto h-9"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add
                </Button>
              </div>
            )}

            {/* Skills List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {skills.map((s) => (
                <div
                  key={s.name}
                  className="p-3 rounded-xl border border-[#E3E2D9] bg-[#FAF8F5] flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <span className="text-xs font-serif font-bold text-[#292F2B] block">{s.name}</span>
                    <span className="text-[10px] text-[#8E9690]">{s.category}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      s.level === 'Advanced'
                        ? 'bg-[#31594B] text-white shadow-2xs'
                        : s.level === 'Intermediate'
                        ? 'bg-[#D8E3D0] text-[#31594B] border border-[#C8D9C2]/60'
                        : 'bg-[#ECE8DD] text-[#68716B]'
                    }`}>
                      {s.level}
                    </span>
                    {isEditing && (
                      <button
                        onClick={() => removeSkill(s.name)}
                        className="p-1 text-[#B5473C] hover:text-red-700 transition-colors cursor-pointer"
                        aria-label={`Remove ${s.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interests Section */}
          <div className="clay-card p-6 sm:p-8">
            <h3 className="text-base font-serif font-bold text-[#292F2B] mb-1">
              Project Domain Interests
            </h3>
            <p className="text-xs text-[#68716B] mb-4">
              Domains and project types you are interested in building with peers.
            </p>

            {isEditing && (
              <div className="flex items-center gap-2 max-w-md mb-4">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add interest (e.g. EdTech, Robotics)..."
                  className="flex-1 h-9 px-3 rounded-lg border border-[#E3E2D9] text-xs text-[#292F2B] focus:outline-none focus:ring-1 focus:ring-[#31594B]"
                />
                <Button variant="secondary" size="sm" onClick={addInterest} className="h-9">
                  Add
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-md bg-[#F0F5EC] border border-[#D8E3D0] text-xs font-medium text-[#31594B] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{interest}</span>
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(interest)}
                      className="text-[#8E9690] hover:text-[#B5473C] p-0.5 cursor-pointer"
                      aria-label={`Remove interest ${interest}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
