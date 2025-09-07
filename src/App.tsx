import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/common/Header';
import CreateLesson from './pages/CreateLesson';
import Login from './pages/Login';
import Register from './pages/Register';
import Study from './pages/Study';
import MyLessons from './pages/users/MyLessons';
import StudyHistory from './pages/StudyHistory';
import ReviewLessonPage from './pages/ReviewLessonPage';
import ReviewPage from './pages/ReviewPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 to-blue-200">
      <Toaster position="top-right" reverseOrder={false} />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-lesson" element={<CreateLesson />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-lessons" element={<MyLessons />} />
        <Route path="/study/:lessonId" element={<Study />} />
        <Route path="/study-history" element={<StudyHistory />} />
        <Route path="/review-page" element={<ReviewLessonPage />} />
        <Route path="/review/:lessonId" element={<ReviewPage />} />

      </Routes>
    </div>
  );
}

export default App;
