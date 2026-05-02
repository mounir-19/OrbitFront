import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../api/student.api';
import { getMyRatings } from '../../api/student.api';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_SKILLS = ['React', 'Next.js', 'TypeScript', 'Node', 'Tailwind', 'i18n', 'Figma', 'Git', 'Python', 'Flutter', 'SQL'];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ projects_completed: 0, on_time: '—', client_rating: '—', repeat_clients: 0 });
  const [skills, setSkills] = useState([]);
  const [availability, setAvailability] = useState(15);
  const [hourlyTarget, setHourlyTarget] = useState(1200);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [visibleOnBoard, setVisibleOnBoard] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getProfile(), getMyRatings()])
      .then(([profileRes, ratingsRes]) => {
        if (profileRes.status === 'fulfilled') {
          const u = profileRes.value.data;
          setProfile(u);
          setBio(u.student?.bio || '');
          setSkills(u.student?.skills ? u.student.skills.split(',').map(s => s.trim()) : []);
          setAvailability(u.student?.availability_hrs || 15);
          setHourlyTarget(u.student?.hourly_target || 1200);
        }
        if (ratingsRes.status === 'fulfilled') {
          const ratings = ratingsRes.value.data || [];
          if (ratings.length > 0) {
            const avg = ratings.reduce((s, r) => s + ((r.quality + r.deadline + r.communication + r.collaboration + r.technical) / 5), 0) / ratings.length;
            setStats(s => ({ ...s, client_rating: avg.toFixed(1), projects_completed: ratings.length }));
          }
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const toggleSkill = (skill) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        university: profile?.student?.university,
        wilaya: profile?.student?.wilaya,
        cv_url: profile?.student?.cv_url,
        portfolio_url: profile?.student?.portfolio_url,
      });
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading profile...</div>;

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
      <p className="text-sm text-gray-500 mb-8">This is what experts and clients see when you apply.</p>

      <div className="flex gap-5">
        <div className="flex-1 border border-gray-200 rounded-xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-semibold text-indigo-600">{initials}</div>
            <div>
              <div className="font-bold text-gray-900 text-lg">{profile?.first_name} {profile?.last_name}</div>
              <div className="text-sm text-gray-500">{profile?.student?.university || '—'} · {profile?.domain}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map(skill => (
                <button key={skill} onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${skills.includes(skill) ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Availability (hrs/week)</label>
              <input type="number" value={availability} onChange={e => setAvailability(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly target (DZD)</label>
              <input type="number" value={hourlyTarget} onChange={e => setHourlyTarget(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </div>

        <div className="w-56 flex flex-col gap-4">
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="font-semibold text-gray-900 mb-3">Stats</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Projects completed</span><span className="font-semibold">{stats.projects_completed}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Client rating</span><span className="font-semibold flex items-center gap-1"><Star size={13} className="text-yellow-400 fill-yellow-400" /> {stats.client_rating}</span></div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="font-semibold text-gray-900 mb-3">Visibility</div>
            <label className="flex items-center gap-2.5 cursor-pointer mb-2">
              <input type="checkbox" checked={visibleOnBoard} onChange={e => setVisibleOnBoard(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm text-gray-700">Visible on project board</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}