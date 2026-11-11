'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Student, Project, Application, Invitation } from '@/types';
import { MOCK_STUDENTS, MOCK_PROJECTS, MOCK_APPLICATIONS, MOCK_INVITATIONS, CURRENT_USER_ID } from '@/data/mockData';
import { calculateMatchScore } from '@/lib/matching';
import {
  ApiError,
  setAuthToken,
  authApi,
  studentsApi,
  projectsApi,
  applicationsApi,
  invitationsApi,
} from '@/lib/api';

const STORAGE_KEYS = {
  token: 'sb_token',
  auth: 'sb_auth',
  currentUser: 'sb_current_user',
  projects: 'sb_projects',
  applications: 'sb_applications',
  invitations: 'sb_invitations',
};

function clearStoredSession() {
  try {
    setAuthToken(null);
    localStorage.setItem(STORAGE_KEYS.auth, 'false');
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    localStorage.removeItem(STORAGE_KEYS.applications);
    localStorage.removeItem(STORAGE_KEYS.invitations);
  } catch {}
}

function mergeApplications(mine: Application[] | null, received: Application[] | null): Application[] {
  const byId = new Map<string, Application>();
  for (const app of mine || []) byId.set(app.id, app);
  for (const app of received || []) byId.set(app.id, app);
  return Array.from(byId.values());
}

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface SkillBridgeContextType {
  currentUser: Student;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  students: Student[];
  projects: Project[];
  applications: Application[];
  invitations: Invitation[];
  notifications: ToastNotification[];
  dismissNotification: (id: string) => void;
  showNotification: (title: string, message: string, type?: ToastNotification['type']) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: { name: string; email: string; password: string; department: string; semester: number; college?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string, newPass: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  createProject: (data: {
    title: string;
    tagline?: string;
    description: string;
    category: string;
    maxTeamSize: number;
    duration?: string;
    deadline?: string;
    requiredSkills: string[];
    preferredInterests?: string[];
    openRoles: {
      title: string;
      spots: number;
      description?: string;
      skills: string[];
    }[];
  }) => Promise<{ success: boolean; project?: Project; error?: string }>;
  updateProfile: (updated: Partial<Student>) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; avatarUrl?: string; error?: string }>;
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
  const currentUserRef = useRef<string | number>('0');
  // Sync ref after initial render to avoid "Cannot access refs during render"
  useEffect(() => {
    currentUserRef.current = currentUser.id;
  }, []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [invitations, setInvitations] = useState<Invitation[]>(MOCK_INVITATIONS);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const applyAuthenticatedState = (params: {
    myProfile: Student;
    liveProjects: Project[] | null;
    liveStudents: Student[] | null;
    myApps: Application[] | null;
    receivedApps: Application[] | null;
    myInvs: Invitation[] | null;
  }) => {
    const { myProfile, liveProjects, liveStudents, myApps, receivedApps, myInvs } = params;
    const nextApps = mergeApplications(myApps, receivedApps);
    const nextInvs = Array.isArray(myInvs) ? myInvs : [];

    setCurrentUser(myProfile);
    setIsAuthenticated(true);
    if (Array.isArray(liveProjects)) {
      setProjects(liveProjects);
      try {
        localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(liveProjects));
      } catch {}
    }
    if (Array.isArray(liveStudents) && liveStudents.length > 0) {
      setStudents(liveStudents);
    }
    setApplications(nextApps);
    setInvitations(nextInvs);

    try {
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(myProfile));
      localStorage.setItem(STORAGE_KEYS.auth, 'true');
      localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(nextApps));
      localStorage.setItem(STORAGE_KEYS.invitations, JSON.stringify(nextInvs));
    } catch {}
  };

  // Load initial data from backend with safe local fallback
  useEffect(() => {
    async function initData() {
      // Phase 1: Read from localStorage first for instant render
      let hasStoredAuth = false;
      let storedUser: Student | null = null;
      let token: string | null = null;

      try {
        token = localStorage.getItem(STORAGE_KEYS.token);
        const savedAuth = localStorage.getItem(STORAGE_KEYS.auth);
        hasStoredAuth = Boolean(token && savedAuth !== 'false');

        const savedUser = localStorage.getItem(STORAGE_KEYS.currentUser);
        if (savedUser) {
          try {
            storedUser = JSON.parse(savedUser);
          } catch {}
        }

        if (hasStoredAuth && storedUser) {
          setIsAuthenticated(true);
          setCurrentUser(storedUser);
        }

        const savedProjects = localStorage.getItem(STORAGE_KEYS.projects);
        if (savedProjects) {
          try {
            const parsed = JSON.parse(savedProjects);
            if (Array.isArray(parsed) && parsed.length > 0) setProjects(parsed);
          } catch {}
        }

        const savedApps = localStorage.getItem(STORAGE_KEYS.applications);
        if (savedApps) {
          try {
            const parsed = JSON.parse(savedApps);
            if (Array.isArray(parsed)) setApplications(parsed);
          } catch {}
        }

        const savedInvs = localStorage.getItem(STORAGE_KEYS.invitations);
        if (savedInvs) {
          try {
            const parsed = JSON.parse(savedInvs);
            if (Array.isArray(parsed)) setInvitations(parsed);
          } catch {}
        }
      } catch {
        // LocalStorage access fallback
      }

      // Phase 2: Fetch authoritative live data from backend
      try {
        const [liveProjects, liveStudents] = await Promise.all([
          projectsApi.list().catch(() => null),
          studentsApi.list().catch(() => null),
        ]);

        if (Array.isArray(liveProjects)) {
          setProjects(liveProjects);
          try {
            localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(liveProjects));
          } catch {}
        }

        if (Array.isArray(liveStudents) && liveStudents.length > 0) {
          setStudents(liveStudents);
        }

        if (token && hasStoredAuth) {
          try {
            const [myProfile, myApps, receivedApps, myInvs] = await Promise.all([
              studentsApi.getMyProfile(),
              applicationsApi.getMyApplications().catch(() => null),
              applicationsApi.getReceivedApplications().catch(() => null),
              invitationsApi.getMyInvitations().catch(() => null),
            ]);

            const nextApps = mergeApplications(myApps, receivedApps);
            const nextInvs = Array.isArray(myInvs) ? myInvs : [];

            setCurrentUser(myProfile);
            setIsAuthenticated(true);
            setApplications(nextApps);
            setInvitations(nextInvs);

            try {
              localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(myProfile));
              localStorage.setItem(STORAGE_KEYS.auth, 'true');
              localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(nextApps));
              localStorage.setItem(STORAGE_KEYS.invitations, JSON.stringify(nextInvs));
            } catch {}
          } catch (profileErr: any) {
            const isAuthRejection =
              profileErr instanceof ApiError &&
              (profileErr.status === 401 || profileErr.status === 403 || profileErr.status === 404);

            if (isAuthRejection || !storedUser) {
              // Explicitly clear stale/invalid credentials — never keep unverified auth state after 401
              clearStoredSession();
              setCurrentUser(MOCK_STUDENTS[0]);
              setApplications([]);
              setInvitations([]);
              setIsAuthenticated(false);
            } else {
              // Transient network outage with locally cached profile
              setIsAuthenticated(true);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        // Backend offline or unreachable — continues with cached data
      }

      // ONLY mark auth as ready AFTER both phases complete
      // This prevents useProtectedRoute from redirecting
      // when phase 2 later clears isAuthenticated on 401
      setIsAuthReady(true);
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

  const syncAuthenticatedSession = async (): Promise<Student> => {
    try {
      const [myProfile, liveProjects, liveStudents, myApps, receivedApps, myInvs] = await Promise.all([
        studentsApi.getMyProfile(),
        projectsApi.list().catch(() => null),
        studentsApi.list().catch(() => null),
        applicationsApi.getMyApplications().catch(() => null),
        applicationsApi.getReceivedApplications().catch(() => null),
        invitationsApi.getMyInvitations().catch(() => null),
      ]);

      applyAuthenticatedState({
        myProfile,
        liveProjects,
        liveStudents,
        myApps,
        receivedApps,
        myInvs,
      });

      return myProfile;
    } catch (err) {
      clearStoredSession();
      setCurrentUser(MOCK_STUDENTS[0]);
      setApplications([]);
      setInvitations([]);
      setIsAuthenticated(false);
      throw err;
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await authApi.login(cleanEmail, pass);
      const myProfile = await syncAuthenticatedSession();
      showNotification('Welcome back!', `Signed in as ${myProfile.name}`);
      return { success: true };
    } catch (err: any) {
      showNotification('Sign In Failed', err.message || 'Invalid credentials or server unavailable.', 'error');
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const resetPassword = async (email: string, newPass: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await authApi.resetPassword(email.trim().toLowerCase(), newPass);
      showNotification('Password Reset', res.message || 'Password updated successfully. You can now sign in.');
      return { success: true, message: res.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset failed.' };
    }
  };

  const signup = async (data: { name: string; email: string; password: string; department: string; semester: number; college?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      await authApi.signup({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        department: data.department.trim(),
        semester: Number(data.semester),
        college: data.college,
      });

      const myProfile = await syncAuthenticatedSession();
      showNotification('Account Created', `Welcome to SkillBridge, ${myProfile.name}!`);
      return { success: true };
    } catch (err: any) {
      showNotification('Signup Failed', err.message || 'Registration failed.', 'error');
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const createProject = async (data: {
    title: string;
    tagline?: string;
    description: string;
    category: string;
    maxTeamSize: number;
    duration?: string;
    deadline?: string;
    requiredSkills: string[];
    preferredInterests?: string[];
    openRoles: {
      title: string;
      spots: number;
      description?: string;
      skills: string[];
    }[];
  }): Promise<{ success: boolean; project?: Project; error?: string }> => {
    try {
      const created = await projectsApi.create({
        title: data.title,
        tagline: data.tagline,
        description: data.description,
        category: data.category as any,
        maxTeamSize: data.maxTeamSize,
        duration: data.duration,
        deadline: data.deadline,
        requiredSkills: data.requiredSkills,
        preferredInterests: data.preferredInterests || [],
        openRoles: data.openRoles.map((r, i) => ({
          id: `role-${Date.now()}-${i}`,
          title: r.title,
          spots: r.spots,
          filled: 0,
          description: r.description || '',
          skills: r.skills,
        })),
        status: 'Recruiting',
      });

      // Synchronize with fresh server state so all discovery boards and dashboard are in sync
      const liveProjects = await projectsApi.list().catch(() => null);
      const nextProjects = (liveProjects && liveProjects.length > 0) ? liveProjects : [created, ...projects];
      setProjects(nextProjects);
      try {
        localStorage.setItem('sb_projects', JSON.stringify(nextProjects));
      } catch {}

      showNotification('Project Created', `"${data.title}" is now open for teammate applications!`);
      return { success: true, project: created };
    } catch (err: any) {
      showNotification('Project Creation Failed', err.message || 'Unable to publish project to server.', 'error');
      return { success: false, error: err.message || 'Could not save project.' };
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    clearStoredSession();
    setIsAuthenticated(false);
    setCurrentUser(MOCK_STUDENTS[0]);
    setApplications([]);
    setInvitations([]);
    showNotification('Signed Out', 'You have been signed out of your session.', 'info');
  };

  const updateProfile = async (updated: Partial<Student>): Promise<{ success: boolean; error?: string }> => {
    try {
      const saved = await studentsApi.updateMyProfile(updated);
      setCurrentUser(saved);
      setStudents(prev => prev.map(s => s.id === saved.id ? { ...s, ...saved } : s));
      try {
        localStorage.setItem('sb_current_user', JSON.stringify(saved));
      } catch {}
      showNotification('Profile Updated', 'Your profile details and skills have been saved.');
      return { success: true };
    } catch (err: any) {
      showNotification('Profile Update Failed', err.message || 'Could not save changes to server.', 'error');
      return { success: false, error: err.message || 'Profile update failed' };
    }
  };

  const uploadAvatar = async (file: File): Promise<{ success: boolean; avatarUrl?: string; error?: string }> => {
    try {
      const res = await studentsApi.uploadAvatar(file);
      let newAvatarUrl = res.avatar_url;
      if (newAvatarUrl && newAvatarUrl.startsWith('/uploads/')) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        newAvatarUrl = `${apiBase}${newAvatarUrl}`;
      }

      // Re-fetch complete authoritative profile from server to guarantee sync
      const freshProfile = await studentsApi.getMyProfile().catch(() => null);
      if (freshProfile) {
        setCurrentUser(freshProfile);
        try {
          localStorage.setItem('sb_current_user', JSON.stringify(freshProfile));
        } catch {}
        setStudents(prev => prev.map(s => s.id === freshProfile.id ? freshProfile : s));
      } else if (newAvatarUrl) {
        setCurrentUser(prev => {
          const updated = { ...prev, avatar: newAvatarUrl };
          try {
            localStorage.setItem('sb_current_user', JSON.stringify(updated));
          } catch {}
          return updated;
        });
        setStudents(prev => prev.map(s => s.id === currentUserRef.current ? { ...s, avatar: newAvatarUrl } : s));
      }

      showNotification('Photo Updated', 'Your profile photo has been uploaded successfully.');
      return { success: true, avatarUrl: newAvatarUrl };
    } catch (err: any) {
      showNotification('Photo Upload Failed', err.message || 'Failed to upload photo to storage.', 'error');
      return { success: false, error: err.message || 'Avatar upload failed' };
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
        isAuthReady,
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
        resetPassword,
        createProject,
        updateProfile,
        uploadAvatar,
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

export function useProtectedRoute() {
  const { isAuthenticated, isAuthReady } = useSkillBridge();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthReady, isAuthenticated, router]);

  return { isAuthenticated, isAuthReady };
}
