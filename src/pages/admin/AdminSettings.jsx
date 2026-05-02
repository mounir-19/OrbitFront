import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { changePassword } from '../../api/admin.api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
    const { user } = useAuthStore();
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!currentPw || !newPw) { toast.error('Fill in both fields'); return; }
        setSaving(true);
        try {
            await changePassword({ current_password: currentPw, new_password: newPw });
            toast.success('Password updated!');
            setCurrentPw(''); setNewPw('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="px-8 py-8 max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
            <p className="text-sm text-gray-500 mb-8">Admin account preferences.</p>

            <div className="border border-gray-200 rounded-xl p-6 flex flex-col gap-5">
                <div>
                    <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                            <input disabled value={`${user?.first_name || ''} ${user?.last_name || ''}`}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input disabled value={user?.email || ''}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="font-semibold text-gray-900 mb-4">Change password</h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
                            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
                        </div>
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