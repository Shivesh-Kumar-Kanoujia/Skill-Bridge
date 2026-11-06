import { Student, Project, Application, Invitation } from '@/types';

export const CURRENT_USER_ID = 'student-1';

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'student-1',
    name: 'Aarav Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: 'aarav.sharma@apex.edu',
    department: 'Computer Science & Engineering',
    semester: 5,
    college: 'Apex Institute of Technology',
    headline: 'Full-Stack Developer & Design-Oriented Engineer',
    bio: 'Passionate about crafting intuitive web interfaces and scalable backend services. Previously built a peer tutoring platform and led frontend development for the 2025 Inter-College Hackathon winning team.',
    skills: [
      { name: 'React', level: 'Advanced', category: 'Frontend' },
      { name: 'TypeScript', level: 'Advanced', category: 'Frontend' },
      { name: 'Next.js', level: 'Intermediate', category: 'Frontend' },
      { name: 'Node.js', level: 'Intermediate', category: 'Backend' },
      { name: 'PostgreSQL', level: 'Intermediate', category: 'Data' },
      { name: 'Tailwind CSS', level: 'Advanced', category: 'Frontend' },
      { name: 'Figma', level: 'Intermediate', category: 'Design' },
      { name: 'Git', level: 'Advanced', category: 'Core' }
    ],
    interests: ['Web Development', 'UI/UX Design', 'Hackathons', 'EdTech', 'Open Source'],
    availability: {
      hoursPerWeek: 15,
      status: 'Actively Looking',
      note: 'Available weekday evenings and full weekends for high-impact projects.'
    },
    preferredRoles: ['Frontend Lead', 'Full-Stack Developer', 'UI Designer'],
    githubUrl: 'https://github.com/aaravsharma-dev',
    linkedinUrl: 'https://linkedin.com/in/aaravsharma',
    portfolioUrl: 'https://aaravsharma.me',
    completedProjects: [
      {
        title: 'PeerTutor Connect',
        role: 'Full-Stack Lead',
        description: 'An open-source peer tutoring marketplace used by 400+ campus students during finals week.',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
        link: 'https://github.com/example/peertutor'
      },
      {
        title: 'CampusWay Mobile App',
        role: 'Frontend Developer',
        description: 'Indoor navigation and classroom locator for university freshmen.',
        technologies: ['React Native', 'TypeScript', 'Mapbox']
      }
    ],
    stats: {
      projectsCompleted: 4,
      hackathonsWon: 2,
      reliabilityRating: 4.9,
      endorsedSkillsCount: 14
    }
  },
  {
    id: 'student-2',
    name: 'Priya Nandakumar',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    email: 'priya.n@apex.edu',
    department: 'Artificial Intelligence & Data Science',
    semester: 6,
    college: 'Apex Institute of Technology',
    headline: 'Machine Learning Researcher & Python Developer',
    bio: 'Specializing in computer vision and natural language processing. Looking for teammates to compete in national AI hackathons and develop semester capstone systems.',
    skills: [
      { name: 'Python', level: 'Advanced', category: 'Core' },
      { name: 'PyTorch', level: 'Advanced', category: 'AI/ML' },
      { name: 'scikit-learn', level: 'Advanced', category: 'AI/ML' },
      { name: 'FastAPI', level: 'Intermediate', category: 'Backend' },
      { name: 'Pandas', level: 'Advanced', category: 'Data' },
      { name: 'Docker', level: 'Intermediate', category: 'DevOps' }
    ],
    interests: ['AI/ML', 'Computer Vision', 'Healthcare Tech', 'Research', 'Hackathons'],
    availability: {
      hoursPerWeek: 18,
      status: 'Actively Looking',
      note: 'Excited for intensive hackathon sprints and research prototypes.'
    },
    preferredRoles: ['ML Engineer', 'Data Scientist', 'Backend Developer'],
    githubUrl: 'https://github.com/priyan-ai',
    linkedinUrl: 'https://linkedin.com/in/priyanandakumar',
    completedProjects: [
      {
        title: 'Retinal Disease Classifier',
        role: 'Lead ML Engineer',
        description: 'Deep learning pipeline achieving 94.2% accuracy on diabetic retinopathy screening.',
        technologies: ['PyTorch', 'FastAPI', 'OpenCV', 'Docker']
      }
    ],
    stats: {
      projectsCompleted: 5,
      hackathonsWon: 3,
      reliabilityRating: 4.95,
      endorsedSkillsCount: 19
    }
  },
  {
    id: 'student-3',
    name: 'Rohan Deshmukh',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    email: 'rohan.d@apex.edu',
    department: 'Electronics & Communication',
    semester: 6,
    college: 'Apex Institute of Technology',
    headline: 'Embedded Systems & IoT Hardware Engineer',
    bio: 'Firmware enthusiast working on ESP32, STM32, and sensor networks. Seeking software teammates who can build sleek web dashboards for physical hardware integrations.',
    skills: [
      { name: 'C/C++', level: 'Advanced', category: 'Core' },
      { name: 'Embedded C', level: 'Advanced', category: 'Core' },
      { name: 'ESP32 / Arduino', level: 'Advanced', category: 'DevOps' },
      { name: 'MQTT / LoRaWAN', level: 'Intermediate', category: 'Backend' },
      { name: 'Python', level: 'Intermediate', category: 'Core' },
      { name: 'PCB Design (KiCad)', level: 'Intermediate', category: 'Design' }
    ],
    interests: ['IoT', 'Robotics', 'Hardware', 'Smart Campus', 'CleanTech'],
    availability: {
      hoursPerWeek: 12,
      status: 'Open to Offers',
      note: 'Hardware lab access available during weekdays.'
    },
    preferredRoles: ['Hardware Lead', 'IoT Firmware Engineer', 'Systems Architect'],
    githubUrl: 'https://github.com/rohan-embed',
    completedProjects: [
      {
        title: 'Smart Solar Inverter Monitor',
        role: 'Hardware Designer',
        description: 'Low-cost Wi-Fi telemetry logger transmitting power output to local MQTT broker.',
        technologies: ['ESP32', 'C++', 'MQTT', 'Grafana']
      }
    ],
    stats: {
      projectsCompleted: 3,
      hackathonsWon: 1,
      reliabilityRating: 4.8,
      endorsedSkillsCount: 11
    }
  },
  {
    id: 'student-4',
    name: 'Ananya Verma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    email: 'ananya.v@apex.edu',
    department: 'Design & Human-Computer Interaction',
    semester: 4,
    college: 'Apex Institute of Technology',
    headline: 'Product Designer, Design Systems & Usability Researcher',
    bio: 'Bridging engineering and user empathy. I design clean typographic systems, design tokens, and conduct user testing sessions for student and startup projects.',
    skills: [
      { name: 'Figma', level: 'Advanced', category: 'Design' },
      { name: 'UI/UX Design', level: 'Advanced', category: 'Design' },
      { name: 'Design Systems', level: 'Advanced', category: 'Design' },
      { name: 'User Research', level: 'Intermediate', category: 'Design' },
      { name: 'HTML/CSS', level: 'Intermediate', category: 'Frontend' },
      { name: 'Prototyping', level: 'Advanced', category: 'Design' }
    ],
    interests: ['UI/UX Design', 'Design Systems', 'Accessibility', 'Mobile Apps', 'EdTech'],
    availability: {
      hoursPerWeek: 14,
      status: 'Actively Looking',
      note: 'Ready to design user journeys, high-fidelity prototypes, and design systems.'
    },
    preferredRoles: ['Product Designer', 'UI/UX Lead', 'User Researcher'],
    portfolioUrl: 'https://ananyaverma.design',
    linkedinUrl: 'https://linkedin.com/in/ananyaverma-design',
    completedProjects: [
      {
        title: 'Campus Library Self-Checkout UI',
        role: 'Lead UI/UX Designer',
        description: 'Redesigned the kiosk interface, reducing average checkout time by 38%.',
        technologies: ['Figma', 'User Testing', 'Design Tokens']
      }
    ],
    stats: {
      projectsCompleted: 6,
      hackathonsWon: 2,
      reliabilityRating: 4.9,
      endorsedSkillsCount: 16
    }
  },
  {
    id: 'student-5',
    name: 'Kabir Mehta',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    email: 'kabir.m@apex.edu',
    department: 'Computer Science & Engineering',
    semester: 7,
    college: 'Apex Institute of Technology',
    headline: 'Distributed Systems & Cloud Infrastructure Enthusiast',
    bio: 'Backend specialist focused on high-throughput microservices, Kubernetes clusters, and relational databases. Final year student preparing for production capstone deployment.',
    skills: [
      { name: 'Go (Golang)', level: 'Advanced', category: 'Backend' },
      { name: 'PostgreSQL', level: 'Advanced', category: 'Data' },
      { name: 'Docker', level: 'Advanced', category: 'DevOps' },
      { name: 'Kubernetes', level: 'Intermediate', category: 'DevOps' },
      { name: 'Redis', level: 'Intermediate', category: 'Backend' },
      { name: 'Linux Systems', level: 'Advanced', category: 'DevOps' }
    ],
    interests: ['Distributed Systems', 'Cloud Native', 'DevOps', 'Open Source', 'Fintech'],
    availability: {
      hoursPerWeek: 10,
      status: 'Limited Availability',
      note: 'Open for advisory roles or focused backend architecture consulting.'
    },
    preferredRoles: ['Backend Lead', 'DevOps Engineer', 'Database Architect'],
    githubUrl: 'https://github.com/kabirmehta-sys',
    completedProjects: [
      {
        title: 'EventPulse Distributed Queue',
        role: 'Systems Engineer',
        description: 'Lightweight message broker benchmarking 45,000 requests/sec on local cluster.',
        technologies: ['Go', 'Raft Consensus', 'Docker']
      }
    ],
    stats: {
      projectsCompleted: 7,
      hackathonsWon: 4,
      reliabilityRating: 4.85,
      endorsedSkillsCount: 22
    }
  },
  {
    id: 'student-6',
    name: 'Sanya Kapoor',
    avatar: 'https://images.unsplash.com/photo-1534751516642-a171ed28a0e5?w=150&auto=format&fit=crop&q=80',
    email: 'sanya.k@apex.edu',
    department: 'Information Science & Engineering',
    semester: 5,
    college: 'Apex Institute of Technology',
    headline: 'Mobile App Developer (Flutter & Swift)',
    bio: 'Building cross-platform mobile experiences that feel native. Strong interest in location-based services, peer-to-peer applications, and interactive campus utilities.',
    skills: [
      { name: 'Flutter', level: 'Advanced', category: 'Mobile' },
      { name: 'Dart', level: 'Advanced', category: 'Mobile' },
      { name: 'Firebase', level: 'Intermediate', category: 'Backend' },
      { name: 'REST APIs', level: 'Advanced', category: 'Backend' },
      { name: 'Swift', level: 'Beginner', category: 'Mobile' },
      { name: 'Git', level: 'Intermediate', category: 'Core' }
    ],
    interests: ['Mobile Apps', 'Fintech', 'Campus Utilities', 'Hackathons'],
    availability: {
      hoursPerWeek: 16,
      status: 'Actively Looking',
      note: 'Looking for a hackathon team for the upcoming National Smart Campus challenge.'
    },
    preferredRoles: ['Mobile Developer', 'Frontend Engineer', 'App Architect'],
    githubUrl: 'https://github.com/sanyakapoor-dev',
    completedProjects: [
      {
        title: 'DormMate Expense Splitter',
        role: 'Mobile Developer',
        description: 'Splitwise-alternative tailored for college hostel students with offline support.',
        technologies: ['Flutter', 'SQLite', 'Firebase']
      }
    ],
    stats: {
      projectsCompleted: 3,
      hackathonsWon: 1,
      reliabilityRating: 4.75,
      endorsedSkillsCount: 9
    }
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'EcoTrack: Campus Energy & Waste Analytics',
    tagline: 'IoT-connected campus sustainability dashboard tracking kilowatt hours, solar yield, and waste segregation.',
    description: `EcoTrack is a multidisciplinary capstone project collaborating with the Campus Facilities Office to install wireless sub-metering hardware across student hostels, academic blocks, and dining halls. 
    
We are building a responsive web portal where students can compare energy conservation across residences, while administrators analyze peak load patterns and solar generation ROI.

The project involves sensor integration, real-time data streaming over MQTT, an automated PostgreSQL time-series store, and an intuitive React/TypeScript frontend with live analytics charts.`,
    category: 'Capstone',
    ownerId: 'student-3',
    ownerName: 'Rohan Deshmukh',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    ownerDepartment: 'Electronics & Communication',
    teamSize: { current: 3, max: 5 },
    duration: '14 Weeks (Semester-long)',
    deadline: 'Oct 28, 2026',
    requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'FastAPI', 'PostgreSQL', 'MQTT'],
    preferredInterests: ['CleanTech', 'IoT', 'Smart Campus', 'Web Development'],
    openRoles: [
      {
        id: 'role-101',
        title: 'Frontend Lead Engineer',
        spots: 1,
        filled: 0,
        skills: ['React', 'TypeScript', 'Tailwind CSS'],
        description: 'Design and implement responsive live data charts, dorm leaderboards, and administrative controls.'
      },
      {
        id: 'role-102',
        title: 'Backend & Timeseries Specialist',
        spots: 1,
        filled: 0,
        skills: ['FastAPI', 'PostgreSQL', 'MQTT'],
        description: 'Set up ingestion pipelines for sensor packets, calculate hourly rolling averages, and build REST APIs.'
      }
    ],
    currentMembers: [
      {
        studentId: 'student-3',
        name: 'Rohan Deshmukh',
        role: 'Hardware Lead & Coordinator',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        department: 'Electronics & Communication',
        isOwner: true
      },
      {
        studentId: 'student-7',
        name: 'Tanya Basu',
        role: 'Firmware Engineer',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        department: 'Electronics & Communication'
      },
      {
        studentId: 'student-4',
        name: 'Ananya Verma',
        role: 'UI/UX Designer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        department: 'Design & HCI'
      }
    ],
    status: 'Recruiting',
    createdAt: '2026-10-14T09:30:00Z',
    featured: true
  },
  {
    id: 'proj-2',
    title: 'MedAssist AI: Low-Resource Clinical Voice Transcriber',
    tagline: 'Edge-capable multilingual speech recognition converting doctor-patient dialogues into structured SOAP notes.',
    description: `Addressing healthcare accessibility in rural primary health centers. Doctors often spend 40% of consultation time typing notes in English while patients speak regional dialects.

We are fine-tuning Whisper and local small language models (SLMs) to transcribe bilingual clinical conversations and extract structured prescriptions and vitals.

We need a competent frontend developer to build an offline-first doctor's desktop interface and an ML engineer to assist with quantization and evaluation benchmarks.`,
    category: 'Hackathon',
    ownerId: 'student-2',
    ownerName: 'Priya Nandakumar',
    ownerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    ownerDepartment: 'Artificial Intelligence & Data Science',
    teamSize: { current: 2, max: 4 },
    duration: '48-hour National AI Sprint',
    deadline: 'Nov 04, 2026',
    requiredSkills: ['Python', 'PyTorch', 'React', 'FastAPI', 'Tailwind CSS'],
    preferredInterests: ['AI/ML', 'Healthcare Tech', 'Research', 'Hackathons'],
    openRoles: [
      {
        id: 'role-201',
        title: 'Full-Stack UI Engineer',
        spots: 1,
        filled: 0,
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'FastAPI'],
        description: 'Build audio recording controls, real-time streaming transcript viewer, and editable SOAP note exporter.'
      },
      {
        id: 'role-202',
        title: 'ML Quantization Specialist',
        spots: 1,
        filled: 0,
        skills: ['Python', 'PyTorch', 'Docker'],
        description: 'Benchmark ONNX runtime latency and test regional language pronunciation tokens.'
      }
    ],
    currentMembers: [
      {
        studentId: 'student-2',
        name: 'Priya Nandakumar',
        role: 'Lead ML Researcher',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        department: 'AI & Data Science',
        isOwner: true
      },
      {
        studentId: 'student-8',
        name: 'Devansh Roy',
        role: 'NLP Engineer',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        department: 'Computer Science'
      }
    ],
    status: 'Recruiting',
    createdAt: '2026-10-16T14:15:00Z',
    featured: true
  },
  {
    id: 'proj-3',
    title: 'AuraRover: Open Source Ground Control Station',
    tagline: 'Telemetry telemetry visualizer and trajectory planner for autonomous campus rovers and drone competitions.',
    description: `AuraRover is the student robotics club's flagship software system. The rover participates in the University Rover Challenge, requiring robust real-time video feed latency under 120ms, waypoint plotting, and sensor diagnostics.

We are rewriting our desktop ground station using web technologies (React + WebSockets + WebGL) to allow collaborative control across multiple laptops during field trials.`,
    category: 'Open Source',
    ownerId: 'student-5',
    ownerName: 'Kabir Mehta',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    ownerDepartment: 'Computer Science & Engineering',
    teamSize: { current: 3, max: 6 },
    duration: 'Ongoing (Club Project)',
    deadline: 'Nov 15, 2026',
    requiredSkills: ['React', 'TypeScript', 'WebSockets', 'Go (Golang)', 'Docker'],
    preferredInterests: ['Robotics', 'Open Source', 'Distributed Systems'],
    openRoles: [
      {
        id: 'role-301',
        title: 'WebGL / Map Visualizer Developer',
        spots: 1,
        filled: 0,
        skills: ['React', 'TypeScript', 'Mapbox'],
        description: 'Implement 3D rover orientation compass and GPS waypoint mission planning layer.'
      },
      {
        id: 'role-302',
        title: 'Go Systems Networking Engineer',
        spots: 1,
        filled: 0,
        skills: ['Go (Golang)', 'WebSockets', 'Linux Systems'],
        description: 'Manage peer-to-peer radio packet framing and bridge ROS2 topic data to client sockets.'
      }
    ],
    currentMembers: [
      {
        studentId: 'student-5',
        name: 'Kabir Mehta',
        role: 'Systems Architect',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        department: 'Computer Science',
        isOwner: true
      }
    ],
    status: 'Recruiting',
    createdAt: '2026-10-10T11:00:00Z'
  },
  {
    id: 'proj-4',
    title: 'CampusRide: Peer-to-Peer Carpooling & Auto Pooling',
    tagline: 'Verified college student commuting network reducing metro shuttle costs and travel times.',
    description: `Every day over 3,000 day scholars commute between metro stations and the outer campus. Current options involve crowded buses or expensive solo auto rides.

CampusRide matches students traveling the same route at similar timetable slots, using college email verification and mutual class schedules to ensure safety and affordability.`,
    category: 'Startup',
    ownerId: 'student-6',
    ownerName: 'Sanya Kapoor',
    ownerAvatar: 'https://images.unsplash.com/photo-1534751516642-a171ed28a0e5?w=150&auto=format&fit=crop&q=80',
    ownerDepartment: 'Information Science & Engineering',
    teamSize: { current: 2, max: 4 },
    duration: '10 Weeks',
    deadline: 'Oct 30, 2026',
    requiredSkills: ['Flutter', 'Node.js', 'PostgreSQL', 'Figma', 'REST APIs'],
    preferredInterests: ['Mobile Apps', 'Campus Utilities', 'Fintech'],
    openRoles: [
      {
        id: 'role-401',
        title: 'Backend API Engineer',
        spots: 1,
        filled: 0,
        skills: ['Node.js', 'PostgreSQL', 'REST APIs'],
        description: 'Design route matching algorithms, ride creation, and student ID token authentication.'
      },
      {
        id: 'role-402',
        title: 'Product UI Designer',
        spots: 1,
        filled: 0,
        skills: ['Figma', 'UI/UX Design', 'Design Systems'],
        description: 'Create mobile screen workflows for ride booking, safety verification, and profile management.'
      }
    ],
    currentMembers: [
      {
        studentId: 'student-6',
        name: 'Sanya Kapoor',
        role: 'Lead Mobile Developer',
        avatar: 'https://images.unsplash.com/photo-1534751516642-a171ed28a0e5?w=150&auto=format&fit=crop&q=80',
        department: 'Information Science',
        isOwner: true
      }
    ],
    status: 'Recruiting',
    createdAt: '2026-10-12T16:45:00Z'
  },
  {
    id: 'proj-5',
    title: 'CodeReviewer: Automated Feedback on Student Lab Submissions',
    tagline: 'Pedagogical linter providing contextual hints and style recommendations for Data Structures labs.',
    description: `Teaching assistants currently spend hundreds of hours manually grading weekly C++ and Java coding assignments. CodeReviewer analyzes AST structures to detect common logic pitfalls, memory leaks, and algorithmic complexity issues without revealing direct answers.`,
    category: 'Coursework',
    ownerId: 'student-1',
    ownerName: 'Aarav Sharma',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    ownerDepartment: 'Computer Science & Engineering',
    teamSize: { current: 2, max: 4 },
    duration: '8 Weeks',
    deadline: 'Nov 12, 2026',
    requiredSkills: ['React', 'TypeScript', 'Python', 'Docker', 'PostgreSQL'],
    preferredInterests: ['EdTech', 'Web Development', 'Open Source'],
    openRoles: [
      {
        id: 'role-501',
        title: 'Backend & Sandbox Engineer',
        spots: 1,
        filled: 0,
        skills: ['Python', 'Docker', 'PostgreSQL'],
        description: 'Build isolated gVisor/Docker runner containers for student code execution and test pass verification.'
      },
      {
        id: 'role-502',
        title: 'Frontend Code Editor Developer',
        spots: 1,
        filled: 0,
        skills: ['React', 'TypeScript'],
        description: 'Integrate Monaco editor with inline lint annotations, test diff view, and hint drawer.'
      }
    ],
    currentMembers: [
      {
        studentId: 'student-1',
        name: 'Aarav Sharma',
        role: 'Project Lead & Frontend Engineer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        department: 'Computer Science & Engineering',
        isOwner: true
      }
    ],
    status: 'Recruiting',
    createdAt: '2026-10-15T18:00:00Z',
    featured: true
  }
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    projectId: 'proj-1',
    projectTitle: 'EcoTrack: Campus Energy & Waste Analytics',
    projectCategory: 'Capstone',
    applicantId: 'student-1',
    applicantName: 'Aarav Sharma',
    applicantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    applicantDepartment: 'Computer Science & Engineering',
    applicantSemester: 5,
    applicantSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Figma'],
    roleApplied: 'Frontend Lead Engineer',
    statement: 'I have deep experience with React, TypeScript, and live chart dashboards from my PeerTutor project. I am eager to help the campus reduce energy waste through clear visual metrics.',
    appliedAt: '2026-10-17T11:20:00Z',
    status: 'Pending',
    matchScore: 92,
    matchReasons: ['3/3 role skills matched', 'Active availability', 'Direct experience with React & design systems']
  },
  {
    id: 'app-2',
    projectId: 'proj-2',
    projectTitle: 'MedAssist AI: Low-Resource Clinical Voice Transcriber',
    projectCategory: 'Hackathon',
    applicantId: 'student-1',
    applicantName: 'Aarav Sharma',
    applicantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    applicantDepartment: 'Computer Science & Engineering',
    applicantSemester: 5,
    applicantSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
    roleApplied: 'Full-Stack UI Engineer',
    statement: 'Excited about the hackathon timeline. Can build a streamlined, keyboard-accessible web UI for medical audio review and export within 48 hours.',
    appliedAt: '2026-10-17T15:45:00Z',
    status: 'Pending',
    matchScore: 88,
    matchReasons: ['React & Tailwind matched', 'High reliability score (4.9)', 'Prior hackathon wins']
  },
  // Application received for Aarav's owned project (proj-5: CodeReviewer)
  {
    id: 'app-3',
    projectId: 'proj-5',
    projectTitle: 'CodeReviewer: Automated Feedback on Student Lab Submissions',
    projectCategory: 'Coursework',
    applicantId: 'student-2',
    applicantName: 'Priya Nandakumar',
    applicantAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    applicantDepartment: 'Artificial Intelligence & Data Science',
    applicantSemester: 6,
    applicantSkills: ['Python', 'Docker', 'FastAPI'],
    roleApplied: 'Backend & Sandbox Engineer',
    statement: 'I have worked with Docker containers and Python AST inspection in my previous coursework. I can ensure fast, secure execution of student code submissions.',
    appliedAt: '2026-10-18T08:10:00Z',
    status: 'Pending',
    matchScore: 89,
    matchReasons: ['Python & Docker proficiency', 'Strong academic track record', 'Available 18 hrs/week']
  }
];

export const MOCK_INVITATIONS: Invitation[] = [
  {
    id: 'inv-1',
    projectId: 'proj-4',
    projectTitle: 'CampusRide: Peer-to-Peer Carpooling',
    senderId: 'student-6',
    senderName: 'Sanya Kapoor',
    receiverId: 'student-1',
    receiverName: 'Aarav Sharma',
    role: 'Backend API Engineer',
    message: 'Hey Aarav, noticed your work on PeerTutor! We need a rock-solid backend for our carpooling app. Would you like to team up for this semester?',
    sentAt: '2026-10-17T18:00:00Z',
    status: 'Pending'
  }
];
