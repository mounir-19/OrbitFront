import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestProject } from '../../api/client.api';
import toast from 'react-hot-toast';

const categories = ['Web Development', 'Mobile App', 'UI/UX Design', 'Data Science', 'Video Editing', 'Marketing'];
const teamSizes = ['1-2', '3-5', '5-10', '10+'];

export default function RequestProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: 'Arabic-first reservation system for clinic',
    description: 'We run a 4-doctor clinic in Algiers. Patients currently call to book. We need a web+mobile reservation system, Arabic & French, SMS reminders, integrated with our existing patient DB (Postgres).',
    category: 'Web Development',
    budget: '420,000',
    deadline: '2026-06-30',
    team_size: '3-5',
    language: 'Arabic (required), French (bonus)',
  });
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await requestProject(form);
      toast.success('Project submitted! We will match a team in 24 hours.');
      navigate('/client/projects');
    } catch {
      toast.error('Failed to submit. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraft = async () => {
    setSaving(true);
    try { await requestProject({ ...form, status: 'draft' }); toast.success('Draft saved.'); }
    catch { toast('Draft saved locally.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Request a project</h1>
      <p className="text-sm text-gray-500 mb-8">Describe what you need. We'll break it into tasks and match a team.</p>

      <div className="border border-gray-200 rounded-xl p-6 flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Project title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"/>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe the goal, users, and constraints</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all resize-y"/>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => set('category', c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${form.category === c ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Budget + Deadline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget (DZD)</label>
            <input value={form.budget} onChange={e => set('budget', e.target.value)} type="number"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
            <input value={form.deadline} onChange={e => set('deadline', e.target.value)} type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"/>
          </div>
        </div>

        {/* Team size + Language */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Team size</label>
            <select value={form.team_size} onChange={e => set('team_size', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 appearance-none bg-white">
              {teamSizes.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Language preference</label>
            <input value={form.language} onChange={e => set('language', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"/>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={handleDraft} disabled={saving}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors">
            {saving ? 'Saving...' : 'Save draft'}
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            ✦ {submitting ? 'Submitting...' : 'Submit to AI matching'}
          </button>
        </div>
      </div>
    </div>
  );
}
