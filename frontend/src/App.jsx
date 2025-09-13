import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import Navbar from './components/Navbar';

// Public Pages
import HomePage from './pages/public/HomePage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPassword';
import ResetPasswordPage from './pages/auth/ResetPassword';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import QuizManagementPage from './pages/admin/QuizManagement';
import EditQuizPage from './pages/admin/EditQuizPage';
import UserManagementPage from './pages/admin/UserManagement';
import AddQuizPage from './pages/admin/AddQuizPage';
import AdminResultsPage from './pages/admin/AdminResultsPage';

// Nouvelles pages pour la génération IA
import AIGeneratorPage from './pages/admin/AIGeneratorPage';
import QuizPreviewPage from './pages/admin/QuizPreviewPage';

// User Pages
import QuizListPage from './pages/user/QuizListPage';
import TakeQuizPage from './pages/user/TakeQuizPage';
import ResultsPage from './pages/user/ResultsPage';
import ProfilePage from './pages/user/ProfilePage';
import DetailsPage from './pages/user/QuizDetailsPage';
import SettingsPage from './pages/user/SettingsPage'

// Error Pages
import NotFoundPage from './pages/error/NotFoundPage';

const AppContent = () => {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/quiz-management" element={<QuizManagementPage />} />
        <Route path="/admin/quiz/:id/edit" element={<EditQuizPage />} />
        <Route path="/admin/user-management" element={<UserManagementPage />} />
        <Route path="/admin/results" element={<AdminResultsPage />} />
        
        {/* Quiz Management Routes */}
        <Route path="/admin/quiz/add" element={<AddQuizPage />} />
      
        {/* AI Generation Flow Routes */}
        <Route path="/admin/ai-generator" element={<AIGeneratorPage />} />
        <Route path="/admin/quiz-preview/:id" element={<QuizPreviewPage />} />

        
        
        {/* User Routes */}
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/quizzes" element={<QuizListPage />} />
        <Route path="/quiz/:id" element={<TakeQuizPage />} />
        <Route path="student/results" element={<ResultsPage />} />
        <Route path="/quiz/details/:resultId" element={<DetailsPage />} />
        <Route path="/student/settings" element={<SettingsPage />} />
        {/* Error Routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;