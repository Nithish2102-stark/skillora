import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { supabase } from "../lib/supabase";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  education: string | null;
  institution: string | null;
  degree: string | null;
  department: string | null;
  graduation_year: number | null;
  experience_level: string | null;
};

export type LearnerSkill = {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  targetProficiency: number;
  evidence: string | null;
};

export type Course = {
  id: string;
  title: string;
  provider: string;
  category: string;
  difficulty: string;
  durationHours: number;
  description: string | null;
  enrolled: boolean;
  progress: number;
  status?: string;
};

export type CareerRole = {
  id: string;
  title: string;
  category: string;
  description: string | null;
};
export type RoleRequirement = { careerRoleId: string; skillName: string; requiredProficiency: number; priority: string };

export type Goal = {
  id: string;
  careerRole: CareerRole | null;
  targetDate: string | null;
};

export type RoadmapPhase = {
  id: string;
  roadmapId: string;
  title: string;
  description: string | null;
  sequence: number;
  status: "completed" | "in-progress" | "not-started";
  duration: string | null;
  items: Array<{ id: string; title: string; status: string }>;
};

export type AssessmentAttempt = {
  id: string;
  title: string;
  score: number;
  totalScore: number;
  status: string;
  completedAt: string | null;
};

export type LearnerData = {
  profile: Profile | null;
  skills: LearnerSkill[];
  courses: Course[];
  goals: Goal[];
  careers: CareerRole[];
  requirements: RoleRequirement[];
  roadmap: RoadmapPhase[];
  attempts: AssessmentAttempt[];
  projects: Array<{ id: string; title: string; description: string | null }>;
  certifications: Array<{ id: string; name: string; issuingOrganization: string }>;
  loading: boolean;
  error: string | null;
  profileError: string | null;
  refresh: () => Promise<void>;
};

const emptyData: Omit<LearnerData, "loading" | "error" | "refresh"> = {
  profile: null,
  skills: [],
  courses: [],
  goals: [],
  careers: [],
  requirements: [],
  roadmap: [],
  attempts: [],
  projects: [],
  certifications: [],
  profileError: null,
};

const LearnerDataContext = createContext<LearnerData | null>(null);

function getErrorMessage(error: { message?: string } | null) {
  return error?.message ?? "Unable to load learner data. Please try again.";
}

