import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ConfirmPasswordPage from './pages/ConfirmPasswordPage';
import TermsAcceptancePage from './pages/TermsAcceptancePage';
import DashboardPage from './pages/portal/DashboardPage';
import SubjectsPage from './pages/portal/SubjectsPage';
import SubjectDetailPage from './pages/portal/SubjectDetailPage';
import AssessmentIntroPage from './pages/portal/AssessmentIntroPage';
import ExamTakingPage from './pages/portal/ExamTakingPage';
import ExamResultsPage from './pages/portal/ExamResultsPage';
import AchievementsPage from './pages/portal/AchievementsPage';
import AchievementsSanctumPage from './pages/portal/AchievementsSanctumPage';
import BadgesPage from './pages/portal/BadgesPage';
import SubscriptionPage from './pages/portal/SubscriptionPage';
import SettingsPage from './pages/portal/SettingsPage';
import HelpCenterPage from './pages/portal/HelpCenterPage';
import LegalPage from './pages/portal/LegalPage';
import LawyerDashboard from './pages/lawyer/LawyerDashboard';
import VerificationPage from './pages/lawyer/VerificationPage';
import CurriculumPage from './pages/lawyer/CurriculumPage';
import QuestionnairePage from './pages/lawyer/QuestionnairePage';
import LawyerSettingsPage from './pages/lawyer/LawyerSettingsPage';
import LawyerHelpCenterPage from './pages/lawyer/HelpCenterPage';
import LawyerLegalPage from './pages/lawyer/LegalPage';
import SuperAdminDashboardPage from './pages/superadmin/SuperAdminDashboardPage';
import UserControlPage from './pages/superadmin/UserControlPage';
import SystemLogsPage from './pages/superadmin/SystemLogsPage';
import PaymentManagementPage from './pages/superadmin/PaymentManagementPage';
import SuperAdminSettingsPage from './pages/superadmin/SuperAdminSettingsPage';
import SuperAdminHelpCenterPage from './pages/superadmin/HelpCenterPage';
import SuperAdminLegalPage from './pages/superadmin/LegalPage';
import VerifyCodePage from './pages/VerifyCodePage';
import ComingSoonPage from './pages/portal/ComingSoonPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / marketing */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/confirm-password" element={<ConfirmPasswordPage />} />
        <Route path="/terms-acceptance" element={<TermsAcceptancePage />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />

        {/* Reviewee portal — BACKEND TODO: wrap these in an auth guard once
            Cognito is wired up, so logged-out users get redirected to /login. */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/subjects/:slug" element={<SubjectDetailPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/achievements/sanctum" element={<AchievementsSanctumPage />} />
        <Route path="/achievements/badges" element={<BadgesPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help-center" element={<HelpCenterPage />} />
        <Route path="/legal" element={<LegalPage />} />
        
        {/* Exam flow — DUMMY DATA for now, see src/data/exams.js */}
        <Route path="/subjects/:slug/exams/:examId/intro" element={<AssessmentIntroPage />} />
        <Route path="/subjects/:slug/exams/:examId/take" element={<ExamTakingPage />} />
        <Route path="/subjects/:slug/exams/:examId/results" element={<ExamResultsPage />} />

        {/* Lawyer portal — BACKEND TODO: wrap these in an auth guard once
            Cognito is wired up, gated to users with the "lawyer" role. */}
        <Route path="/lawyer" element={<LawyerDashboard />} />
        <Route path="/lawyer/verification" element={<VerificationPage />} />
        <Route path="/lawyer/curriculum" element={<CurriculumPage />} />
        <Route path="/lawyer/questionnaire" element={<QuestionnairePage />} />
        <Route path="/lawyer/settings" element={<LawyerSettingsPage />} />
        <Route path="/lawyer/help-center" element={<LawyerHelpCenterPage />} />
        <Route path="/lawyer/legal" element={<LawyerLegalPage />} />

        {/* Super Admin portal — BACKEND TODO: wrap these in an auth guard
            once Cognito is wired up, gated to users with the "superadmin" role. */}
        <Route path="/superadmin" element={<SuperAdminDashboardPage />} />
        <Route path="/superadmin/user-control" element={<UserControlPage />} />
        <Route path="/superadmin/system-logs" element={<SystemLogsPage />} />
        <Route path="/superadmin/payment" element={<PaymentManagementPage />} />
        <Route path="/superadmin/settings" element={<SuperAdminSettingsPage />} />
        <Route path="/superadmin/help-center" element={<SuperAdminHelpCenterPage />} />
        <Route path="/superadmin/legal" element={<SuperAdminLegalPage />} />

        {/* Shared placeholder — every button that doesn't have a real page
            yet routes here instead of doing nothing. */}
        <Route path="/coming-soon" element={<ComingSoonPage />} />
      </Routes>
    </BrowserRouter>
  );
}

