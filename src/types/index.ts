export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface StudentSkill {
  name: string;
  level: SkillLevel;
  category: 'Frontend' | 'Backend' | 'AI/ML' | 'Mobile' | 'Design' | 'Data' | 'DevOps' | 'Core';
}

export interface StudentProject {
  title: string;
  role: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface StudentAvailability {
  hoursPerWeek: number;
  status: 'Actively Looking' | 'Open to Offers' | 'Limited Availability' | 'Unavailable';
  note?: string;
}

export interface Student {
  id: string;
  name: string;
  avatar: string;
  email: string;
  department: string;
  semester: number;
  college: string;
  headline: string;
  bio: string;
  skills: StudentSkill[];
  interests: string[];
  availability: StudentAvailability;
  preferredRoles: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  completedProjects: StudentProject[];
  stats: {
    projectsCompleted: number;
    hackathonsWon: number;
    reliabilityRating: number; // e.g. 4.9
    endorsedSkillsCount: number;
  };
}

export type ProjectCategory = 
  | 'Hackathon' 
  | 'Capstone' 
  | 'Coursework' 
  | 'Open Source' 
  | 'Research' 
  | 'Startup';

export interface ProjectRole {
  id: string;
  title: string;
  spots: number;
  filled: number;
  skills: string[];
  description: string;
}

export interface ProjectTeamMember {
  studentId: string;
  name: string;
  role: string;
  avatar: string;
  department: string;
  isOwner?: boolean;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerDepartment: string;
  teamSize: {
    current: number;
    max: number;
  };
  duration: string;
  deadline: string;
  requiredSkills: string[];
  preferredInterests: string[];
  openRoles: ProjectRole[];
  currentMembers: ProjectTeamMember[];
  status: 'Recruiting' | 'In Progress' | 'Completed';
  createdAt: string;
  featured?: boolean;
}

export type ApplicationStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface Application {
  id: string;
  projectId: string;
  projectTitle: string;
  projectCategory: ProjectCategory;
  applicantId: string;
  applicantName: string;
  applicantAvatar: string;
  applicantDepartment: string;
  applicantSemester: number;
  applicantSkills: string[];
  roleApplied: string;
  statement: string;
  appliedAt: string;
  status: ApplicationStatus;
  matchScore: number;
  matchReasons: string[];
}

export type InvitationStatus = 'Pending' | 'Accepted' | 'Declined';

export interface Invitation {
  id: string;
  projectId: string;
  projectTitle: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  role: string;
  message: string;
  sentAt: string;
  status: InvitationStatus;
}

export interface MatchScoreResult {
  score: number;
  label: 'Outstanding Fit' | 'Strong Fit' | 'Moderate Fit' | 'Growth Opportunity';
  matchedSkills: string[];
  missingSkills: string[];
  matchedInterests: string[];
  explanation: string;
}
