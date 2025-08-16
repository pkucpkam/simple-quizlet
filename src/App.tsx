import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/common/Header';
import CreateLesson from './pages/CreateLesson';
import Login from './pages/Login';
import Register from './pages/Register';
import Study from './pages/Study';
import MyLessons from './pages/users/MyLessons';
import StudyHistory from './pages/StudyHistory';
import Practice from './pages/Practice';
import Quiz from './pages/Quiz';
import QuizReverse from './pages/QuizReverse';
import MatchingGame from './pages/MatchingGame';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 to-blue-200">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-lesson" element={<CreateLesson />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-lessons" element={<MyLessons />} />
        <Route path="/study/:lessonId" element={<Study />} />
        <Route path="/study-history" element={<StudyHistory />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz-reverse" element={<QuizReverse />} />
        <Route path="/matching" element={<MatchingGame />} />
      </Routes>
    </div>
  );
}

export default App;
