/**
 * SkillBridge API Client
 * Connects Next.js frontend with FastAPI backend.
 * Provides typed methods with token handling and error responses.
 */

import { Student, Project, Application, Invitation } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb_token');
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('sb_token', token);
  } else {
    localStorage.removeItem('sb_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Fallback to status text
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// ── Auth API ──
export const authApi = {
  async signup(data: { name: string; email: string; password: string; department: string; semester: number }) {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      department: data.department,
      semester: Number(data.semester),
    };
    const res = await request<{ access_token: string; user: { id: number; email: string; role: string } }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(res.access_token);
    return res;
  },

  async login(email: string, pass: string) {
    const res = await request<{ access_token: string; user: { id: number; email: string; role: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    setAuthToken(res.access_token);
    return res;
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  async getMe() {
    return request<{ id: number; email: string; role: string }>('/api/auth/me');
  },
};

// ── Students API ──
export const studentsApi = {
  async list(filters?: { department?: string; semester?: number; skill?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department);
    if (filters?.semester) params.append('semester', String(filters.semester));
    if (filters?.skill) params.append('skill', filters.skill);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Student[]>(`/api/students${qs}`);
  },

  async getMyProfile() {
    return request<Student>('/api/students/me');
  },

  async getById(studentId: number | string) {
    const numericId = typeof studentId === 'string' ? studentId.replace('student-', '') : studentId;
    return request<Student>(`/api/students/${numericId}`);
  },

  async updateMyProfile(updated: Partial<Student>) {
    return request<Student>('/api/students/me', {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
  },

  async uploadAvatar(file: File) {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/students/me/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) throw new Error('Avatar upload failed');
    return res.json();
  },
};

// ── Projects API ──
export const projectsApi = {
  async list(filters?: { category?: string; status?: string; search?: string; skill?: string }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.skill) params.append('skill', filters.skill);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Project[]>(`/api/projects${qs}`);
  },

  async getById(projectId: number | string) {
    const numericId = typeof projectId === 'string' ? projectId.replace('proj-', '') : projectId;
    return request<Project>(`/api/projects/${numericId}`);
  },

  async create(project: Partial<Project>) {
    return request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  async update(projectId: number | string, updated: Partial<Project>) {
    const numericId = typeof projectId === 'string' ? projectId.replace('proj-', '') : projectId;
    return request<Project>(`/api/projects/${numericId}`, {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
  },
};

// ── Applications API ──
export const applicationsApi = {
  async create(projectId: number | string, roleApplied: string, statement: string) {
    const numericId = typeof projectId === 'string' ? parseInt(projectId.replace('proj-', ''), 10) : projectId;
    return request<Application>('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        project_id: numericId,
        role_applied: roleApplied,
        statement,
      }),
    });
  },

  async getMyApplications() {
    return request<Application[]>('/api/applications/my');
  },

  async getReceivedApplications() {
    return request<Application[]>('/api/applications/received');
  },

  async action(applicationId: number | string, action: 'accept' | 'reject') {
    const numericId = typeof applicationId === 'string' ? parseInt(applicationId.replace('app-', ''), 10) : applicationId;
    return request<Application>(`/api/applications/${numericId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  async withdraw(applicationId: number | string) {
    const numericId = typeof applicationId === 'string' ? parseInt(applicationId.replace('app-', ''), 10) : applicationId;
    return request<{ message: string; success: boolean }>(`/api/applications/${numericId}/withdraw`, {
      method: 'POST',
    });
  },
};

// ── Invitations API ──
export const invitationsApi = {
  async send(studentId: number | string, projectId: number | string, role: string, message: string) {
    const sId = typeof studentId === 'string' ? parseInt(studentId.replace('student-', ''), 10) : studentId;
    const pId = typeof projectId === 'string' ? parseInt(projectId.replace('proj-', ''), 10) : projectId;
    return request<Invitation>('/api/invitations', {
      method: 'POST',
      body: JSON.stringify({
        student_id: sId,
        project_id: pId,
        role,
        message,
      }),
    });
  },

  async getMyInvitations() {
    return request<Invitation[]>('/api/invitations/my');
  },

  async action(invitationId: number | string, action: 'accept' | 'decline') {
    const numericId = typeof invitationId === 'string' ? parseInt(invitationId.replace('inv-', ''), 10) : invitationId;
    return request<Invitation>(`/api/invitations/${numericId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },
};

// ── Teams API ──
export const teamsApi = {
  async getMyTeams() {
    return request<any[]>('/api/teams/my');
  },

  async getProjectMembers(projectId: number | string) {
    const numericId = typeof projectId === 'string' ? projectId.replace('proj-', '') : projectId;
    return request<any[]>(`/api/teams/${numericId}/members`);
  },
};

