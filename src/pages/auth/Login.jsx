import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await login(form);
      const { token, user } = res.data;
      setAuth(user, token);

      if (user.status === 'pending') {
        toast('Your account is pending approval. You can browse but some features are limited.', { icon: '⏳' });
      } else {
        toast.success(`Welcome back, ${user.first_name}!`);
      }

      const roleRoutes = {
        student: '/student/board',
        expert: '/expert/dashboard',
        client: '/client/overview',
        admin: '/admin/dashboard',
      };
      navigate(roleRoutes[user.role] || '/student/board');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.3" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">TalentBridge</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl px-8 py-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-700 text-white rounded-lg text-sm font-semibold hover:bg-indigo-800 disabled:opacity-60 transition-colors mt-1"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}