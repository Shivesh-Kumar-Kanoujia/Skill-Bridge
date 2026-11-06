'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Application, Invitation } from '@/types';
import { 
  Inbox, 
  Send, 
  Mail, 
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

export default function ApplicationsPage() {
  const { 
    currentUser, 
    applications, 
    invitations, 
    projects, 
    acceptApplication, 
    rejectApplication, 
    withdrawApplication,
    acceptInvitation,
    declineInvitation
  } = useSkillBridge();

  const [activeTab, setActiveTab] = useState<'received' | 'submitted' | 'invitations' | 'teams'>('received');

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'accept' | 'reject' | 'withdraw';
    targetId: string;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'accept',
    targetId: '',
    title: '',
    description: ''
  });

  const ownedProjectIds = projects.filter(p => p.ownerId === currentUser.id).map(p => p.id);
  const receivedApplications = applications.filter(a => ownedProjectIds.includes(a.projectId));
  const submittedApplications = applications.filter(a => a.applicantId === currentUser.id);
  const myInvitations = invitations.filter(i => i.receiverId === currentUser.id);
  const myTeams = projects.filter(p => 
    p.ownerId === currentUser.id || p.currentMembers.some(m => m.studentId === currentUser.id)
  );

  const handleConfirmAction = () => {
    if (confirmModal.type === 'accept') {
      acceptApplication(confirmModal.targetId);
    } else if (confirmModal.type === 'reject') {
      rejectApplication(confirmModal.targetId);
    } else if (confirmModal.type === 'withdraw') {
      withdrawApplication(confirmModal.targetId);
    }
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col">
      <div className="flex gap-8">
        <AppSidebar />

        <main className="flex-1 py-8 flex flex-col gap-6 min-w-0">
          {/* Header */}
          <div className="pb-6 border-b border-[#E3E2D9]">
            <span className="text-xs font-bold text-[#31594B] uppercase tracking-wider">
              Coordination & Teaming
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#292F2B] mt-1">
              Applications & Team Management
            </h1>
            <p className="text-xs sm:text-sm text-[#68716B] mt-1">
              Review received candidate applications, track submitted roles, and manage active project squads.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#E3E2D9] gap-2 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'received'
                  ? 'border-[#31594B] text-[#31594B]'
                  : 'border-transparent text-[#68716B] hover:text-[#292F2B]'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Received Applications</span>
              {receivedApplications.filter(a => a.status === 'Pending').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#D99A62] text-white font-bold shadow-2xs">
                  {receivedApplications.filter(a => a.status === 'Pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('submitted')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'submitted'
                  ? 'border-[#31594B] text-[#31594B]'
                  : 'border-transparent text-[#68716B] hover:text-[#292F2B]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Submitted Applications</span>
              <span className="text-xs text-[#8E9690]">({submittedApplications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('invitations')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'invitations'
                  ? 'border-[#31594B] text-[#31594B]'
                  : 'border-transparent text-[#68716B] hover:text-[#292F2B]'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Team Invitations</span>
              {myInvitations.filter(i => i.status === 'Pending').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#31594B] text-white font-bold shadow-2xs">
                  {myInvitations.filter(i => i.status === 'Pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'teams'
                  ? 'border-[#31594B] text-[#31594B]'
                  : 'border-transparent text-[#68716B] hover:text-[#292F2B]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>My Teams ({myTeams.length})</span>
            </button>
          </div>

          {/* TAB 1: Received Applications */}
          {activeTab === 'received' && (
            <div className="flex flex-col gap-4">
              {receivedApplications.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No applications received yet"
                  description="When other students apply for open roles on your projects, their applications and match metrics will appear here."
                />
              ) : (
                receivedApplications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="clay-card p-5 sm:p-6 flex flex-col gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={app.applicantAvatar}
                          alt={app.applicantName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#D8E3D0] shadow-2xs"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-serif font-bold text-[#292F2B]">
                              {app.applicantName}
                            </h3>
                            <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#D8E3D0] text-[#31594B] font-semibold border border-[#C8D9C2]/50">
                              Role Applied: {app.roleApplied}
                            </span>
                          </div>
                          <p className="text-xs text-[#68716B] mt-0.5">
                            {app.applicantDepartment} • Semester {app.applicantSemester}
                          </p>
                          <p className="text-xs text-[#31594B] font-medium mt-1">
                            Applied for: <span className="font-bold">{app.projectTitle}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status / Match */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F0F5EC] text-[#31594B] border border-[#D8E3D0] shadow-2xs">
                          {app.matchScore}% Match Estimate
                        </span>
                        <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                          app.status === 'Accepted'
                            ? 'bg-[#EAF0E8] text-[#31594B]'
                            : app.status === 'Rejected'
                            ? 'bg-red-50 text-[#B5473C]'
                            : 'bg-[#FBF4EC] text-[#8C5323]'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Statement / Pitch */}
                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E3E2D9] text-xs text-[#68716B] shadow-2xs">
                      <span className="font-semibold text-[#292F2B] block mb-1">
                        Candidate Statement:
                      </span>
                      <p className="leading-relaxed whitespace-pre-line">{app.statement}</p>
                    </div>

                    {/* Applicant Skills */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs font-semibold text-[#8E9690]">Reported Skills:</span>
                      {app.applicantSkills.map((sk) => (
                        <span key={sk} className="text-[11px] px-2 py-0.5 rounded-md bg-[#ECE8DD] text-[#292F2B] border border-[#E3E2D9]">
                          {sk}
                        </span>
                      ))}
                    </div>

                    {/* Actions if Pending */}
                    {app.status === 'Pending' && (
                      <div className="pt-3 border-t border-[#ECE8DD] flex items-center justify-end gap-2.5">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmModal({
                            isOpen: true,
                            type: 'reject',
                            targetId: app.id,
                            title: `Decline Application from ${app.applicantName}?`,
                            description: `Are you sure you want to decline this application for ${app.roleApplied}? The applicant will be notified.`
                          })}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setConfirmModal({
                            isOpen: true,
                            type: 'accept',
                            targetId: app.id,
                            title: `Accept ${app.applicantName} into Team?`,
                            description: `This will confirm ${app.applicantName} for the "${app.roleApplied}" position and add them to your active project team roster.`
                          })}
                        >
                          Accept into Team
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Submitted Applications */}
          {activeTab === 'submitted' && (
            <div className="flex flex-col gap-4">
              {submittedApplications.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="No submitted applications"
                  description="You haven't applied to any campus projects yet. Browse open opportunities to find your next squad."
                  actionLabel="Discover Projects"
                  onAction={() => window.location.href = '/projects'}
                />
              ) : (
                submittedApplications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="clay-card p-5 sm:p-6 flex flex-col gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="category">{app.projectCategory}</Badge>
                          <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                            app.status === 'Accepted'
                              ? 'bg-[#EAF0E8] text-[#31594B]'
                              : app.status === 'Withdrawn'
                              ? 'bg-[#ECE8DD] text-[#8E9690]'
                              : app.status === 'Rejected'
                              ? 'bg-red-50 text-[#B5473C]'
                              : 'bg-[#FBF4EC] text-[#8C5323]'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        <Link href={`/projects/${app.projectId}`} className="hover:text-[#31594B] transition-colors">
                          <h3 className="text-base sm:text-lg font-serif font-bold text-[#292F2B] mt-2">
                            {app.projectTitle}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#68716B] mt-1">
                          Role: <span className="font-semibold text-[#31594B]">{app.roleApplied}</span> • Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#D8E3D0] text-[#31594B] border border-[#C8D9C2]/50 shadow-2xs">
                          {app.matchScore}% Compatibility
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E3E2D9] text-xs text-[#68716B] shadow-2xs">
                      <span className="font-semibold text-[#292F2B] block mb-1">Your Submission Note:</span>
                      <p className="line-clamp-2 leading-relaxed">{app.statement}</p>
                    </div>

                    {app.status === 'Pending' && (
                      <div className="pt-3 border-t border-[#ECE8DD] flex items-center justify-between">
                        <span className="text-xs text-[#8E9690]">Awaiting project lead response</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmModal({
                            isOpen: true,
                            type: 'withdraw',
                            targetId: app.id,
                            title: 'Withdraw Application?',
                            description: 'Are you sure you want to withdraw this application? You can re-apply later if open spots remain.'
                          })}
                        >
                          Withdraw
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Invitations */}
          {activeTab === 'invitations' && (
            <div className="flex flex-col gap-4">
              {myInvitations.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No project invitations"
                  description="When team leads invite you based on your listed skills and availability, their requests will appear here."
                />
              ) : (
                myInvitations.map((inv) => (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="clay-card p-5 sm:p-6 flex flex-col gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#FBF4EC] text-[#8C5323] border border-[#F3E5D8]">
                            Team Invitation
                          </span>
                          <span className="text-xs text-[#8E9690]">
                            Sent by {inv.senderName}
                          </span>
                        </div>
                        <h3 className="text-base font-serif font-bold text-[#292F2B] mt-2">
                          {inv.projectTitle}
                        </h3>
                        <p className="text-xs font-semibold text-[#31594B] mt-1">
                          Offered Role: {inv.role}
                        </p>
                      </div>

                      <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded ${
                        inv.status === 'Accepted'
                          ? 'bg-[#EAF0E8] text-[#31594B]'
                          : inv.status === 'Declined'
                          ? 'bg-red-50 text-[#B5473C]'
                          : 'bg-[#FBF4EC] text-[#8C5323]'
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E3E2D9] text-xs text-[#68716B] shadow-2xs">
                      <span className="font-semibold text-[#292F2B] block mb-1">Message:</span>
                      <p className="leading-relaxed">{inv.message}</p>
                    </div>

                    {inv.status === 'Pending' && (
                      <div className="pt-3 border-t border-[#ECE8DD] flex items-center justify-end gap-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => declineInvitation(inv.id)}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => acceptInvitation(inv.id)}
                        >
                          Accept & Join Team
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: My Teams */}
          {activeTab === 'teams' && (
            <div className="flex flex-col gap-6">
              {myTeams.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No active teams"
                  description="You are not currently part of any project squad. Explore discoverable projects or create an initiative."
                />
              ) : (
                myTeams.map((proj) => (
                  <motion.div
                    key={proj.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="clay-card p-6 flex flex-col gap-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#ECE8DD]">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="category">{proj.category}</Badge>
                          {proj.ownerId === currentUser.id && (
                            <Badge variant="forest" size="sm">You are Lead</Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-serif font-bold text-[#292F2B] mt-2">
                          {proj.title}
                        </h3>
                        <p className="text-xs text-[#68716B] mt-1">
                          Deadline: {proj.deadline} • Duration: {proj.duration}
                        </p>
                      </div>

                      <Link href={`/projects/${proj.id}`}>
                        <Button variant="outline" size="sm">
                          View Project Page
                        </Button>
                      </Link>
                    </div>

                    {/* Team Members Roster */}
                    <div>
                      <h4 className="text-xs font-serif font-bold text-[#292F2B] uppercase tracking-wider mb-3">
                        Active Team Members ({proj.currentMembers.length}/{proj.teamSize.max})
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {proj.currentMembers.map((member) => (
                          <div
                            key={member.studentId}
                            className="p-3.5 rounded-xl border border-[#E3E2D9] bg-[#FAF8F5] flex items-center gap-3 shadow-2xs"
                          >
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border border-[#D8E3D0] shadow-2xs"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-serif font-bold text-[#292F2B] truncate">
                                {member.name}
                              </p>
                              <p className="text-[11px] font-semibold text-[#31594B] truncate">
                                {member.role}
                              </p>
                              <p className="text-[10px] text-[#8E9690] truncate">
                                {member.department}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        description={confirmModal.description}
      >
        <div className="flex items-center justify-end gap-2.5 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          >
            Cancel
          </Button>
          <Button
            variant={confirmModal.type === 'accept' ? 'primary' : 'danger'}
            size="sm"
            onClick={handleConfirmAction}
          >
            Confirm
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
