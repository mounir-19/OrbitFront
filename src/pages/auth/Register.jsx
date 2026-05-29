import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';
import TermsModal from '../landing/TermsModal';

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', confirm_password: '',
    role: 'client',
    company: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.password || !form.confirm_password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!termsAccepted) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }
    setLoading(true);
    try {
      const { confirm_password, ...payload } = form;
      const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== ''));
      const res = await register({ ...cleanPayload, terms_accepted: termsAccepted });
      const { token, user } = res.data;
      setAuth(user, token);
      toast.success('Account created! Welcome to Orbite.');
      navigate('/client/overview');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden"
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
          <h1 className="text-[1.4rem] font-extrabold text-white mb-1 text-center">Create account</h1>
          <p className="text-[0.85rem] text-white/50 mb-7 text-center">Start your first project with Orbite.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Full name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.82rem] text-white/70 mb-2">First name</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => set('first_name', e.target.value)}
                  placeholder="Mounir"
                  className="w-full px-4 py-[13px] rounded-xl text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none transition-all"
                  style={{ background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(100,80,180,0.3)' }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
                />
              </div>
              <div>
                <label className="block text-[0.82rem] text-white/70 mb-2">Last name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => set('last_name', e.target.value)}
                  placeholder="Rabahi"
                  className="w-full px-4 py-[13px] rounded-xl text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none transition-all"
                  style={{ background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(100,80,180,0.3)' }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Phone */}
            <div>
              <label className="block text-[0.82rem] text-white/70 mb-2">Phone number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+213 555 000 000"
                className="w-full px-4 py-[13px] rounded-xl text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none transition-all"
                style={{ background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(100,80,180,0.3)' }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
              />
            </div>

            {/* Company (optional) */}
            <div>
              <label className="block text-[0.82rem] text-white/70 mb-2">
                Company name <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="text"
                value={form.company}
                onChange={e => set('company', e.target.value)}
                placeholder="NovaClinic SARL"
                className="w-full px-4 py-[13px] rounded-xl text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none transition-all"
                style={{ background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(100,80,180,0.3)' }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[0.82rem] text-white/70 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="Min. 8 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-[0.82rem] text-white/70 mb-2">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={e => set('confirm_password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-[13px] pr-11 rounded-xl text-[0.9rem] text-white placeholder:text-white/30 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(30,30,60,0.8)',
                    border: `1px solid ${form.confirm_password && form.confirm_password !== form.password ? 'rgba(239,68,68,0.5)' : 'rgba(100,80,180,0.3)'}`,
                  }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={e => e.target.style.borderColor = form.confirm_password && form.confirm_password !== form.password ? 'rgba(239,68,68,0.5)' : 'rgba(100,80,180,0.3)'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 bg-transparent border-none cursor-pointer"
                >
                  {showConfirm ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              {form.confirm_password && form.confirm_password !== form.password && (
                <p className="text-[0.75rem] text-red-400 mt-1.5">Passwords do not match</p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-3 -mb-2">
              <button
                type="button"
                onClick={() => setTermsAccepted(s => !s)}
                className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-md border cursor-pointer transition-all flex items-center justify-center"
                style={{
                  background: termsAccepted ? '#8b5cf6' : 'rgba(30,30,60,0.8)',
                  border: `1px solid ${termsAccepted ? '#8b5cf6' : 'rgba(100,80,180,0.4)'}`,
                }}
              >
                {termsAccepted && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </button>
              <p className="text-[0.78rem] text-white/40 leading-relaxed">
                I agree to the{' '}
                <button type="button" onClick={() => setShowTerms(true)} className="text-violet-400 bg-transparent border-none cursor-pointer p-0 underline">Terms & Conditions</button>
                {' '}and confirm all information provided is accurate.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[13px] rounded-xl text-[0.95rem] font-semibold text-[#0a0a1a] bg-white cursor-pointer disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-[0.82rem] text-center text-white/40 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}