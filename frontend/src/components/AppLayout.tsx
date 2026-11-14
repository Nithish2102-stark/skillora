import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  Compass,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  Target,
  UserRound,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LearnerDataProvider, useLearnerData } from "../data/learnerData";

const careerLinks = [
  ["career-profile", "Career Profile", UserRound],
  ["career-pathfinder", "Career Pathfinder", Compass],
  ["career-steps", "Career Steps", Target],
  ["career-planner", "Career Planner", BriefcaseBusiness],
  ["career-success", "Career Success", GraduationCap],
] as const;

const primaryLinks = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["skills", "Skills", Sparkles],
  ["skill-gap-analysis", "Skill Gap Analysis", Target],
  ["learning-roadmap", "Learning Roadmap", BookOpen],
  ["my-courses", "My Courses", BookOpen],
  ["ai-mentor", "AI Mentor", Sparkles],
  ["analytics", "Analytics", BarChart3],
  ["discussion-board", "Discussion Board", MessageSquare],
] as const;

function NavigationLink({
  to,
  label,
  icon: Icon,
  nested = false,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  nested?: boolean;
}) {
  return (
    <NavLink
      to={`/${to}`}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          nested ? "ml-3" : ""
        } ${
          isActive
            ? "bg-[var(--sidebar-active)] text-white"
            : "text-slate-300 hover:bg-[var(--sidebar-hover)] hover:text-white"
        }`
      }
    >
      <Icon size={16} strokeWidth={1.8} className="transition-colors duration-200" />
      <span>{label}</span>
    </NavLink>
  );
}

function AppShell() {
  const { signOut, user } = useAuth();
  const { profile, skills, courses, roadmap, loading: dataLoading } = useLearnerData();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [careerOpen, setCareerOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [headerProfileOpen, setHeaderProfileOpen] = useState(false);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const sidebarProfileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Learner";
  const displayEmail = profile?.email || user?.email || "Authenticated learner";
  const initials = displayName.slice(0, 1).toUpperCase();
  const sections = [
    ["Dashboard", "/dashboard", "Workspace"],
    ["Career Profile", "/career-profile", "Career Growth"],
    ["Skills", "/skills", "Learning"],
    ["Skill Gap Analysis", "/skill-gap-analysis", "Learning"],
    ["Learning Roadmap", "/learning-roadmap", "Learning"],
    ["My Courses", "/my-courses", "Learning"],
    ["AI Mentor", "/ai-mentor", "Skillora Intelligence"],
    ["Analytics", "/analytics", "Progress"],
    ["Career Pathfinder", "/career-pathfinder", "Career Growth"],
    ["Career Success", "/career-success", "Career Growth"],
  ] as const;
  const searchResults = [
    ...sections.map(([name, path, category]) => ({ name, path, category })),
    ...skills.map((skill) => ({ name: skill.name, path: "/skills", category: "Saved skill" })),
    ...courses.map((course) => ({ name: course.title, path: "/my-courses", category: course.enrolled ? "Enrolled course" : "Course catalogue" })),
    ...roadmap.map((phase) => ({ name: phase.title, path: "/learning-roadmap", category: "Roadmap phase" })),
  ].filter((result) => `${result.name} ${result.category}`.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  useEffect(() => {
    if (!notificationsOpen && !headerProfileOpen && !sidebarProfileOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false);
      if (!sidebarProfileRef.current?.contains(target) && !profileRef.current?.contains(target)) {
        setHeaderProfileOpen(false);
        setSidebarProfileOpen(false);
      }
      if (!searchRef.current?.contains(target)) setSearchOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setHeaderProfileOpen(false);
        setSidebarProfileOpen(false);
        setSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen, headerProfileOpen, sidebarProfileOpen, searchOpen]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const openSearch = () => {
    setSearchOpen(true);
    setHeaderProfileOpen(false);
    setSidebarProfileOpen(false);
    setNotificationsOpen(false);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };
  const goTo = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
    closeSearch();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <button aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)} className="fixed left-4 top-4 z-20 grid size-9 place-items-center rounded-lg bg-[var(--sidebar)] text-white shadow transition-colors duration-200 hover:bg-[var(--sidebar-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] md:hidden"><Menu size={18} /></button>
      {sidebarOpen && <button aria-label="Close navigation overlay" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-slate-900/20 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[var(--sidebar)] px-4 py-5 text-white transition-transform md:z-10 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-2">
          <div className="grid size-8 place-items-center rounded-lg bg-[var(--primary)] text-sm font-bold text-slate-900">
            S
          </div>
          <span className="text-lg font-semibold tracking-tight">Skillora</span>
          <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="ml-auto cursor-pointer rounded p-1 text-slate-400 transition-colors duration-200 hover:bg-[var(--sidebar-hover)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] md:hidden"><X size={18} /></button>
        </div>

        <button type="button" onClick={openSearch} aria-label="Search Skillora" className="mt-7 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-600/70 px-3 py-2 text-left text-xs text-slate-400 transition-colors duration-200 hover:border-slate-500 hover:bg-[var(--sidebar-hover)] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
          <Search size={15} />
          <span className="flex-1">Search</span>
          <kbd className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px]">
            {navigator.platform.toLowerCase().includes("mac") ? "⌘ K" : "Ctrl K"}
          </kbd>
        </button>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {primaryLinks.slice(0, 1).map(([to, label, icon]) => (
            <NavigationLink key={to} to={to} label={label} icon={icon} />
          ))}
          <button aria-expanded={careerOpen} aria-controls="career-navigation" onClick={() => setCareerOpen(!careerOpen)} className="group mt-5 flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition-colors duration-200 hover:bg-[var(--sidebar-hover)] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
            Career Growth <ChevronDown size={14} className={`transition-transform duration-200 group-hover:text-white ${careerOpen ? "" : "-rotate-90"}`} />
          </button>
          {careerOpen && <div id="career-navigation" className="mt-1 space-y-1">{careerLinks.map(([to, label, icon]) => <NavigationLink key={to} to={to} label={label} icon={icon} nested />)}</div>}
          <div className="mt-5 space-y-1">
            {primaryLinks.slice(1).map(([to, label, icon]) => (
              <NavigationLink key={to} to={to} label={label} icon={icon} />
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-700 pt-4">
          <NavigationLink to="settings" label="Settings" icon={Settings} />
          <div ref={sidebarProfileRef}>
          <button type="button" onClick={() => { setSidebarProfileOpen((open) => !open); setHeaderProfileOpen(false); setNotificationsOpen(false); }} aria-expanded={sidebarProfileOpen} aria-controls="sidebar-profile-menu" className="mt-3 flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-200 hover:bg-[var(--sidebar-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
            <div className="grid size-8 place-items-center rounded-full bg-slate-600 text-xs font-semibold">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-slate-400">{displayEmail}</p>
            </div>
            <ChevronDown size={15} className={`text-slate-500 transition-transform duration-200 ${sidebarProfileOpen ? "rotate-180" : ""}`} />
          </button>
          {sidebarProfileOpen && <div id="sidebar-profile-menu" role="menu" className="mt-2 rounded-lg border border-slate-700 bg-[var(--sidebar-hover)] p-1 text-sm">
            <button role="menuitem" onClick={() => goTo("/career-profile")} className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-slate-200 transition-colors hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Profile</button>
            <button role="menuitem" onClick={() => goTo("/settings")} className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-slate-200 transition-colors hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Account Settings</button>
            <button role="menuitem" onClick={() => { void signOut(); navigate("/login"); }} className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-slate-200 transition-colors hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Sign out</button>
          </div>}
          </div>
        </div>
      </aside>

      <main className="min-h-screen md:ml-64">
        <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-4 pl-16 md:px-8">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>Workspace</span>
            <span>/</span>
            <span className="font-medium text-[var(--text-primary)]">
              Skillora
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div ref={notificationsRef} className="relative">
            <button aria-label="Notifications" aria-expanded={notificationsOpen} aria-controls="notifications-panel" onClick={() => { setNotificationsOpen((open) => !open); setHeaderProfileOpen(false); setSidebarProfileOpen(false); }} className="relative cursor-pointer rounded-lg p-2 text-[var(--text-secondary)] transition-all duration-200 hover:bg-slate-50 hover:text-[var(--text-primary)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"><Bell size={18} /><span className="absolute right-1 top-1 size-1.5 rounded-full bg-red-500" /></button>
            {notificationsOpen && <div id="notifications-panel" role="dialog" aria-label="Notifications" className="absolute right-0 top-11 z-20 w-72 rounded-xl border border-[var(--border)] bg-white p-4 text-sm shadow-lg"><p className="font-semibold">Notifications</p><p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">Your React assessment is ready to continue.</p></div>}
            </div>
            <CircleHelp size={18} className="hidden text-[var(--text-secondary)] sm:block" />
            <div ref={profileRef} className="relative">
            <button aria-label="Open profile menu" aria-expanded={headerProfileOpen} aria-controls="profile-menu" onClick={() => { setHeaderProfileOpen((open) => !open); setSidebarProfileOpen(false); setNotificationsOpen(false); }} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-sm font-medium transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
              <span className="grid size-8 place-items-center rounded-full bg-blue-100 text-xs text-blue-700">
                {initials}
              </span>
              <span className="hidden sm:inline">{displayName}</span>
              <ChevronDown size={15} className="text-[var(--text-secondary)]" />
              </button>
              {headerProfileOpen && <div id="profile-menu" role="menu" aria-label="Profile menu" className="absolute right-0 top-11 z-20 w-40 rounded-xl border border-[var(--border)] bg-white p-2 text-sm shadow-lg"><button role="menuitem" onClick={() => goTo("/career-profile")} className="w-full cursor-pointer rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Profile</button>{user && <button role="menuitem" onClick={() => { void signOut(); navigate("/login"); }} className="w-full cursor-pointer rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">Sign out</button>}</div>}
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] p-8">
          <Outlet />
        </div>
      </main>
      {searchOpen && <div ref={searchRef} role="dialog" aria-modal="true" aria-label="Search Skillora" className="fixed inset-x-4 top-20 z-40 mx-auto max-w-2xl overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-2xl md:left-72 md:right-8 md:inset-x-auto">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") closeSearch(); if (event.key === "Enter" && searchResults[0]) goTo(searchResults[0].path); }} placeholder="Search pages, skills, courses, or roadmap items…" className="min-w-0 flex-1 text-sm outline-none" />
          {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search" className="cursor-pointer rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">Clear</button>}
          <kbd className="rounded border border-[var(--border)] px-2 py-1 text-[10px] text-slate-500">Esc</kbd>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {dataLoading ? <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">Loading saved records…</div> : searchResults.length ? searchResults.map((result) => <button type="button" key={`${result.category}-${result.name}`} onClick={() => goTo(result.path)} className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"><span className="text-sm font-medium">{result.name}</span><span className="text-xs text-[var(--text-secondary)]">{result.category}</span></button>) : <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">{searchQuery ? "No matching pages or saved records found." : "Start typing to search Skillora."}</div>}
        </div>
      </div>}
    </div>
  );
}

export function AppLayout() {
  return <LearnerDataProvider><AppShell /></LearnerDataProvider>;
}

