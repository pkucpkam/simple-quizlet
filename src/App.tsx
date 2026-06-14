import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/common/Header';
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
// import Migration from './pages/Migration';

import SRSReviewPage from './pages/SRSReviewPage';
import { Toaster } from 'react-hot-toast';

import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCreateLesson from './pages/admin/AdminCreateLesson';
import LessonView from './pages/LessonView';
import FolderView from './pages/FolderView';
import NotificationModal from './components/modal/NotificationModal';

function App() {
  const [showNotification, setShowNotification] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 to-blue-200">
      <Toaster position="top-right" reverseOrder={false} />
      <NotificationModal isOpen={showNotification} onClose={() => setShowNotification(false)} />
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        {/* <Route path="/migration" element={<Migration />} /> */}

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
           <Route path="/admin" element={<AdminDashboard />} />
           <Route path="/admin/create-lesson" element={<AdminCreateLesson />} />
        </Route>

        {/* Protected Routes - Login Required */}
        <Route element={<PrivateRoute />}>
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
        </Route>
      </Routes>
    </div>
  );
}

export default App;
