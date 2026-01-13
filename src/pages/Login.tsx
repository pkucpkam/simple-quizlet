import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../service/loginService';
import { getUserInfo } from '../service/userService';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await loginUser({ email, password });

    if (result.success && result.user) {
      const userInfo = await getUserInfo(result.user);
      sessionStorage.setItem('user', JSON.stringify({
        uid: result.user.uid, // Add uid for history feature
        username: userInfo.username,
        email: result.user.email,
        isLoggedIn: true,
      }));
      navigate('/');
    } else {
      if (result.message === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email');
        return;
      }
      setError(result.message || 'Đã có lỗi xảy ra!');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Đăng nhập</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 px-4 py-2 border rounded"
          required
        />
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Đăng nhập
        </button>
      </form>
      <div>
        <p className="mt-4 text-center">
          Chưa có tài khoản? <a href="/register" className="text-blue-600 hover:underline">Đăng ký</a>
        </p>
      </div>
    </div>
  );
}