import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../service/loginService';
import { getUserInfo } from '../service/userService';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await loginUser({ email, password });

    if (result.success && result.user) {
      const userInfo = await getUserInfo(result.user);
      sessionStorage.setItem('user', JSON.stringify({
        uid: result.user.uid,
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
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-claude-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-full bg-claude-surface border border-claude-border shadow-claude flex items-center justify-center mb-4">
            <img src="/logo/brain.png" alt="Logo" className="h-7 w-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-claude-text">Đăng nhập</h1>
          <p className="text-sm text-claude-text-2 mt-1">Chào mừng bạn trở lại</p>
        </div>

        {/* Form card */}
        <div className="bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude p-6">
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-claude-text">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-claude-surface border border-claude-border rounded-claude px-3 py-2 text-sm text-claude-text placeholder:text-claude-text-3
                           focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent transition-colors hover:border-claude-border-strong"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-claude-text">Mật khẩu</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-claude-surface border border-claude-border rounded-claude px-3 py-2 text-sm text-claude-text placeholder:text-claude-text-3
                           focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent transition-colors hover:border-claude-border-strong"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-claude-error-light border border-red-200 rounded-claude text-sm text-claude-error">
                <svg className="h-4 w-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-claude-accent text-white py-2 rounded-claude text-sm font-medium
                         hover:bg-claude-accent-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-claude-accent focus:ring-offset-1
                         flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-claude-text-2 mt-5">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-claude-accent font-medium hover:text-claude-accent-2 transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}