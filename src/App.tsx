import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/common/Header';
import CreateLesson from './pages/CreateLesson';
import Login from './pages/Login';
import Register from './pages/Register';
import Study from './pages/Study';
import MyLessons from './pages/users/MyLessons';
import FolderDetailPage from './pages/users/FolderDetailPage';
import EditLesson from './pages/users/EditLesson';
import StudyHistory from './pages/StudyHistory';
import ReviewLessonPage from './pages/ReviewLessonPage';
import ReviewPage from './pages/ReviewPage';
import VerifyEmail from './pages/VerifyEmail';
import { Toaster } from 'react-hot-toast';

import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 to-blue-200">
      <Toaster position="top-right" reverseOrder={false} />
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected Routes - Login Required */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/create-lesson" element={<CreateLesson />} />
          <Route path="/my-lessons" element={<MyLessons />} />
          <Route path="/folder/:folderId" element={<FolderDetailPage />} />
          <Route path="/edit/:lessonId" element={<EditLesson />} />
          <Route path="/study/:lessonId" element={<Study />} />
          <Route path="/study-history" element={<StudyHistory />} />
          <Route path="/review-page" element={<ReviewLessonPage />} />
          <Route path="/review/:lessonId" element={<ReviewPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
