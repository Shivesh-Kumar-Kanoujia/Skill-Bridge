'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { StudentCard } from '@/components/shared/StudentCard';
import { ApplyModal } from '@/components/shared/ApplyModal';
import { InviteModal } from '@/components/shared/InviteModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Project, Student } from '@/types';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Compass, 
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const { projects, students } = useSkillBridge();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const featuredProjects = projects.slice(0, 3);
  const featuredStudents = students.filter(s => s.id !== 'student-1').slice(0, 3);

  const popularSkills = [
    'React', 'TypeScript', 'Python', 'PyTorch', 'FastAPI', 
    'Figma', 'Embedded C', 'PostgreSQL', 'Flutter', 'Docker'
  ];

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section */}
      <section className="relative pt-14 pb-20 lg:pt-24 lg:pb-28 border-b border-[#E3E2D9] bg-[#F4F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            {/* Section Eyebrow */}
            <p className="text-xs font-bold uppercase tracking-wider text-[#31594B] mb-4">
              Student Project Collaboration
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#31594B] tracking-tight leading-[1.12]">
              Find the right people. <br />
              <span className="italic font-normal text-[#292F2B]">Build better projects.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#68716B] leading-relaxed max-w-2xl">
              SkillBridge connects university students with high-compatibility project partners for hackathons, semester capstones, and technical initiatives—matching team roles through transparent skill alignment.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/teammates">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Find Your Team
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="outline" size="lg" rightIcon={<Compass className="w-4 h-4" />}>
                  Explore Projects
                </Button>
              </Link>
            </div>

            {/* Micro verification list */}
            <div className="mt-10 pt-8 border-t border-[#E3E2D9] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-[#68716B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#31594B]" />
                <span>Verified student accounts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#31594B]" />
                <span>Deterministic match scores</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-[#31594B]" />
                <span>Defined role spots & hours</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Interactive Preview Section (Live Projects) */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E3E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-[#31594B] uppercase tracking-wider">
                Live Campus Opportunities
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#292F2B] mt-1">
                Curated Project Openings
              </h2>
              <p className="text-xs sm:text-sm text-[#68716B] mt-1.5">
                Teams actively recruiting members for upcoming deadlines and hackathons.
              </p>
            </div>
            <Link href="/projects">
              <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
                View all {projects.length} projects
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onApplyClick={(proj) => setSelectedProject(proj)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. How SkillBridge Works (Three Steps) */}
      <section className="py-16 lg:py-24 bg-[#F4F1E8] border-b border-[#E3E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold text-[#31594B] uppercase tracking-wider">
              A Structured Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#292F2B] mt-1">
              How SkillBridge Works
            </h2>
            <p className="text-xs sm:text-sm text-[#68716B] mt-1.5">
              Designed around student schedules, clear expectations, and transparent technical requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="clay-card p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#31594B] text-white flex items-center justify-center font-serif font-bold text-lg mb-5 shadow-xs">
                  1
                </div>
                <h3 className="text-lg font-serif font-bold text-[#292F2B]">
                  Define Skills & Availability
                </h3>
                <p className="text-xs sm:text-sm text-[#68716B] mt-2.5 leading-relaxed">
                  List your technical strengths, self-assessed proficiency, weekly hours, and project interests—from ML research to mobile app prototypes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#ECE8DD] text-xs font-medium text-[#31594B]">
                Technical skills & verified capacity
              </div>
            </div>

            {/* Step 2 */}
            <div className="clay-card p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#D8E3D0] text-[#31594B] flex items-center justify-center font-serif font-bold text-lg mb-5 shadow-xs">
                  2
                </div>
                <h3 className="text-lg font-serif font-bold text-[#292F2B]">
                  Evaluate Objective Matches
                </h3>
                <p className="text-xs sm:text-sm text-[#68716B] mt-2.5 leading-relaxed">
                  Browse opportunities with deterministic compatibility percentages. See exactly which skills you satisfy and what gaps need covering.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#ECE8DD] text-xs font-medium text-[#31594B]">
                Objective skill overlap calculations
              </div>
            </div>

            {/* Step 3 */}
            <div className="clay-card p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#FBF4EC] text-[#8C5323] flex items-center justify-center font-serif font-bold text-lg mb-5 shadow-xs">
                  3
                </div>
                <h3 className="text-lg font-serif font-bold text-[#292F2B]">
                  Apply & Form Balanced Teams
                </h3>
                <p className="text-xs sm:text-sm text-[#68716B] mt-2.5 leading-relaxed">
                  Apply for designated roles or invite students directly. Coordinate commitments, track applications, and build portfolio-ready outcomes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#ECE8DD] text-xs font-medium text-[#31594B]">
                Direct applications & role invitations
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Student Profiles Directory Preview */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E3E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-[#31594B] uppercase tracking-wider">
                Teammate Discovery
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#292F2B] mt-1">
                Motivated Students Ready to Collaborate
              </h2>
              <p className="text-xs sm:text-sm text-[#68716B] mt-1.5">
                Students across Computer Science, Electronics, AI/ML, and Design seeking project partners.
              </p>
            </div>
            <Link href="/teammates">
              <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
                Browse all {students.length} students
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onInviteClick={(stu) => setSelectedStudent(stu)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Popular Campus Skills & Category Focus */}
      <section className="py-16 bg-[#F4F1E8] border-b border-[#E3E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold text-[#31594B] uppercase tracking-wider">
              Explore by Competency
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#292F2B] mt-1">
              Active Skill Focus Areas
            </h2>
            <p className="text-xs sm:text-sm text-[#68716B] mt-1">
              Filter campus projects and student peers by core programming languages and frameworks.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {popularSkills.map((skill) => (
              <Link
                key={skill}
                href={`/projects?search=${encodeURIComponent(skill)}`}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#E3E2D9] text-xs font-semibold text-[#292F2B] hover:border-[#31594B] hover:text-[#31594B] hover:bg-[#F0F5EC] transition-all shadow-2xs"
              >
                {skill}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. University Tech Value Proposition Banner */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#31594B] rounded-2xl p-8 sm:p-12 lg:p-16 text-white relative overflow-hidden shadow-lg border border-[#27483C]">
            <div className="max-w-2xl relative z-10">
              <p className="text-xs font-bold uppercase tracking-wider text-[#D8E3D0] mb-3">
                Team Formation
              </p>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                Stop relying on chaotic WhatsApp groups for hackathon teams.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#D8E3D0] leading-relaxed">
                SkillBridge provides structured accountability, verifiable role assignments, and transparent mutual commitments so your project actually reaches completion.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/signup">
                  <Button variant="secondary" size="lg">
                    Create Student Profile
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="outline" size="lg" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:border-white">
                    Browse Projects
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <ApplyModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
      <InviteModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
