import { useState } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import CreateLesson from './pages/CreateLesson';
import Login from './pages/Login';
import Register from './pages/Register';
import Study from './pages/Study';
import MyLessons from './pages/users/MyLessons';
import EditLesson from './pages/users/EditLesson';
import StudyHistory from './pages/StudyHistory';
import ReviewPage from './pages/ReviewPage';
import TestPage from './pages/TestPage';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import SRSReviewPage from './pages/SRSReviewPage';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCreateLesson from './pages/admin/AdminCreateLesson';
import LessonView from './pages/LessonView';
import FolderView from './pages/FolderView';
import AsteroidMatch from './pages/AsteroidMatch';
import NotificationModal from './components/modal/NotificationModal';
import AppLayout from './components/layout/AppLayout';

// Layout wrapper that provides sidebar for authenticated routes
const AuthenticatedLayout = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

function App() {
  const [showNotification, setShowNotification] = useState(false);

  return (
    <div className="min-h-screen bg-claude-bg font-sans">
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: 'var(--claude-surface)',
            color: 'var(--claude-text)',
            border: '1px solid var(--claude-border)',
            borderRadius: '0.5rem',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: 'var(--claude-success)', secondary: 'var(--claude-surface)' },
          },
          error: {
            iconTheme: { primary: 'var(--claude-error)', secondary: 'var(--claude-surface)' },
          },
        }}
      />
      <NotificationModal isOpen={showNotification} onClose={() => setShowNotification(false)} />

      <Routes>
        {/* Public Routes – no sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Admin Routes – with sidebar */}
        <Route element={<AdminRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/create-lesson" element={<AdminCreateLesson />} />
          </Route>
        </Route>

        {/* Protected Routes – with sidebar */}
        <Route element={<PrivateRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/srs-review" element={<SRSReviewPage />} />
            <Route path="/create-lesson" element={<CreateLesson />} />
            <Route path="/my-lessons" element={<MyLessons />} />
            <Route path="/folder/:folderId" element={<FolderView />} />
            <Route path="/edit/:lessonId" element={<EditLesson />} />
            <Route path="/study/:lessonId" element={<Study />} />
            <Route path="/study-history" element={<StudyHistory />} />
            <Route path="/review/:lessonId" element={<ReviewPage />} />
            <Route path="/test/:lessonId" element={<TestPage />} />
            <Route path="/lesson/:lessonId" element={<LessonView />} />
            <Route path="/asteroid-match/:lessonId" element={<AsteroidMatch />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
