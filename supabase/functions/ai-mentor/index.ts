import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Course = {
  id: string;
  title: string;
  description: string | null;
  category: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function recommendations(
  courses: Course[],
  enrollments: Array<{ course_id: string }>,
  skills: Array<{ name: string; proficiency: number }>,
  requirements: Array<{ skill_name: string; required_proficiency: number }>,
) {
  const saved = new Map(skills.map((skill) => [skill.name.toLowerCase(), skill.proficiency]));
  const gaps = requirements
    .filter((requirement) => (saved.get(requirement.skill_name.toLowerCase()) ?? 0) < requirement.required_proficiency)
    .map((requirement) => requirement.skill_name);
  const enrolled = new Set(enrollments.map((enrollment) => enrollment.course_id));

  return courses
    .filter((course) => !enrolled.has(course.id))
    .map((course) => {
      const haystack = `${course.title} ${course.description ?? ""} ${course.category}`.toLowerCase();
      const matches = gaps.filter((gap) => haystack.includes(gap.toLowerCase()));
      return { course, matches };
    })
    .filter(({ matches }) => matches.length > 0)
    .sort((left, right) => right.matches.length - left.matches.length || left.course.title.localeCompare(right.course.title))
    .slice(0, 3)
    .map(({ course }) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      reason: `Matches saved skill gap(s): ${gaps.slice(0, 3).join(", ")}.`,
    }));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  const geminiModel = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    return jsonResponse({ error: "AI Mentor is not configured." }, 503);
  }
  if (!authorization) return jsonResponse({ error: "Authentication is required." }, 401);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return jsonResponse({ error: "Authentication is required." }, 401);

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const history = Array.isArray(body?.history) ? body.history.slice(-20) : [];
  if (!message || message.length > 4000) return jsonResponse({ error: "A valid message is required." }, 400);

  const [profile, goal, skills, courses, enrollments] = await Promise.all([
    supabase.from("profiles").select("full_name, education, institution, degree, department, experience_level").eq("id", userData.user.id).maybeSingle(),
    supabase.from("learner_career_goals").select("target_date, career_role:career_roles(id, title, category, description)").eq("user_id", userData.user.id).eq("is_active", true).maybeSingle(),
    supabase.from("learner_skills").select("proficiency, skill:skills(name, category)").eq("user_id", userData.user.id),
    supabase.from("courses").select("id, title, description, category").eq("is_active", true),
    supabase.from("enrollments").select("course_id").eq("user_id", userData.user.id),
  ]);
  const careerRoleId = (goal.data?.career_role as { id?: string } | null)?.id;
  const requirements = careerRoleId
    ? await supabase.from("career_required_skills").select("required_proficiency, skill:skills(name)").eq("career_role_id", careerRoleId)
    : { data: [], error: null };
  const queryError = [profile, goal, skills, courses, enrollments, requirements].find((result) => result.error)?.error;
  if (queryError) return jsonResponse({ error: "Learner data could not be retrieved." }, 502);

  const normalizedSkills = (skills.data ?? []).map((row) => ({
    name: (row.skill as { name?: string } | null)?.name ?? "Unnamed skill",
    proficiency: Number(row.proficiency ?? 0),
  }));
  const normalizedRequirements = (requirements.data ?? []).map((row) => ({
    skill_name: (row.skill as { name?: string } | null)?.name ?? "Unnamed skill",
    required_proficiency: Number(row.required_proficiency ?? 0),
  }));
  const learnerContext = {
    profile: profile.data,
    career_goal: goal.data,
    skills: normalizedSkills,
    skill_gaps: normalizedRequirements.filter((requirement) =>
      (normalizedSkills.find((skill) => skill.name.toLowerCase() === requirement.skill_name.toLowerCase())?.proficiency ?? 0) <
      requirement.required_proficiency,
    ).map((requirement) => requirement.skill_name),
  };
  const prompt = [
    "You are Skillora Mentor. Give concise, practical learning and career guidance grounded only in the learner context below.",
    "If the context does not contain enough information, say what is missing and still answer general parts of the question.",
    "Return plain text or Markdown only. Do not invent saved records.",
    `Learner context: ${JSON.stringify(learnerContext)}`,
    `Conversation: ${JSON.stringify(history)}`,
    `Question: ${message}`,
  ].join("\n\n");

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    },
  );
  if (!geminiResponse.ok) return jsonResponse({ error: "AI Mentor is temporarily unavailable." }, 502);
  const geminiPayload = await geminiResponse.json();
  const generatedMessage = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof generatedMessage !== "string" || !generatedMessage.trim()) {
    return jsonResponse({ error: "AI Mentor returned no usable response." }, 502);
  }

  return jsonResponse({
    message: generatedMessage.trim(),
    intent: "general",
    recommendations: recommendations(
      (courses.data ?? []) as Course[],
      (enrollments.data ?? []) as Array<{ course_id: string }>,
      normalizedSkills,
      normalizedRequirements,
    ),
  });
});
