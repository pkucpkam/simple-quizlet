import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../service/firebase_setup';
import { logoutUser } from '../../service/authService';
import { getUserInfo } from '../../service/userService';

const Header: React.FC = () => {
  console.log('[Header] Rendering Header component');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[Header] Setting up auth state listener');
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      console.log('[Header] Found user in sessionStorage:', userData);
      setIsLoggedIn(userData.isLoggedIn);
      setUsername(userData.username);
      setLoading(false);
      return; 
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Header] onAuthStateChanged triggered, user:', user?.email);
      if (user && user.emailVerified) {
        setIsLoggedIn(true);
        const userInfo = await getUserInfo(user);
        console.log('[Header] Fetched userInfo:', userInfo);
        setUsername(userInfo.username);
        sessionStorage.setItem(
          'user',
          JSON.stringify({
            username: userInfo.username,
            email: user.email,
            isLoggedIn: true,
          })
        );
      } else {
        setIsLoggedIn(false);
        setUsername(null);
        sessionStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => {
      console.log('[Header] Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      sessionStorage.removeItem('user'); 
      setIsLoggedIn(false);
      setUsername(null);
      navigate('/login');
    } else {
      console.error('Lỗi đăng xuất:', result.message);
    }
  };

  return (
    <header className="bg-white w-full shadow">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link className="block text-teal-600" to="/">
          <span className="sr-only">Home</span>
          <img src="/logo/brain.png" alt="Logo" className="h-10 w-10 object-contain" />
        </Link>
        <div className="flex flex-1 items-center justify-end md:justify-between">
          <nav aria-label="Global" className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm">
              <li>
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="/"> Trang chủ </Link>
              </li>
              
              <li>
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="my-lessons"> Bài học của tôi </Link>
              </li>
              <li>
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="#"> Bài học đã lưu </Link>
              </li>
              <li>
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="create-lesson"> Tạo bài học </Link>
              </li>
              <li>
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="study-history"> Lịch sử </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            {loading ? (
              <p className="text-gray-500">Đang tải...</p>
            ) : isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Xin chào, {username}</span>
                <button
                  onClick={handleLogout}
                  className="block rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="sm:flex sm:gap-4">
                <a
                  className="block rounded-md bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700"
                  href="/login"
                >
                  Login
                </a>
                <a
                  className="hidden rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-teal-600 transition hover:text-teal-600/75 sm:block"
                  href="/register"
                >
                  Register
                </a>
              </div>
            )}
            <button
              className="block rounded-sm bg-gray-100 p-2.5 text-gray-600 transition hover:text-gray-600/75 md:hidden"
            >
              <span className="sr-only">Toggle menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;