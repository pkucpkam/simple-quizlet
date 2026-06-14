import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../service/registerService';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await registerUser({ email, password, confirmPassword, username });

    if (result.success) {
      setSuccess(result.message ?? null);
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } else {
      setError(result.message || 'Đã có lỗi xảy ra!');
    }
    setLoading(false);
  };

  const inputClass = "w-full bg-claude-surface border border-claude-border rounded-claude px-3 py-2 text-sm text-claude-text placeholder:text-claude-text-3 focus:outline-none focus:ring-2 focus:ring-claude-accent focus:border-transparent transition-colors hover:border-claude-border-strong";

  return (
    <div className="min-h-screen bg-claude-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-full bg-claude-surface border border-claude-border shadow-claude flex items-center justify-center mb-4">
            <img src="/logo/brain.png" alt="Logo" className="h-7 w-7 object-contain" />
          </div>
          <h1 className="text-xl font-semibold text-claude-text">Tạo tài khoản</h1>
          <p className="text-sm text-claude-text-2 mt-1">Bắt đầu học tiếng Anh ngay hôm nay</p>
        </div>

        {/* Form card */}
        <div className="bg-claude-surface border border-claude-border rounded-claude-lg shadow-claude p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-claude-success-light border border-green-200 flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-claude-success" />
              </div>
              <p className="text-sm font-medium text-claude-text mb-1">Đăng ký thành công!</p>
              <p className="text-xs text-claude-text-2">{success}</p>
              <Link to="/login" className="mt-4 inline-flex items-center justify-center w-full bg-claude-accent text-white py-2 rounded-claude text-sm font-medium hover:bg-claude-accent-2 transition-colors">
                Đến trang đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-claude-text">Email</label>
                <input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-sm font-medium text-claude-text">Tên đăng nhập</label>
                <input id="username" type="text" placeholder="yourname" value={username}
                  onChange={(e) => setUsername(e.target.value)} required autoComplete="username" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-claude-text">Mật khẩu</label>
                <input id="password" type="password" placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-password" className="text-sm font-medium text-claude-text">Xác nhận mật khẩu</label>
                <input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className={inputClass} />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-claude-error-light border border-red-200 rounded-claude text-sm text-claude-error">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-claude-accent text-white py-2 rounded-claude text-sm font-medium
                           hover:bg-claude-accent-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-claude-accent focus:ring-offset-1
                           flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-claude-text-2 mt-5">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-claude-accent font-medium hover:text-claude-accent-2 transition-colors">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}