import { useMemo, useState } from "react";
import { Bot, RefreshCw, Send, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../auth/AuthContext";
import { useLearnerData } from "../data/learnerData";
import { supabase } from "../lib/supabase";
import { Badge, Button, Card, EmptyState, PageHeader, SectionTitle } from "../components/ui";

type Recommendation = {
  id: string;
  title: string;
  description: string | null;
  reason: string;
};

type MentorMessage = {
  role: "user" | "assistant";
  content: string;
  recommendations?: Recommendation[];
};

type MentorResponse = {
  message: string;
  intent: string;
  recommendations: Recommendation[];
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8000";

function suggestedQuestions(hasSkills: boolean, hasCareerGoal: boolean) {
  const suggestions = ["What should I focus on in my learning next?", "Which courses would help me prepare for my goals?"];
  if (hasSkills) suggestions.unshift("Which of my saved skills should I improve first?");
  if (hasCareerGoal) suggestions.push("How can I make progress toward my target career?");
  return suggestions.slice(0, 3);
}

async function getCurrentAccessToken(forceRefresh = false) {
  if (!supabase) return null;
  let currentSession = (await supabase.auth.getSession()).data.session;
  if (currentSession && (forceRefresh || (currentSession.expires_at && currentSession.expires_at * 1000 <= Date.now() + 30_000))) {
    currentSession = (await supabase.auth.refreshSession()).data.session;
  }
  return currentSession?.access_token ?? null;
}

export function AIMentorPage() {
  const { session } = useAuth();
  const { profile, skills, courses, goals, loading: dataLoading } = useLearnerData();
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");

  const suggestions = useMemo(() => suggestedQuestions(skills.length > 0, goals.length > 0), [skills.length, goals.length]);
  const hasLearnerData = Boolean(profile || skills.length || courses.length || goals.length);

  const send = async (question = input) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    if (!supabase || !session) {
      setError("Your authenticated session is unavailable. Please sign in again.");
      return;
    }
    setInput("");
    setError(null);
    setLoading(true);
    setLastQuestion(trimmed);
    const userMessage: MentorMessage = { role: "user", content: trimmed };
    const history = [...messages, userMessage].map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, userMessage]);
    try {
      const accessToken = await getCurrentAccessToken();
      if (!accessToken) throw new Error("Your authenticated session is unavailable. Please sign in again.");
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: trimmed, history: history.slice(-20) }),
      };
      let response = await fetch(`${apiBaseUrl}/api/mentor/chat`, requestOptions);
      if (response.status === 401) {
        const refreshedToken = await getCurrentAccessToken(true);
        if (refreshedToken && refreshedToken !== accessToken) {
          response = await fetch(`${apiBaseUrl}/api/mentor/chat`, {
            ...requestOptions,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${refreshedToken}` },
          });
        }
      }
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "AI Mentor is temporarily unavailable.");
      const result = payload as MentorResponse;
      setMessages((current) => [...current, { role: "assistant", content: result.message, recommendations: result.recommendations }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "AI Mentor is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <PageHeader eyebrow="Skillora intelligence" title="AI Mentor" description="Get grounded guidance from your saved learning and career records." action={<Badge tone="blue">Gemini powered</Badge>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="flex min-h-[560px] flex-col p-5">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <div className="grid size-9 place-items-center rounded-full bg-blue-50 text-[var(--primary-hover)]"><Bot size={19} /></div>
            <div><p className="text-sm font-semibold">Skillora Mentor</p><p className="text-xs text-[var(--text-secondary)]">Grounded in your saved records</p></div>
          </div>
          <div className="flex-1 space-y-4 overflow-auto py-5">
            {!messages.length && (dataLoading ? <div className="text-sm text-[var(--text-secondary)]">Loading your saved context…</div> : <EmptyState title={hasLearnerData ? "Ask your mentor" : "No learner data saved yet"} description={hasLearnerData ? "Ask a question about your skills, courses, progress, or career direction." : "The mentor can answer general questions, but personalized guidance starts after you save profile or learning records."} />)}
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
              {message.role === "assistant" && <div className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[var(--primary-hover)]"><Bot size={14} /></div>}
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-[var(--sidebar-active)] text-white" : "bg-slate-50 text-[var(--text-primary)]"}`}>
                {message.role === "assistant" ? <ReactMarkdown>{message.content}</ReactMarkdown> : message.content}
                {message.recommendations?.length ? <div className="mt-4 space-y-2 border-t border-slate-200 pt-3"><p className="text-xs font-semibold text-slate-600">Relevant saved courses</p>{message.recommendations.map((course) => <Link key={course.id} to="/my-courses" className="block rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:bg-blue-50"><p className="text-xs font-semibold text-slate-800">{course.title}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{course.reason}</p></Link>)}</div> : null}
              </div>
              {message.role === "user" && <div className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100"><UserRound size={14} /></div>}
            </div>)}
            {loading && <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"><div className="grid size-7 place-items-center rounded-full bg-blue-50 text-[var(--primary-hover)]"><Bot size={14} /></div>Thinking from your saved context…</div>}
          </div>
          {error && <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"><span>{error}</span>{lastQuestion && <button type="button" onClick={() => void send(lastQuestion)} className="cursor-pointer font-semibold underline">Retry</button>}</div>}
          <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex gap-2 border-t border-[var(--border)] pt-4">
            <input value={input} onChange={(event) => setInput(event.target.value)} disabled={loading} placeholder="Ask about your learning or career…" className="min-w-0 flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--primary-hover)] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50" />
            <Button type="submit" ariaLabel="Send message" disabled={loading || !input.trim()}>{loading ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}</Button>
          </form>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Suggested questions" detail="Based on the records currently saved to your account." />
          <div className="space-y-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void send(suggestion)} disabled={loading} className="w-full cursor-pointer rounded-lg border border-[var(--border)] p-3 text-left text-xs leading-5 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60">{suggestion}</button>)}</div>
        </Card>
      </div>
    </section>
  );
}
