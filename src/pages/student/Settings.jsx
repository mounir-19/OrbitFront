import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../api/student.api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [method, setMethod] = useState('CCP / Algeria Post');
  const [ccpNumber, setCcpNumber] = useState('');
  const [notifs, setNotifs] = useState({ skill_match: true, application_status: true, payout_release: true });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then((res) => {
        const u = res.data;
        if (u?.student?.ccp_number) setCcpNumber(u.student.ccp_number);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ ccp_number: ccpNumber });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading settings...</div>;

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Account, payout, and notifications.</p>

      <div className="border border-gray-200 rounded-xl p-6 flex flex-col gap-6">
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Payout</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Method</label>
            <div className="relative">
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm appearance-none outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 bg-white pr-8">
                <option>CCP / Algeria Post</option>
                <option>Baridimob</option>
                <option>Bank transfer</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">CCP account number</label>
            <input type="text" value={ccpNumber} onChange={e => setCcpNumber(e.target.value)} placeholder="0012345678023"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="flex flex-col gap-3">
            {[
              { key: 'skill_match', label: 'Tell me when a new brief matches my skills' },
              { key: 'application_status', label: 'Tell me when an application status changes' },
              { key: 'payout_release', label: 'Tell me when a payout is released' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={notifs[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} className="w-4 h-4 accent-indigo-600" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}