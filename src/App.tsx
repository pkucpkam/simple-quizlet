import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Header from './components/common/Header';
import CreateLesson from './pages/CreateLesson';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 to-blue-200">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-lesson" element={<CreateLesson />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}

export default App;
