import { useEffect, useState } from "react";
import { Bell, Check, LockKeyhole, LogOut, Save, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useLearnerData } from "../data/learnerData";
import { supabase } from "../lib/supabase";
import { Button, Card, PageHeader, SectionTitle } from "../components/ui";

type SettingsForm = {
  fullName: string;
  location: string;
  education: string;
  institution: string;
  degree: string;
  department: string;
  graduationYear: string;
  careerRoleId: string;
  learningPace: "relaxed" | "balanced" | "intensive";
  dailyStudyMinutes: string;
  learningInterests: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
};

type SettingsRow = {
  location: string | null;
  learning_pace: SettingsForm["learningPace"];
  daily_study_minutes: number;
  learning_interests: string[];
  email_notifications: boolean;
  in_app_notifications: boolean;
};

const defaultPreferences = {
  location: "",
  learningPace: "balanced" as const,
  dailyStudyMinutes: "30",
  learningInterests: "",
  emailNotifications: true,
  inAppNotifications: true,
};

function fieldClassName() {
  return "mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--primary-hover)] focus:ring-2 focus:ring-blue-100";
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-4 transition-colors hover:bg-slate-50">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{description}</span>
      </span>
      <span className="relative shrink-0">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full bg-slate-200 transition-colors peer-checked:bg-[var(--success)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--primary)] peer-focus-visible:ring-offset-2" />
        <span className="pointer-events-none absolute left-1 top-1 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, careers, goals, loading: learnerLoading, error: learnerError, refresh } = useLearnerData();
  const navigate = useNavigate();
  const [form, setForm] = useState<SettingsForm>({
    fullName: "",
    location: defaultPreferences.location,
    education: "",
    institution: "",
    degree: "",
    department: "",
    graduationYear: "",
    careerRoleId: "",
    learningPace: defaultPreferences.learningPace,
    dailyStudyMinutes: defaultPreferences.dailyStudyMinutes,
    learningInterests: defaultPreferences.learningInterests,
    emailNotifications: defaultPreferences.emailNotifications,
    inAppNotifications: defaultPreferences.inAppNotifications,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user || !supabase || learnerLoading) return;
    let active = true;
    setSettingsLoading(true);
    setPageError(null);
    void supabase
      .from("user_settings")
      .select("location, learning_pace, daily_study_minutes, learning_interests, email_notifications, in_app_notifications")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setPageError(error.message);
          setSettingsLoading(false);
          return;
        }
        const saved = data as SettingsRow | null;
        setForm({
          fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
          location: saved?.location ?? defaultPreferences.location,
          education: profile?.education ?? "",
          institution: profile?.institution ?? "",
          degree: profile?.degree ?? "",
          department: profile?.department ?? "",
          graduationYear: profile?.graduation_year ? String(profile.graduation_year) : "",
          careerRoleId: goals[0]?.careerRole?.id ?? "",
          learningPace: saved?.learning_pace ?? defaultPreferences.learningPace,
          dailyStudyMinutes: String(saved?.daily_study_minutes ?? defaultPreferences.dailyStudyMinutes),
          learningInterests: (saved?.learning_interests ?? []).join(", "),
          emailNotifications: saved?.email_notifications ?? defaultPreferences.emailNotifications,
          inAppNotifications: saved?.in_app_notifications ?? defaultPreferences.inAppNotifications,
        });
        setSettingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, learnerLoading]);

  const updateForm = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setSaveSuccess(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !supabase) return;
    const dailyStudyMinutes = Number(form.dailyStudyMinutes);
    const graduationYear = form.graduationYear ? Number(form.graduationYear) : null;
    if (!form.fullName.trim()) {
      setPageError("Full name is required.");
      return;
    }
    if (!Number.isInteger(dailyStudyMinutes) || dailyStudyMinutes < 5 || dailyStudyMinutes > 1440) {
      setPageError("Daily study target must be between 5 and 1,440 minutes.");
      return;
    }
    if (graduationYear !== null && (!Number.isInteger(graduationYear) || graduationYear < 1900 || graduationYear > 2200)) {
      setPageError("Enter a valid graduation year between 1900 and 2200.");
      return;
    }

    setSaving(true);
    setPageError(null);
    setSaveSuccess(false);
    const { error: profileError } = await supabase.from("profiles").update({
      full_name: form.fullName.trim(),
      education: form.education.trim() || null,
      institution: form.institution.trim() || null,
      degree: form.degree.trim() || null,
      department: form.department.trim() || null,
      graduation_year: graduationYear,
    }).eq("id", user.id);
    if (profileError) {
      setPageError(profileError.message);
      setSaving(false);
      return;
    }

    const { error: preferencesError } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      location: form.location.trim() || null,
      learning_pace: form.learningPace,
      daily_study_minutes: dailyStudyMinutes,
      learning_interests: form.learningInterests.split(",").map((interest) => interest.trim()).filter(Boolean),
      email_notifications: form.emailNotifications,
      in_app_notifications: form.inAppNotifications,
    }, { onConflict: "user_id" });
    if (preferencesError) {
      setPageError(preferencesError.message);
      setSaving(false);
      return;
    }

    const existingGoal = goals[0];
    let goalError = null;
    if (form.careerRoleId) {
      if (existingGoal) {
        const result = await supabase.from("learner_career_goals").update({ career_role_id: form.careerRoleId, is_active: true }).eq("id", existingGoal.id).eq("user_id", user.id);
        goalError = result.error;
      } else {
        const result = await supabase.from("learner_career_goals").insert({ user_id: user.id, career_role_id: form.careerRoleId, is_active: true });
        goalError = result.error;
      }
    } else if (existingGoal) {
      const result = await supabase.from("learner_career_goals").update({ is_active: false }).eq("id", existingGoal.id).eq("user_id", user.id);
      goalError = result.error;
    }
    if (goalError) {
      setPageError(goalError.message);
      setSaving(false);
      return;
    }

    await refresh();
    setSaveSuccess(true);
    setSaving(false);
  };

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setPasswordMessage(null);
    if (password.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPasswordSaving(false);
    if (error) {
      setPasswordMessage({ type: "error", text: error.message });
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setPasswordMessage({ type: "success", text: "Password updated successfully." });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await signOut();
    if (error) {
      setPageError(error);
      setSigningOut(false);
      return;
    }
    navigate("/login", { replace: true });
  };

  const busy = learnerLoading || settingsLoading;
  return (
    <section>
      <PageHeader eyebrow="Workspace / Account" title="Settings" description="Manage your profile, learning preferences, notifications, and account security." />
      {learnerError && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{learnerError}</div>}
      {pageError && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>}
      {busy ? <Card className="p-8 text-sm text-[var(--text-secondary)]">Loading your saved settings…</Card> : (
        <form onSubmit={(event) => void saveSettings(event)} className="space-y-6">
          <Card className="p-6">
            <SectionTitle title="Profile settings" detail="Keep the information used to personalize your learning experience." />
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium">Full name<input required value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} className={fieldClassName()} /></label>
              <label className="text-sm font-medium">Account email<input value={user?.email ?? ""} readOnly className={`${fieldClassName()} cursor-not-allowed bg-slate-50`} /></label>
              <label className="text-sm font-medium">Location<input value={form.location} onChange={(event) => updateForm("location", event.target.value)} placeholder="e.g. Bengaluru, India" className={fieldClassName()} /></label>
              <label className="text-sm font-medium">Career goal<select value={form.careerRoleId} onChange={(event) => updateForm("careerRoleId", event.target.value)} className={fieldClassName()}><option value="">No career goal selected</option>{careers.map((career) => <option key={career.id} value={career.id}>{career.title}</option>)}</select></label>
              <label className="text-sm font-medium">Education<input value={form.education} onChange={(event) => updateForm("education", event.target.value)} placeholder="e.g. Bachelor's degree" className={fieldClassName()} /></label>
              <label className="text-sm font-medium">Institution<input value={form.institution} onChange={(event) => updateForm("institution", event.target.value)} placeholder="School or university" className={fieldClassName()} /></label>
              <label className="text-sm font-medium">Degree<input value={form.degree} onChange={(event) => updateForm("degree", event.target.value)} placeholder="e.g. Computer Science" className={fieldClassName()} /></label>
              <label className="text-sm font-medium">Department<input value={form.department} onChange={(event) => updateForm("department", event.target.value)} placeholder="Optional department" className={fieldClassName()} /></label>
              <label className="text-sm font-medium">Graduation year<input type="number" min="1900" max="2200" value={form.graduationYear} onChange={(event) => updateForm("graduationYear", event.target.value)} placeholder="e.g. 2027" className={fieldClassName()} /></label>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle title="Learning preferences" detail="Shape the pace and topics of your learning plan." />
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium">Preferred learning pace<select value={form.learningPace} onChange={(event) => updateForm("learningPace", event.target.value as SettingsForm["learningPace"])} className={fieldClassName()}><option value="relaxed">Relaxed</option><option value="balanced">Balanced</option><option value="intensive">Intensive</option></select></label>
              <label className="text-sm font-medium">Daily study target<select value={form.dailyStudyMinutes} onChange={(event) => updateForm("dailyStudyMinutes", event.target.value)} className={fieldClassName()}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option><option value="90">1.5 hours</option><option value="120">2 hours</option></select></label>
              <label className="text-sm font-medium md:col-span-2">Learning interests<span className="mt-1 block text-xs font-normal text-[var(--text-secondary)]">Separate interests with commas.</span><input value={form.learningInterests} onChange={(event) => updateForm("learningInterests", event.target.value)} placeholder="e.g. React, cloud computing, data science" className={fieldClassName()} /></label>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle title="Notification preferences" detail="Choose how Skillora keeps you informed." />
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle label="Email notifications" description="Receive important learning and account updates by email." checked={form.emailNotifications} onChange={(value) => updateForm("emailNotifications", value)} />
              <Toggle label="In-app notifications" description="Show reminders and updates inside your Skillora workspace." checked={form.inAppNotifications} onChange={(value) => updateForm("inAppNotifications", value)} />
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {saveSuccess && <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700"><Check size={16} />Settings saved</span>}
            <Button type="submit" disabled={saving}><Save className="mr-2 inline" size={15} />{saving ? "Saving…" : "Save settings"}</Button>
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle title="Account security" detail="Keep your account protected." />
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4"><LockKeyhole className="mt-0.5 text-[var(--primary-hover)]" size={18} /><div><p className="text-sm font-medium">Authenticated account</p><p className="mt-1 text-xs text-[var(--text-secondary)]">{user?.email ?? "Email unavailable"}</p></div></div>
          <form onSubmit={(event) => void updatePassword(event)} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className={fieldClassName()} /></label>
            <label className="block text-sm font-medium">Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={fieldClassName()} /></label>
            {passwordMessage && <p role="status" className={`text-sm ${passwordMessage.type === "success" ? "text-emerald-700" : "text-red-600"}`}>{passwordMessage.text}</p>}
            <Button type="submit" variant="secondary" disabled={passwordSaving}>{passwordSaving ? "Updating…" : "Update password"}</Button>
          </form>
        </Card>
        <Card className="p-6">
          <SectionTitle title="Account actions" detail="Manage your active Skillora session." />
          <div className="rounded-lg border border-[var(--border)] p-4"><div className="flex items-start gap-3"><UserRound className="mt-0.5 text-[var(--primary-hover)]" size={18} /><div><p className="text-sm font-medium">Your account</p><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Sign out when you are finished using this device.</p></div></div><Button variant="danger" onClick={() => void handleSignOut()} disabled={signingOut} className="mt-4"><LogOut className="mr-2 inline" size={15} />{signingOut ? "Signing out…" : "Sign out"}</Button></div>
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--border)] p-4"><Bell className="mt-0.5 text-[var(--primary-hover)]" size={18} /><p className="text-xs leading-5 text-[var(--text-secondary)]">Notification controls are saved with your account and restored after your next login.</p></div>
        </Card>
      </div>
    </section>
  );
}
