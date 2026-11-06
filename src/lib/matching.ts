import { Student, Project, MatchScoreResult } from '@/types';

/**
 * Deterministic Rule-Based Compatibility Scoring
 * Explicitly calculated based on weighted criteria:
 * - 50% Skill overlap (direct match of required project skills vs student skills)
 * - 25% Interest alignment (domain/interest tag overlap)
 * - 15% Availability suitability (hours per week fit)
 * - 10% Academic level / experience indicator
 */
export function calculateMatchScore(student: Student, project: Project): MatchScoreResult {
  const studentSkillNames = student.skills.map(s => s.name.toLowerCase());
  const projectRequiredSkills = project.requiredSkills.map(s => s.toLowerCase());

  // 1. Skill overlap calculation
  const matchedSkills = project.requiredSkills.filter(req => 
    studentSkillNames.includes(req.toLowerCase())
  );
  const missingSkills = project.requiredSkills.filter(req => 
    !studentSkillNames.includes(req.toLowerCase())
  );

  const skillScore = projectRequiredSkills.length > 0 
    ? (matchedSkills.length / projectRequiredSkills.length) * 50
    : 35;

  // 2. Interest alignment calculation
  const studentInterestsLower = student.interests.map(i => i.toLowerCase());
  const projectInterestsLower = project.preferredInterests.map(i => i.toLowerCase());
  
  const matchedInterests = project.preferredInterests.filter(interest =>
    studentInterestsLower.includes(interest.toLowerCase()) ||
    project.category.toLowerCase().includes(interest.toLowerCase())
  );

  const interestScore = projectInterestsLower.length > 0
    ? (matchedInterests.length / projectInterestsLower.length) * 25
    : 15;

  // 3. Availability score
  let availabilityScore = 15;
  if (student.availability.status === 'Actively Looking') {
    availabilityScore = 15;
  } else if (student.availability.status === 'Open to Offers') {
    availabilityScore = 12;
  } else if (student.availability.status === 'Limited Availability') {
    availabilityScore = 7;
  } else {
    availabilityScore = 3;
  }

  // 4. Experience baseline
  const experienceScore = Math.min(10, Math.max(5, (student.semester / 8) * 10));

  const totalRaw = Math.round(skillScore + interestScore + availabilityScore + experienceScore);
  const finalScore = Math.min(98, Math.max(25, totalRaw));

  let label: MatchScoreResult['label'] = 'Moderate Fit';
  if (finalScore >= 85) {
    label = 'Outstanding Fit';
  } else if (finalScore >= 70) {
    label = 'Strong Fit';
  } else if (finalScore >= 50) {
    label = 'Moderate Fit';
  } else {
    label = 'Growth Opportunity';
  }

  let explanation = '';
  if (matchedSkills.length > 0 && matchedInterests.length > 0) {
    explanation = `${matchedSkills.length} required skill${matchedSkills.length > 1 ? 's' : ''} match (${matchedSkills.slice(0, 2).join(', ')}${matchedSkills.length > 2 ? ' +' + (matchedSkills.length - 2) + ' more' : ''}) and shared interest in ${matchedInterests[0]}.`;
  } else if (matchedSkills.length > 0) {
    explanation = `${matchedSkills.length} of ${project.requiredSkills.length} required skills matched directly.`;
  } else {
    explanation = `Complimentary technical background in ${student.department} with active availability.`;
  }

  return {
    score: finalScore,
    label,
    matchedSkills,
    missingSkills,
    matchedInterests,
    explanation,
  };
}

/**
 * Calculates student-to-student compatibility (for finding teammates)
 */
export function calculateStudentToStudentMatch(viewer: Student, target: Student): MatchScoreResult {
  const viewerSkills = viewer.skills.map(s => s.name.toLowerCase());
  const targetSkills = target.skills.map(s => s.name.toLowerCase());

  // Shared skills
  const matchedSkills = target.skills
    .filter(s => viewerSkills.includes(s.name.toLowerCase()))
    .map(s => s.name);

  // Complementary skills (skills target has that viewer doesn't)
  const complementarySkills = target.skills
    .filter(s => !viewerSkills.includes(s.name.toLowerCase()))
    .map(s => s.name);

  // Common interests
  const viewerInterests = viewer.interests.map(i => i.toLowerCase());
  const matchedInterests = target.interests.filter(i => 
    viewerInterests.includes(i.toLowerCase())
  );

  // Score favors complementary skills for teamwork + overlapping interests
  const complementBonus = Math.min(35, complementarySkills.length * 7);
  const sharedBonus = Math.min(25, matchedSkills.length * 6);
  const interestScore = Math.min(20, matchedInterests.length * 10);
  const availabilityScore = target.availability.status === 'Actively Looking' ? 18 : 10;

  const totalRaw = Math.round(complementBonus + sharedBonus + interestScore + availabilityScore);
  const finalScore = Math.min(97, Math.max(30, totalRaw));

  let label: MatchScoreResult['label'] = 'Moderate Fit';
  if (finalScore >= 85) {
    label = 'Outstanding Fit';
  } else if (finalScore >= 70) {
    label = 'Strong Fit';
  } else if (finalScore >= 50) {
    label = 'Moderate Fit';
  } else {
    label = 'Growth Opportunity';
  }

  const explanation = complementarySkills.length > 0
    ? `Brings complementary strengths in ${complementarySkills.slice(0, 2).join(', ')}${matchedInterests.length > 0 ? ` and shared interest in ${matchedInterests[0]}` : ''}.`
    : `Shared foundation in ${matchedSkills.slice(0, 2).join(', ')}.`;

  return {
    score: finalScore,
    label,
    matchedSkills,
    missingSkills: complementarySkills,
    matchedInterests,
    explanation,
  };
}
