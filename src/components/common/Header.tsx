import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../service/firebase_setup';
import { logoutUser } from '../../service/authService';
import { getUserInfo } from '../../service/userService';


const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setIsLoggedIn(userData.isLoggedIn);
      setUsername(userData.username);
      setUserRole(userData.role || 'USER');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setIsLoggedIn(true);
        const userInfo = await getUserInfo(user);
        setUsername(userInfo.username);
        setUserRole(userInfo.role || 'USER');
        sessionStorage.setItem(
          'user',
          JSON.stringify({
            uid: user.uid,
            username: userInfo.username,
            role: userInfo.role || 'USER',
            email: user.email,
            isLoggedIn: true,
          })
        );
      } else {
        setIsLoggedIn(false);
        setUsername(null);
        setUserRole(null);
        sessionStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);



  // Load due cards count


  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      sessionStorage.removeItem('user');
      setIsLoggedIn(false);
      setUsername(null);
      setUserRole(null);
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
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="create-lesson"> Tạo bài học </Link>
              </li>
              <li>
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="study-history"> Lịch sử </Link>
              </li>
              <li>
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="test-page"> Kiểm tra </Link>
              </li>
              <li>
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="review-page"> Ôn tập </Link>
              </li>
              <li>
                <Link className="text-black text-base font-medium transition hover:text-blue-700" to="leaderboard"> Bảng xếp hạng </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            {loading ? (
              <p className="text-gray-500">Đang tải...</p>
            ) : isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 transition hover:bg-gray-200"
                >
                  <span className="text-sm font-medium text-gray-700">Xin chào, {username}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-gray-100 bg-white shadow-lg z-50">
                    <div className="p-2">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                      >
                        Hồ sơ cá nhân
                      </Link>
                      {userRole === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="block rounded-lg px-4 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50"
                        >
                          Quản lý (Admin)
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
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