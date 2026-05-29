import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await login(form);
      const { token, user } = res.data;
      setAuth(user, token);
      if (user.status === 'pending') {
        toast('Your account is pending approval.', { icon: '⏳' });
      } else {
        toast.success(`Welcome back, ${user.first_name}!`);
      }
      const roleRoutes = { student: '/student/board', expert: '/expert/dashboard', client: '/client/overview', admin: '/admin/dashboard' };
      navigate(roleRoutes[user.role] || '/student/board');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e?.preventDefault();
    if (!forgotEmail) return toast.error('Enter your email');
    setForgotLoading(true);
    try {
      const { forgotPassword } = await import('../../api/auth.api');
      await forgotPassword({ email: forgotEmail });
      toast.success('Code sent if this email exists');
      setStep('otp');
    } catch { toast.error('Something went wrong'); }
    finally { setForgotLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otp) return toast.error('Enter the code');
    setForgotLoading(true);
    try {
      const { verifyOtp } = await import('../../api/auth.api');
      await verifyOtp({ email: forgotEmail, otp });
      toast.success('Code verified');
      setStep('reset');
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid code'); }
    finally { setForgotLoading(false); }
  };

  const handleReset = async (e) => {
    e?.preventDefault();
    if (!newPassword || newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setForgotLoading(true);
    try {
      const { resetPassword } = await import('../../api/auth.api');
      await resetPassword({ email: forgotEmail, otp, new_password: newPassword });
      toast.success('Password reset successfully');
      setStep('login');
      setForgotEmail(''); setOtp(''); setNewPassword('');
    } catch (err) { toast.error(err.response?.data?.error || 'Reset failed'); }
    finally { setForgotLoading(false); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d0a2e 0%, #080818 35%, #0a1428 65%, #0d0a2e 100%)' }}
    >

      <div className="relative z-10 w-full max-w-[420px]">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/"><img src={logo} alt="Orbite" className="h-36 w-auto block -m-3 -mb-10" /></Link>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(139,92,246,0.2)',
            backdropFilter: 'blur(16px)',
          }}
        >

          {/* ── LOGIN ── */}
          {step === 'login' && (
            <>
              <h1 className="text-[1.4rem] font-extrabold text-white mb-1 text-center">Sign in</h1>
              <p className="text-[0.85rem] text-white/50 mb-7 text-center">Enter your credentials to continue.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[0.82rem] text-white/70 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full px-4 py-[13px] rounded-xl text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none transition-all"
                    style={{ background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(100,80,180,0.3)' }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
                  />
                </div>

                <div>
                  <label className="block text-[0.82rem] text-white/70 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full px-4 py-[13px] pr-11 rounded-xl text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none transition-all"
                      style={{ background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(100,80,180,0.3)' }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={() => setStep('forgot')}
                    className="text-[0.78rem] text-violet-400 bg-transparent border-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-[13px] rounded-xl text-[0.95rem] font-semibold text-[#0a0a1a] bg-white cursor-pointer disabled:opacity-50 transition-all"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="text-[0.82rem] text-center text-white/40 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-violet-400 font-medium">
                  Get started
                </Link>
              </p>
            </>
          )}
          {step === 'forgot' && (
            <>
              <button
                type="button"
                onClick={() => setStep('login')}
                className="flex items-center gap-2 text-[0.82rem] text-white/50 bg-transparent border-none cursor-pointer mb-6"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                Back to login
              </button>
              <h1 className="text-[1.4rem] font-extrabold text-white mb-1 text-center">Forgot password?</h1>
              <p className="text-[0.85rem] text-white/50 mb-7 text-center">Enter your email and we'll send you a reset code.</p>
              <form onSubmit={handleForgot} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[0.82rem] text-white/70 mb-2">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-[13px] rounded-xl text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none transition-all"
                    style={{ background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(100,80,180,0.3)' }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-[13px] rounded-xl text-[0.95rem] font-semibold text-[#0a0a1a] bg-white cursor-pointer disabled:opacity-50 transition-all"
                >
                  {forgotLoading ? 'Sending...' : 'Send code'}
                </button>
              </form>
            </>
          )}

          {/* ── OTP VERIFY ── */}
          {step === 'otp' && (
            <>
              <button
                type="button"
                onClick={() => setStep('forgot')}
                className="flex items-center gap-2 text-[0.82rem] text-white/50 bg-transparent border-none cursor-pointer mb-6"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                Back
              </button>
              <h1 className="text-[1.4rem] font-extrabold text-white mb-1 text-center">Check your email</h1>
              <p className="text-[0.85rem] text-white/50 mb-7 text-center">
                We sent a 6-digit code to <span className="text-white/80">{forgotEmail}</span>. It expires in 10 minutes.
              </p>
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[0.82rem] text-white/70 mb-2">Verification code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-[13px] rounded-xl text-[1.4rem] font-bold text-white placeholder:text-white/20 focus:outline-none tracking-[0.5em] text-center transition-all"
                    style={{ background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(100,80,180,0.3)' }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading || otp.length < 6}
                  className="w-full py-[13px] rounded-xl text-[0.95rem] font-semibold text-[#0a0a1a] bg-white cursor-pointer disabled:opacity-50 transition-all"
                >
                  {forgotLoading ? 'Verifying...' : 'Verify code'}
                </button>
              </form>
            </>
          )}

          {/* ── RESET PASSWORD ── */}
          {step === 'reset' && (
            <>
              <h1 className="text-[1.4rem] font-extrabold text-white mb-1 text-center">Set new password</h1>
              <p className="text-[0.85rem] text-white/50 mb-7 text-center">Choose a strong password — at least 8 characters.</p>
              <form onSubmit={handleReset} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[0.82rem] text-white/70 mb-2">New password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-[13px] pr-11 rounded-xl text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none transition-all"
                      style={{ background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(100,80,180,0.3)' }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-[13px] rounded-xl text-[0.95rem] font-semibold text-[#0a0a1a] bg-white cursor-pointer disabled:opacity-50 transition-all"
                >
                  {forgotLoading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}