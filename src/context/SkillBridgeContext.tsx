'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, Project, Application, Invitation } from '@/types';
import { MOCK_STUDENTS, MOCK_PROJECTS, MOCK_APPLICATIONS, MOCK_INVITATIONS, CURRENT_USER_ID } from '@/data/mockData';
import { calculateMatchScore } from '@/lib/matching';
import {
  authApi,
  studentsApi,
  projectsApi,
  applicationsApi,
  invitationsApi,
} from '@/lib/api';

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface SkillBridgeContextType {
  currentUser: Student;
  isAuthenticated: boolean;
  students: Student[];
  projects: Project[];
  applications: Application[];
  invitations: Invitation[];
  notifications: ToastNotification[];
  dismissNotification: (id: string) => void;
  showNotification: (title: string, message: string, type?: ToastNotification['type']) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; department: string; semester: number }) => Promise<{ success: boolean }>;
  logout: () => void;
  updateProfile: (updated: Partial<Student>) => void;
  applyToProject: (projectId: string, roleTitle: string, statement: string) => { success: boolean; message: string };
  withdrawApplication: (applicationId: string) => void;
  acceptApplication: (applicationId: string) => void;
  rejectApplication: (applicationId: string) => void;
  sendInvitation: (studentId: string, projectId: string, role: string, message: string) => { success: boolean; message: string };
  acceptInvitation: (invitationId: string) => void;
  declineInvitation: (invitationId: string) => void;
}

const SkillBridgeContext = createContext<SkillBridgeContextType | undefined>(undefined);

