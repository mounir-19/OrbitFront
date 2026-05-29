import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { changePassword } from '../../api/admin.api';
import toast from 'react-hot-toast';
import { User, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
];

const INPUT_CLS = 'w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all';
const INPUT_DISABLED = 'w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] text-[#9ca3af] bg-[#fafafa] cursor-not-allowed';

export default function AdminSettings() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');

    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPwd || !newPwd || !confirmPwd) { toast.error('Fill in all fields'); return; }
        if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }
        if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        setSaving(true);
        try {
            await changePassword({ current_password: currentPwd, new_password: newPwd });
            toast.success('Password updated');
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update password');
        } finally { setSaving(false); }
    };

    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

    return (
        <div className="min-h-screen bg-[#fafafa] px-8 py-8">

            {/* ── Header ──────────────────────────────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Settings</h1>
                <p className="text-sm text-[#6b7280] mt-1.5">Manage your admin account and security.</p>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-0.5 border-b border-[#f5f3ff] mb-8">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors
                ${activeTab === tab.id ? 'text-[#7c3aed]' : 'text-[#9ca3af] hover:text-[#6b7280]'}`}>
                            <Icon size={13} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#7c3aed] rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Profile Tab ─────────────────────────────────────────────────────── */}
            {activeTab === 'profile' && (
                <div className="flex gap-5 items-start">

                    {/* Main card */}
                    <div className="flex-1 bg-white border border-[#ede9fe] rounded-2xl p-6 space-y-6">
                        <h2 className="text-sm font-bold text-[#111827] uppercase tracking-widest">Account Information</h2>

                        {/* Avatar row */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-[#ede9fe] flex items-center justify-center text-xl font-bold text-[#7c3aed] flex-shrink-0">
                                {initials}
                            </div>
                            <div>
                                <p className="text-[15px] font-bold text-[#111827]">{user?.first_name} {user?.last_name}</p>
                                <p className="text-[12px] text-[#9ca3af]">{user?.email}</p>
                                <p className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest mt-0.5">Platform Operator</p>
                            </div>
                        </div>

                        {/* Name fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">First Name</label>
                                <input type="text" value={user?.first_name || ''} disabled className={INPUT_DISABLED} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Last Name</label>
                                <input type="text" value={user?.last_name || ''} disabled className={INPUT_DISABLED} />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Email</label>
                            <input type="email" value={user?.email || ''} disabled className={INPUT_DISABLED} />
                            <p className="text-[11px] text-[#d1d5db] mt-1">Email cannot be changed.</p>
                        </div>

                        {/* Phone */}
                        {user?.phone && (
                            <div>
                                <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Phone</label>
                                <input type="text" value={user.phone} disabled className={INPUT_DISABLED} />
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-56 flex-shrink-0 space-y-4">
                        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield size={13} className="text-[#7c3aed]" />
                                <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">Account</p>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Role', value: 'Admin', color: 'text-[#7c3aed]' },
                                    { label: 'Status', value: 'Active', color: 'text-emerald-600' },
                                    { label: 'Access', value: 'Full', color: 'text-[#111827]' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="flex justify-between items-center">
                                        <span className="text-[12px] text-[#9ca3af]">{label}</span>
                                        <span className={`text-[12px] font-bold ${color}`}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Dark card */}
                        <div className="bg-[#1e1b4b] rounded-2xl p-5">
                            <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center mb-3">
                                <Shield size={14} className="text-white" />
                            </div>
                            <p className="text-[13px] font-bold text-white mb-1">Admin Console</p>
                            <p className="text-[11px] text-[#a5b4fc] leading-relaxed">
                                You have full platform access. Keep your credentials secure.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Security Tab ────────────────────────────────────────────────────── */}
            {activeTab === 'security' && (
                <div className="max-w-xl">
                    <div className="bg-white border border-[#ede9fe] rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-[#111827] uppercase tracking-widest mb-1">Change Password</h2>
                        <p className="text-[13px] text-[#9ca3af] mb-6">Choose a strong password of at least 8 characters.</p>

                        <div className="space-y-4 mb-6">

                            {/* Current password */}
                            <div>
                                <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={currentPwd}
                                        onChange={e => setCurrentPwd(e.target.value)}
                                        className={`${INPUT_CLS} pr-10`}
                                    />
                                    <button onClick={() => setShowCurrent(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]">
                                        {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* New password */}
                            <div>
                                <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        value={newPwd}
                                        onChange={e => setNewPwd(e.target.value)}
                                        className={`${INPUT_CLS} pr-10`}
                                    />
                                    <button onClick={() => setShowNew(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]">
                                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                {newPwd && newPwd.length < 8 && (
                                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                                        <AlertCircle size={11} /> At least 8 characters required
                                    </p>
                                )}
                                {newPwd && newPwd.length >= 8 && (
                                    <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1">
                                        <CheckCircle size={11} /> Password strength looks good
                                    </p>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label className="block text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPwd}
                                    onChange={e => setConfirmPwd(e.target.value)}
                                    className={INPUT_CLS}
                                />
                                {confirmPwd && newPwd !== confirmPwd && (
                                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle size={11} /> Passwords do not match
                                    </p>
                                )}
                                {confirmPwd && newPwd === confirmPwd && newPwd.length >= 8 && (
                                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                                        <CheckCircle size={11} /> Passwords match
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-[#f5f3ff]">
                            <button
                                onClick={handleChangePassword}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
                            >
                                {saving ? 'Updating…' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}