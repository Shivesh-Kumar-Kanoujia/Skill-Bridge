'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSkillBridge } from '@/context/SkillBridgeContext';
import { ProjectCard } from '@/components/shared/ProjectCard';
import { ApplyModal } from '@/components/shared/ApplyModal';
import { CreateProjectModal } from '@/components/shared/CreateProjectModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { calculateMatchScore } from '@/lib/matching';
import { Project, ProjectCategory } from '@/types';
import { 
  Search, 
  X, 
  RotateCcw, 
  Compass,
  ArrowUpDown,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';

function ProjectsContent() {
  const { projects, currentUser } = useSkillBridge();
  const searchParams = useSearchParams();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'match' | 'newest' | 'spots'>('match');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Available filter options
  const categories: ('All' | ProjectCategory)[] = [
    'All', 'Hackathon', 'Capstone', 'Open Source', 'Coursework', 'Startup'
  ];

  const allSkills = Array.from(
    new Set(projects.flatMap(p => p.requiredSkills))
  ).sort();

  // Filtering and sorting logic
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Search query (matches title, tagline, description, owner, skills)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = project.title.toLowerCase().includes(query);
          const matchesTagline = project.tagline.toLowerCase().includes(query);
          const matchesSkills = project.requiredSkills.some(s => s.toLowerCase().includes(query));
          const matchesOwner = project.ownerName.toLowerCase().includes(query);
          if (!matchesTitle && !matchesTagline && !matchesSkills && !matchesOwner) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'All' && project.category !== selectedCategory) {
          return false;
        }

        // Skill filter
        if (selectedSkill !== 'All' && !project.requiredSkills.includes(selectedSkill)) {
          return false;
        }

        // Duration filter
        if (selectedDuration === 'Short' && !project.duration.toLowerCase().includes('hour') && !project.duration.toLowerCase().includes('hackathon')) {
          return false;
        }
        if (selectedDuration === 'Semester' && !project.duration.toLowerCase().includes('semester') && !project.duration.toLowerCase().includes('week')) {
          return false;
        }

        return true;
      })
      .map((project) => ({
        project,
        matchScore: calculateMatchScore(currentUser, project).score,
      }))
      .sort((a, b) => {
        if (sortBy === 'match') {
          return b.matchScore - a.matchScore;
        }
        if (sortBy === 'newest') {
          return new Date(b.project.createdAt).getTime() - new Date(a.project.createdAt).getTime();
        }
        if (sortBy === 'spots') {
          const spotsA = a.project.teamSize.max - a.project.teamSize.current;
          const spotsB = b.project.teamSize.max - b.project.teamSize.current;
          return spotsB - spotsA;
        }
        return 0;
      });
  }, [projects, searchQuery, selectedCategory, selectedSkill, selectedDuration, sortBy, currentUser]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedSkill('All');
    setSelectedDuration('All');
    setSortBy('match');
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All' || selectedSkill !== 'All' || selectedDuration !== 'All';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E3E2D9]">
        <div>
          <span className="text-xs font-bold text-[#31594B] uppercase tracking-wider">
            Campus Project Board
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#292F2B] mt-1">
            Discover Projects & Initiatives
          </h1>
          <p className="text-xs sm:text-sm text-[#68716B] mt-1">
            Explore teams seeking specific skill sets, ranked by transparent skill overlap.
          </p>
        </div>

        {/* Action button & total count badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <div className="text-xs font-semibold text-[#68716B] bg-white px-3 py-1.5 rounded-xl border border-[#E3E2D9] shadow-2xs">
            Showing {filteredProjects.length} of {projects.length} opportunities
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Recruit Teammates
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mt-6 bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E2D9] flex flex-col gap-4 shadow-xs">
        {/* Search Bar + Sort */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8E9690] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name, tech stack (e.g. React, PyTorch, ESP32), or coordinator..."
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
                aria-label="Sort projects"
                className="bg-transparent font-semibold text-[#31594B] focus:outline-none cursor-pointer"
              >
                <option value="match">Match Estimate (Highest)</option>
                <option value="newest">Recently Posted</option>
                <option value="spots">Most Spots Open</option>
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

        {/* Category Pills & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ECE8DD]">
          <span className="text-xs font-semibold text-[#8E9690] mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'clay-pill-active font-semibold'
                  : 'bg-[#ECE8DD] text-[#68716B] hover:bg-[#E2DDD0]'
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Skill Filter Dropdown */}
          <div className="ml-auto flex items-center gap-2 mt-2 sm:mt-0">
            <span className="text-xs font-semibold text-[#8E9690]">Skill:</span>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              aria-label="Filter by required skill"
              className="h-8 px-2.5 rounded-lg border border-[#E3E2D9] bg-[#FAF8F5] text-xs text-[#292F2B] focus:outline-none focus:ring-1 focus:ring-[#31594B] shadow-2xs cursor-pointer"
            >
              <option value="All">All Required Skills</option>
              {allSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mt-8 flex-1">
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No matching projects found"
            description="No opportunities match your current filter selection. Try adjusting the search terms or clearing active filters."
            actionLabel="Reset All Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(({ project }) => (
              <ProjectCard
                key={project.id}
                project={project}
                onApplyClick={(proj) => setSelectedProject(proj)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <ApplyModal
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* Recruit Teammates / Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <React.Suspense fallback={<div className="max-w-7xl mx-auto p-8 text-xs text-[#68716B]">Loading project directory...</div>}>
      <ProjectsContent />
    </React.Suspense>
  );
}
