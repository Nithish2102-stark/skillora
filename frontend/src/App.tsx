import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from "./auth/AuthPages";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { AIMentorPage } from "./pages/AIMentorPage";
import { SettingsPage } from "./pages/SettingsPage";
import {
  CareerProfilePage,
  CareerSuccessPage,
  CoursesPage,
  PathfinderPage,
  PlaceholderPage,
  RoadmapPage,
  SkillGapPage,
  AnalyticsPage,
} from "./pages/PlatformPages";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="career-profile" element={<CareerProfilePage />} />
        <Route path="career-pathfinder" element={<PathfinderPage />} />
        <Route path="career-success" element={<CareerSuccessPage />} />
        <Route path="skill-gap-analysis" element={<SkillGapPage />} />
        <Route path="learning-roadmap" element={<RoadmapPage />} />
        <Route path="my-courses" element={<CoursesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="ai-mentor" element={<AIMentorPage />} />
        <Route path="skills" element={<CareerProfilePage />} />
        <Route path="career-steps" element={<RoadmapPage />} />
        <Route path="career-planner" element={<RoadmapPage />} />
        <Route path="discussion-board" element={<PlaceholderPage title="Discussion Board" />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

