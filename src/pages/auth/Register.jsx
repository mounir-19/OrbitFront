import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const ROLES = ['student', 'client'];
const DOMAINS = ['web_dev', 'mobile_dev', 'ui_ux_design', 'video_editing'];

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', role: 'student', domain: 'web_dev',
    // student fields
    university: '', wilaya: '', cv_url: '', portfolio_url: '',
    // client fields
    company: '', city: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await register(form);
      const { token, user } = res.data;
      setAuth(user, token);

      const roleRoutes = {
        student: '/student/board',
        expert:  '/expert/dashboard',
        client:  '/client/overview',
        admin:   '/admin/dashboard',
      };
      navigate(roleRoutes[user.role] || '/student/board');
      toast.success('Account created! Welcome to TalentBridge.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900">TalentBridge</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl px-8 py-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Join TalentBridge as a student or client.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
              <div className="flex gap-2">
                {ROLES.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => set('role', r)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${
                      form.role === r
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" value={form.first_name} onChange={v => set('first_name', v)} placeholder="Mounir" />
              <Field label="Last name"  value={form.last_name}  onChange={v => set('last_name', v)}  placeholder="Rabahi" />
            </div>

            <Field label="Email"  type="email" value={form.email}    onChange={v => set('email', v)}    placeholder="you@example.com" />
            <Field label="Phone"  type="tel"   value={form.phone}    onChange={v => set('phone', v)}    placeholder="+213 555 000 000" />
            <Field label="Password" type="password" value={form.password} onChange={v => set('password', v)} placeholder="Min. 8 characters" />

            {/* Student-specific fields */}
            {form.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                  <select
                    value={form.domain}
                    onChange={e => set('domain', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 appearance-none bg-white"
                  >
                    {DOMAINS.map(d => (
                      <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <Field label="University" value={form.university} onChange={v => set('university', v)} placeholder="ESI Algiers" />
                <Field label="Wilaya"     value={form.wilaya}     onChange={v => set('wilaya', v)}     placeholder="Oran" />
                <Field label="Portfolio URL (optional)" value={form.portfolio_url} onChange={v => set('portfolio_url', v)} placeholder="https://..." />
              </>
            )}

            {/* Client-specific fields */}
            {form.role === 'client' && (
              <>
                <Field label="Company name" value={form.company} onChange={v => set('company', v)} placeholder="NovaClinic SARL" />
                <Field label="City"          value={form.city}   onChange={v => set('city', v)}    placeholder="Algiers" />
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-700 text-white rounded-lg text-sm font-semibold hover:bg-indigo-800 disabled:opacity-60 transition-colors mt-1"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
      />
    </div>
  );
}
