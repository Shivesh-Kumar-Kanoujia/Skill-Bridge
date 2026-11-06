'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { StudentCard } from '@/components/shared/StudentCard';
import { InviteModal } from '@/components/shared/InviteModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { calculateStudentToStudentMatch } from '@/lib/matching';
import { Student } from '@/types';
import { 
  Search, 
  Users, 
  RotateCcw, 
  X, 
  ArrowUpDown
} from 'lucide-react';

function TeammatesContent() {
  const { students, currentUser } = useSkillBridge();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'experience'>('match');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const departments = [
    'All',
    'Computer Science & Engineering',
    'Artificial Intelligence & Data Science',
    'Electronics & Communication',
    'Information Science & Engineering',
    'Design & Human-Computer Interaction',
  ];

  const allSkills = Array.from(
    new Set(students.flatMap(s => s.skills.map(sk => sk.name)))
  ).sort();

  const filteredStudents = useMemo(() => {
    return students
      .filter((student) => {
        // Search query (name, headline, bio, skills, roles)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesName = student.name.toLowerCase().includes(query);
          const matchesHeadline = student.headline.toLowerCase().includes(query);
          const matchesSkills = student.skills.some(s => s.name.toLowerCase().includes(query));
          const matchesRoles = student.preferredRoles.some(r => r.toLowerCase().includes(query));
          if (!matchesName && !matchesHeadline && !matchesSkills && !matchesRoles) {
            return false;
          }
        }

        // Department filter
        if (selectedDepartment !== 'All' && student.department !== selectedDepartment) {
          return false;
        }

        // Skill filter
        if (selectedSkill !== 'All' && !student.skills.some(s => s.name === selectedSkill)) {
          return false;
        }

        // Availability filter
        if (selectedAvailability !== 'All' && student.availability.status !== selectedAvailability) {
          return false;
        }

        // Semester filter
        if (selectedSemester !== 'All' && student.semester.toString() !== selectedSemester) {
          return false;
        }

        return true;
      })
      .map((student) => ({
        student,
        matchScore: calculateStudentToStudentMatch(currentUser, student).score,
      }))
      .sort((a, b) => {
        if (sortBy === 'match') {
          return b.matchScore - a.matchScore;
        }
        if (sortBy === 'rating') {
          return b.student.stats.reliabilityRating - a.student.stats.reliabilityRating;
        }
        if (sortBy === 'experience') {
          return b.student.completedProjects.length - a.student.completedProjects.length;
        }
        return 0;
      });
  }, [students, searchQuery, selectedDepartment, selectedSkill, selectedAvailability, selectedSemester, sortBy, currentUser]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('All');
    setSelectedSkill('All');
    setSelectedAvailability('All');
    setSelectedSemester('All');
    setSortBy('match');
  };

  const hasActiveFilters = searchQuery !== '' || selectedDepartment !== 'All' || selectedSkill !== 'All' || selectedAvailability !== 'All' || selectedSemester !== 'All';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E3E2D9]">
        <div>
          <span className="text-xs font-bold text-[#31594B] uppercase tracking-wider">
            Student Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#292F2B] mt-1">
            Find Teammates & Collaborators
          </h1>
          <p className="text-xs sm:text-sm text-[#68716B] mt-1">
            Connect with peers based on complementary skills, availability, and hackathon readiness.
          </p>
        </div>

        <div className="text-xs font-semibold text-[#68716B] bg-white px-3 py-1.5 rounded-xl border border-[#E3E2D9] shadow-2xs self-start sm:self-auto">
          Showing {filteredStudents.length} of {students.length} students
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E2D9] flex flex-col gap-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8E9690] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, skill (e.g. PyTorch, Figma, Go), or role..."
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-[#E3E2D9] text-sm text-[#292F2B] placeholder:text-[#8E9690] focus:outline-none focus:ring-2 focus:ring-[#31594B] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-[#8E9690] hover:text-[#292F2B] cursor-pointer"
                aria-label="Clear search text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 h-10 rounded-xl border border-[#E3E2D9] bg-[#FAF8F5] text-xs font-medium text-[#292F2B] shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8E9690]" />
              <span className="text-[#8E9690]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort students"
                className="bg-transparent font-semibold text-[#31594B] focus:outline-none cursor-pointer"
              >
                <option value="match">Complementary Fit (Score)</option>
                <option value="rating">Reliability Rating</option>
                <option value="experience">Completed Projects</option>
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#ECE8DD]">
          <div>
            <label className="text-[10px] font-bold text-[#8E9690] uppercase tracking-wider block mb-1">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-[#E3E2D9] bg-[#FAF8F5] text-xs text-[#292F2B] focus:outline-none focus:ring-1 focus:ring-[#31594B] cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept.split('&')[0].trim()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#8E9690] uppercase tracking-wider block mb-1">
              Required Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-[#E3E2D9] bg-[#FAF8F5] text-xs text-[#292F2B] focus:outline-none focus:ring-1 focus:ring-[#31594B] cursor-pointer"
            >
              <option value="All">All Technical Skills</option>
              {allSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#8E9690] uppercase tracking-wider block mb-1">
              Availability
            </label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-[#E3E2D9] bg-[#FAF8F5] text-xs text-[#292F2B] focus:outline-none focus:ring-1 focus:ring-[#31594B] cursor-pointer"
            >
              <option value="All">Any Availability</option>
              <option value="Actively Looking">Actively Looking</option>
              <option value="Open to Offers">Open to Offers</option>
              <option value="Limited Availability">Limited Availability</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#8E9690] uppercase tracking-wider block mb-1">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-[#E3E2D9] bg-[#FAF8F5] text-xs text-[#292F2B] focus:outline-none focus:ring-1 focus:ring-[#31594B] cursor-pointer"
            >
              <option value="All">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s.toString()}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Directory Grid */}
      <div className="mt-8 flex-1">
        {filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students match criteria"
            description="No student profiles matched your filter combination. Try clearing search filters or choosing a broader department."
            actionLabel="Reset All Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(({ student }) => (
              <StudentCard
                key={student.id}
                student={student}
                onInviteClick={(stu) => setSelectedStudent(stu)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <InviteModal
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}

export default function TeammatesPage() {
  return (
    <React.Suspense fallback={<div className="max-w-7xl mx-auto p-8 text-xs text-[#68716B]">Loading student directory...</div>}>
      <TeammatesContent />
    </React.Suspense>
  );
}
