import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { LandingPage } from "../pages/LandingPage";
import { PreLaunchIdeaPage } from "../pages/PreLaunchIdeaPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ProjectsFeedPage } from "../pages/ProjectsFeedPage";
import { DeveloperDirectoryPage } from "../pages/DeveloperDirectoryPage";
import { CommunitiesPage } from "../pages/CommunitiesPage";
import { ChatPage } from "../pages/ChatPage";
import { BookmarksPage } from "../pages/BookmarksPage";
import { SettingsPage } from "../pages/SettingsPage";
import { CreateProjectPage } from "../pages/CreateProjectPage";
import { MyApplicationsPage } from "../pages/MyApplicationsPage";
import { MyProjectsPage } from "../pages/MyProjectsPage";
import { ProjectDetailsPage } from "../pages/ProjectDetailsPage";
import { ProjectWorkspacePage } from "../pages/ProjectWorkspacePage";
import { SavedDevelopersPage } from "../pages/SavedDevelopersPage";
import { ProjectDiscoveryPage } from "../pages/ProjectDiscoveryPage";
import { CreatorAnalyticsPage } from "../pages/CreatorAnalyticsPage";
import { AuthLayout } from "../features/auth/layouts/AuthLayout";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { VerifyEmailPage } from "../features/auth/pages/VerifyEmailPage";
import { DeveloperProfileWizard } from "../features/profile/developer/DeveloperProfileWizard";
import { ClientProfileWizard } from "../features/profile/client/ClientProfileWizard";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
const GenericPlaceholder = ({ title }) => <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-cardDark text-center space-y-3"><h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2><p className="text-xs text-slate-500 max-w-md mx-auto">
      This page is ready for feature implementation. All router, state management, and visual skeleton scaffolding are active.
    </p></div>;
export const AppRoutes = () => {
  return <Routes>{
    /* Public Landing Page */
  }<Route path="/" element={<LandingPage />} /><Route path="/about" element={<GenericPlaceholder title="About Us" />} /><Route path="/pricing" element={<GenericPlaceholder title="Pricing Plans" />} /><Route path="/contact" element={<GenericPlaceholder title="Contact Us" />} /><Route path="/privacy" element={<GenericPlaceholder title="Privacy Policy" />} /><Route path="/terms" element={<GenericPlaceholder title="Terms of Service" />} />{
    /* Authentication Module Layout & Routes (Public) */
  }<Route element={<AuthLayout />}><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/verify-email" element={<VerifyEmailPage />} /></Route>{
    /* Protected Application Routes */
  }<Route element={<ProtectedRoute />}>
    <Route path="/pre-launch" element={<PreLaunchIdeaPage />} />
    <Route path="/wizard/developer" element={<DeveloperProfileWizard />} /><Route path="/wizard/client" element={<ClientProfileWizard />} /><Route element={<MainLayout />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/profile/:id" element={<ProfilePage />} /><Route path="/profile/edit" element={<GenericPlaceholder title="Edit Profile" />} /><Route path="/projects" element={<ProjectsFeedPage />} /><Route path="/projects/:id" element={<ProjectDetailsPage />} /><Route path="/projects/:id/workspace" element={<ProjectWorkspacePage />} /><Route path="/projects/:projectId/workspace" element={<ProjectWorkspacePage />} /><Route path="/projects/create" element={<CreateProjectPage />} /><Route path="/developers" element={<DeveloperDirectoryPage />} /><Route path="/communities" element={<CommunitiesPage />} /><Route path="/communities/:id" element={<GenericPlaceholder title="Community Details" />} /><Route path="/messages" element={<ChatPage />} /><Route path="/notifications" element={<GenericPlaceholder title="Notifications Center" />} /><Route path="/settings" element={<SettingsPage />} /><Route path="/bookmarks" element={<BookmarksPage />} />
<Route path="/analytics" element={<CreatorAnalyticsPage />} />
<Route path="/creator-analytics" element={<CreatorAnalyticsPage />} />
<Route path="/saved-developers" element={<SavedDevelopersPage />} />
<Route path="/saved-projects" element={<BookmarksPage />} />
<Route path="/discover-projects" element={<ProjectDiscoveryPage />} />
<Route path="/discovery/projects" element={<ProjectDiscoveryPage />} /><Route path="/applications" element={<MyApplicationsPage />} /><Route path="/my-projects" element={<MyProjectsPage />} /><Route path="/team-workspace" element={<GenericPlaceholder title="Team Workspace Placeholder" />} /></Route></Route>{
    /* 404 Fallback */
  }<Route path="*" element={<Navigate to="/" replace />} /></Routes>;
};