export function LearnerDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const refresh = async () => {
    if (!user || !supabase) {
      setData(emptyData);
      setProfileError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setProfileError(null);
    const [
      profileResult,
      skillsResult,
      coursesResult,
      enrollmentsResult,
      goalsResult,
      careersResult,
      requirementsResult,
      roadmapsResult,
      phasesResult,
      itemsResult,
      attemptsResult,
      assessmentsResult,
      projectsResult,
      certificationsResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("learner_skills").select("id, proficiency, target_proficiency, evidence_source, skill:skills(id, name, category)").eq("user_id", user.id),
      supabase.from("courses").select("id, title, provider, category, difficulty, duration_hours, description").eq("is_active", true),
      supabase.from("enrollments").select("course_id, status, progress_percentage").eq("user_id", user.id),
      supabase.from("learner_career_goals").select("id, target_date, career_role:career_roles(id, title, category, description)").eq("user_id", user.id).eq("is_active", true),
      supabase.from("career_roles").select("id, title, category, description"),
      supabase.from("career_required_skills").select("career_role_id, required_proficiency, priority, skill:skills(name)"),
      supabase.from("learning_roadmaps").select("id, title, status").eq("user_id", user.id).neq("status", "archived"),
      supabase.from("roadmap_phases").select("id, roadmap_id, title, description, sequence_number, status, estimated_duration").order("sequence_number"),
      supabase.from("roadmap_items").select("id, phase_id, title, status").order("sequence_number"),
      supabase.from("assessment_attempts").select("id, assessment_id, score, total_score, status, completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }),
      supabase.from("assessments").select("id, title"),
      supabase.from("projects").select("id, title, description").eq("user_id", user.id),
      supabase.from("certifications").select("id, name, issuing_organization").eq("user_id", user.id),
    ]);

    const profilePermissionError = profileResult.error?.code === "42501" || profileResult.error?.message.toLowerCase().includes("permission denied");
    const firstError = [
      skillsResult, coursesResult, enrollmentsResult, goalsResult, careersResult, requirementsResult,
      roadmapsResult, phasesResult, itemsResult, attemptsResult, assessmentsResult,
      projectsResult, certificationsResult,
    ].find((result) => result.error)?.error ?? null;
    if (firstError) {
      setError(getErrorMessage(firstError));
      setData(emptyData);
      setLoading(false);
      return;
    }
    if (profilePermissionError) {
      setProfileError("Your profile is temporarily unavailable because profile permissions need to be updated.");
    }

    const profile = profileResult.data as Profile | null;
    const skills = (skillsResult.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.skill?.name ?? "Unnamed skill",
      category: row.skill?.category ?? "Uncategorized",
      proficiency: row.proficiency,
      targetProficiency: row.target_proficiency,
      evidence: row.evidence_source,
    }));
    const enrollments = new Map((enrollmentsResult.data ?? []).map((row: any) => [row.course_id, row]));
    const courses = (coursesResult.data ?? []).map((row: any) => {
      const enrollment = enrollments.get(row.id);
      return {
        id: row.id,
        title: row.title,
        provider: row.provider,
        category: row.category,
        difficulty: row.difficulty,
        durationHours: Number(row.duration_hours ?? 0),
        description: row.description,
        enrolled: Boolean(enrollment),
        progress: enrollment?.progress_percentage ?? 0,
        status: enrollment?.status,
      };
    });
    const phaseItems = new Map<string, Array<{ id: string; title: string; status: string }>>();
    for (const item of itemsResult.data ?? []) {
      const current = phaseItems.get(item.phase_id) ?? [];
      current.push({ id: item.id, title: item.title, status: item.status });
      phaseItems.set(item.phase_id, current);
    }
    const roadmaps = roadmapsResult.data ?? [];
    const roadmapIds = new Set(roadmaps.map((roadmap) => roadmap.id));
    const roadmap = (phasesResult.data ?? [])
      .filter((phase) => roadmapIds.has(phase.roadmap_id))
      .map((phase) => ({ id: phase.id, roadmapId: phase.roadmap_id, title: phase.title, description: phase.description, sequence: phase.sequence_number, status: phase.status, duration: phase.estimated_duration, items: phaseItems.get(phase.id) ?? [] }));
    const assessmentTitles = new Map((assessmentsResult.data ?? []).map((assessment) => [assessment.id, assessment.title]));
    const attempts = (attemptsResult.data ?? []).map((attempt: any) => ({
      id: attempt.id,
      title: assessmentTitles.get(attempt.assessment_id) ?? "Assessment",
      score: Number(attempt.score),
      totalScore: Number(attempt.total_score),
      status: attempt.status,
      completedAt: attempt.completed_at,
    }));

    setData({
      profile,
      profileError: profilePermissionError ? "Your profile is temporarily unavailable because profile permissions need to be updated." : null,
      skills,
      courses,
      goals: (goalsResult.data ?? []).map((goal: any) => ({ id: goal.id, targetDate: goal.target_date, careerRole: goal.career_role })),
      careers: careersResult.data ?? [],
      requirements: (requirementsResult.data ?? []).map((requirement: any) => ({ careerRoleId: requirement.career_role_id, skillName: requirement.skill?.name ?? "Unnamed skill", requiredProficiency: requirement.required_proficiency, priority: requirement.priority })),
      roadmap,
      attempts,
      projects: (projectsResult.data ?? []).map((project) => ({ id: project.id, title: project.title, description: project.description })),
      certifications: (certificationsResult.data ?? []).map((certification) => ({ id: certification.id, name: certification.name, issuingOrganization: certification.issuing_organization })),
    });
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  const value = useMemo(() => ({ ...data, loading, error, profileError, refresh }), [data, loading, error, profileError]);
  return <LearnerDataContext.Provider value={value}>{children}</LearnerDataContext.Provider>;
}

export function useLearnerData() {
  const context = useContext(LearnerDataContext);
  if (!context) throw new Error("useLearnerData must be used within LearnerDataProvider");
  return context;
}