export function SkillBridgeProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Student>(MOCK_STUDENTS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [invitations, setInvitations] = useState<Invitation[]>(MOCK_INVITATIONS);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Load initial data from backend with local fallback
  useEffect(() => {
    async function initData() {
      // 1. Try local storage first for instant render
      try {
        const savedUser = localStorage.getItem('sb_current_user');
        if (savedUser) setCurrentUser(JSON.parse(savedUser));

        const savedApps = localStorage.getItem('sb_applications');
        if (savedApps) setApplications(JSON.parse(savedApps));

        const savedInvs = localStorage.getItem('sb_invitations');
        if (savedInvs) setInvitations(JSON.parse(savedInvs));

        const savedAuth = localStorage.getItem('sb_auth');
        if (savedAuth !== null) setIsAuthenticated(savedAuth === 'true');
      } catch {
        // LocalStorage access fallback
      }

      // 2. Fetch live data from backend if available
      try {
        const [liveProjects, liveStudents] = await Promise.all([
          projectsApi.list().catch(() => null),
          studentsApi.list().catch(() => null),
        ]);
        if (liveProjects && liveProjects.length > 0) setProjects(liveProjects);
        if (liveStudents && liveStudents.length > 0) setStudents(liveStudents);

        const token = localStorage.getItem('sb_token');
        if (token) {
          const myProfile = await studentsApi.getMyProfile().catch(() => null);
          if (myProfile) {
            setCurrentUser(myProfile);
            setIsAuthenticated(true);
          }
          const [myApps, myInvs] = await Promise.all([
            applicationsApi.getMyApplications().catch(() => null),
            invitationsApi.getMyInvitations().catch(() => null),
          ]);
          if (myApps && myApps.length > 0) setApplications(myApps);
          if (myInvs && myInvs.length > 0) setInvitations(myInvs);
        }
      } catch {
        // Backend offline or unreachable — continues with local data
      }
    }

    initData();
  }, []);

  const showNotification = (title: string, message: string, type: ToastNotification['type'] = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newNote: ToastNotification = { id, type, title, message };
    setNotifications(prev => [newNote, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4500);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await authApi.login(email, pass);
      const myProfile = await studentsApi.getMyProfile();
      setCurrentUser(myProfile);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('sb_current_user', JSON.stringify(myProfile));
        localStorage.setItem('sb_auth', 'true');
      } catch {}

      // Refresh applications & invitations
      const [myApps, myInvs] = await Promise.all([
        applicationsApi.getMyApplications().catch(() => null),
        invitationsApi.getMyInvitations().catch(() => null),
      ]);
      if (myApps && myApps.length > 0) setApplications(myApps);
      if (myInvs && myInvs.length > 0) setInvitations(myInvs);

      showNotification('Welcome back!', `Signed in as ${myProfile.name}`);
      return { success: true };
    } catch (err: any) {
      // Offline / fallback mode
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('404')) {
        await new Promise(res => setTimeout(res, 400));
        if (!email.includes('@')) {
          return { success: false, error: 'Please enter a valid academic email address.' };
        }
        if (pass.length < 6) {
          return { success: false, error: 'Password must be at least 6 characters long.' };
        }
        setIsAuthenticated(true);
        localStorage.setItem('sb_auth', 'true');
        showNotification('Welcome back!', `Signed in as ${currentUser.name}`);
        return { success: true };
      }
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const signup = async (data: { name: string; email: string; department: string; semester: number }): Promise<{ success: boolean; error?: string }> => {
    try {
      await authApi.signup({
        name: data.name,
        email: data.email,
        department: data.department,
        semester: Number(data.semester),
      });
      const myProfile = await studentsApi.getMyProfile();
      setCurrentUser(myProfile);
      setIsAuthenticated(true);
      try {
        localStorage.setItem('sb_current_user', JSON.stringify(myProfile));
        localStorage.setItem('sb_auth', 'true');
      } catch {}
      showNotification('Account Created', `Welcome to SkillBridge, ${data.name}!`);
      return { success: true };
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('404')) {
        await new Promise(res => setTimeout(res, 500));
        const newStudent: Student = {
          ...currentUser,
          id: `student-${Date.now()}`,
          name: data.name,
          email: data.email,
          department: data.department,
          semester: Number(data.semester),
        };
        setCurrentUser(newStudent);
        setIsAuthenticated(true);
        try {
          localStorage.setItem('sb_current_user', JSON.stringify(newStudent));
          localStorage.setItem('sb_auth', 'true');
        } catch {}
        showNotification('Account Created', `Welcome to SkillBridge, ${data.name}!`);
        return { success: true };
      }
      showNotification('Signup Failed', err.message, 'error');
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setIsAuthenticated(false);
    localStorage.setItem('sb_auth', 'false');
    showNotification('Signed Out', 'You have been signed out of your session.', 'info');
  };

  const updateProfile = async (updated: Partial<Student>) => {
    try {
      const saved = await studentsApi.updateMyProfile(updated);
      setCurrentUser(saved);
      setStudents(prev => prev.map(s => s.id === saved.id ? { ...s, ...saved } : s));
      try {
        localStorage.setItem('sb_current_user', JSON.stringify(saved));
      } catch {}
      showNotification('Profile Updated', 'Your profile details and skills have been saved.');
    } catch {
      // Local fallback
      setCurrentUser(prev => {
        const nextUser = { ...prev, ...updated };
        try {
          localStorage.setItem('sb_current_user', JSON.stringify(nextUser));
        } catch {}
        return nextUser;
      });
      setStudents(prev => prev.map(s => s.id === currentUser.id ? { ...s, ...updated } : s));
      showNotification('Profile Updated', 'Your profile details and skills have been saved.');
    }
  };

  const applyToProject = (projectId: string, roleTitle: string, statement: string): { success: boolean; message: string } => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return { success: false, message: 'Project not found.' };

    const alreadyApplied = applications.some(
      a => a.projectId === projectId && a.applicantId === currentUser.id && a.status !== 'Withdrawn'
    );
    if (alreadyApplied) {
      return { success: false, message: 'You have already submitted an active application for this project.' };
    }

    const match = calculateMatchScore(currentUser, project);
    const newApp: Application = {
      id: `app-${Date.now()}`,
      projectId: project.id,
      projectTitle: project.title,
      projectCategory: project.category,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantAvatar: currentUser.avatar,
      applicantDepartment: currentUser.department,
      applicantSemester: currentUser.semester,
      applicantSkills: currentUser.skills.map(s => s.name),
      roleApplied: roleTitle,
      statement,
      appliedAt: new Date().toISOString(),
      status: 'Pending',
      matchScore: match.score,
      matchReasons: [
        `${match.matchedSkills.length} required skill overlap`,
        `Estimated compatibility: ${match.score}%`,
        `Role preference fit`
      ]
    };

    const nextApps = [newApp, ...applications];
    setApplications(nextApps);
    try {
      localStorage.setItem('sb_applications', JSON.stringify(nextApps));
    } catch {}

    // Async sync with live backend
    applicationsApi.create(projectId, roleTitle, statement).catch(() => {});

    showNotification('Application Submitted', `Your application for "${roleTitle}" on "${project.title}" has been sent.`);
    return { success: true, message: 'Application submitted successfully.' };
  };

  const withdrawApplication = async (applicationId: string) => {
    try {
      await applicationsApi.withdraw(applicationId);
    } catch {}

    const nextApps = applications.map(a => 
      a.id === applicationId ? { ...a, status: 'Withdrawn' as const } : a
    );
    setApplications(nextApps);
    try {
      localStorage.setItem('sb_applications', JSON.stringify(nextApps));
    } catch {}
    showNotification('Application Withdrawn', 'Your application was withdrawn.', 'info');
  };

  const acceptApplication = async (applicationId: string) => {
    const targetApp = applications.find(a => a.id === applicationId);
    if (!targetApp) return;

    try {
      await applicationsApi.action(applicationId, 'accept');
    } catch (err: any) {
      if (!err.message?.includes('Failed to fetch') && !err.message?.includes('NetworkError') && !err.message?.includes('404')) {
        showNotification('Action Failed', err.message, 'error');
        return;
      }
    }

    // Update application status
    const nextApps = applications.map(a => 
      a.id === applicationId ? { ...a, status: 'Accepted' as const } : a
    );
    setApplications(nextApps);

    // Update project team member list
    setProjects(prevProjects => prevProjects.map(proj => {
      if (proj.id === targetApp.projectId) {
        const alreadyMember = proj.currentMembers.some(m => m.studentId === targetApp.applicantId);
        if (!alreadyMember) {
          return {
            ...proj,
            teamSize: {
              ...proj.teamSize,
              current: Math.min(proj.teamSize.max, proj.teamSize.current + 1)
            },
            currentMembers: [
              ...proj.currentMembers,
              {
                studentId: targetApp.applicantId,
                name: targetApp.applicantName,
                role: targetApp.roleApplied,
                avatar: targetApp.applicantAvatar,
                department: targetApp.applicantDepartment
              }
            ]
          };
        }
      }
      return proj;
    }));

    try {
      localStorage.setItem('sb_applications', JSON.stringify(nextApps));
    } catch {}
    showNotification('Application Accepted', `${targetApp.applicantName} has joined the team for "${targetApp.projectTitle}".`);
  };

  const rejectApplication = async (applicationId: string) => {
    const targetApp = applications.find(a => a.id === applicationId);
    if (!targetApp) return;

    try {
      await applicationsApi.action(applicationId, 'reject');
    } catch (err: any) {
      if (!err.message?.includes('Failed to fetch') && !err.message?.includes('NetworkError') && !err.message?.includes('404')) {
        showNotification('Action Failed', err.message, 'error');
        return;
      }
    }

    const nextApps = applications.map(a => 
      a.id === applicationId ? { ...a, status: 'Rejected' as const } : a
    );
    setApplications(nextApps);
    try {
      localStorage.setItem('sb_applications', JSON.stringify(nextApps));
    } catch {}
    showNotification('Application Declined', `Application from ${targetApp.applicantName} was declined.`, 'info');
  };

  const sendInvitation = (studentId: string, projectId: string, role: string, message: string): { success: boolean; message: string } => {
    const targetStudent = students.find(s => s.id === studentId);
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetStudent || !targetProject) {
      return { success: false, message: 'Invalid student or project.' };
    }

    const newInv: Invitation = {
      id: `inv-${Date.now()}`,
      projectId: targetProject.id,
      projectTitle: targetProject.title,
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId: targetStudent.id,
      receiverName: targetStudent.name,
      role,
      message,
      sentAt: new Date().toISOString(),
      status: 'Pending'
    };

    const nextInvs = [newInv, ...invitations];
    setInvitations(nextInvs);
    try {
      localStorage.setItem('sb_invitations', JSON.stringify(nextInvs));
    } catch {}

    // Async sync with live backend
    invitationsApi.send(studentId, projectId, role, message).catch(() => {});

    showNotification('Invitation Sent', `Invitation sent to ${targetStudent.name} for "${role}".`);
    return { success: true, message: 'Invitation sent successfully.' };
  };

  const acceptInvitation = async (invitationId: string) => {
    const inv = invitations.find(i => i.id === invitationId);
    if (!inv) return;

    try {
      await invitationsApi.action(invitationId, 'accept');
    } catch {}

    const nextInvs = invitations.map(i => 
      i.id === invitationId ? { ...i, status: 'Accepted' as const } : i
    );
    setInvitations(nextInvs);

    // Add currentUser to project
    setProjects(prev => prev.map(p => {
      if (p.id === inv.projectId) {
        return {
          ...p,
          teamSize: {
            ...p.teamSize,
            current: Math.min(p.teamSize.max, p.teamSize.current + 1)
          },
          currentMembers: [
            ...p.currentMembers,
            {
              studentId: currentUser.id,
              name: currentUser.name,
              role: inv.role,
              avatar: currentUser.avatar,
              department: currentUser.department
            }
          ]
        };
      }
      return p;
    }));

    try {
      localStorage.setItem('sb_invitations', JSON.stringify(nextInvs));
    } catch {}
    showNotification('Invitation Accepted', `You have joined the team for "${inv.projectTitle}"!`);
  };

  const declineInvitation = async (invitationId: string) => {
    const inv = invitations.find(i => i.id === invitationId);
    if (!inv) return;

    try {
      await invitationsApi.action(invitationId, 'decline');
    } catch {}

    const nextInvs = invitations.map(i => 
      i.id === invitationId ? { ...i, status: 'Declined' as const } : i
    );
    setInvitations(nextInvs);
    try {
      localStorage.setItem('sb_invitations', JSON.stringify(nextInvs));
    } catch {}
    showNotification('Invitation Declined', 'You have declined the team invitation.', 'info');
  };

  return (
    <SkillBridgeContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        students,
        projects,
        applications,
        invitations,
        notifications,
        dismissNotification,
        showNotification,
        login,
        signup,
        logout,
        updateProfile,
        applyToProject,
        withdrawApplication,
        acceptApplication,
        rejectApplication,
        sendInvitation,
        acceptInvitation,
        declineInvitation,
      }}
    >
      {children}
    </SkillBridgeContext.Provider>
  );
}

export function useSkillBridge() {
  const context = useContext(SkillBridgeContext);
  if (!context) {
    throw new Error('useSkillBridge must be used within a SkillBridgeProvider');
  }
  return context;
}
