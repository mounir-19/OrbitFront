import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
    updateProfile, changePassword,
    getNotifications, markNotificationRead, markAllRead,
} from '../../api/client.api';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import {
    User, Lock, Bell, Check, Trash2,
    CheckCircle, AlertCircle, Eye, EyeOff,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Label = ({ children }) => (
    <label className="block text-[12px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">
        {children}
    </label>
);

const Field = ({ className = '', ...props }) => (
    <input
        {...props}
        className={`w-full px-4 py-2.5 rounded-xl border border-[#ede9fe] text-[13px] bg-[#fafafa]
      focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-[#7c3aed]
      placeholder:text-[#c4b5fd] disabled:opacity-50 disabled:cursor-not-allowed
      transition-all ${className}`}
    />
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientSettings() {
    const { user } = useAuthStore();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');

    // ── Profile state ──────────────────────────────────────────────────────────
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [city, setCity] = useState('');
    const [saving, setSaving] = useState(false);

    // ── Security state ─────────────────────────────────────────────────────────
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);

    // ── Notifications state ────────────────────────────────────────────────────
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);

    // ── Seed profile ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setPhone(user.phone || '');
            setCompany(user.client?.company || '');
            setCity(user.client?.city || '');
        }
    }, [user]);

    // ── Load notifs when tab opens ─────────────────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'notifications') return;
        setLoadingNotifs(true);
        getNotifications()
            .then(res => setNotifications(res.data || []))
            .catch(() => { })
            .finally(() => setLoadingNotifs(false));
    }, [activeTab]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await updateProfile({ first_name: firstName, last_name: lastName, phone, company, city });
            toast.success('Profile saved');
        } catch {
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPwd || !newPwd || !confirmPwd) { toast.error('Fill in all fields'); return; }
        if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }
        if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        setSavingPwd(true);
        try {
            await changePassword({ current_password: currentPwd, new_password: newPwd });
            toast.success('Password updated');
            setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        } catch {
            toast.error('Failed to update password');
        } finally {
            setSavingPwd(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch { toast.error('Failed'); }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All marked as read');
        } catch { toast.error('Failed'); }
    };

    const handleDeleteNotif = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch { toast.error('Failed to delete'); }
    };

    // ── Derived ────────────────────────────────────────────────────────────────
    const unreadCount = notifications.filter(n => !n.read).length;
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

    const TABS = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] px-8 py-10">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-1 h-5 rounded-full bg-[#7c3aed] inline-block" />
                    <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight">Settings</h1>
                </div>
                <p className="text-sm text-[#9ca3af] pl-3">Manage your profile, security, and notifications.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 border-b border-[#ede9fe] mb-8">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${activeTab === tab.id ? 'text-[#111827]' : 'text-[#9ca3af] hover:text-[#6b7280]'
                                }`}
                        >
                            <Icon size={14} />
                            {tab.label}
                            {tab.id === 'notifications' && unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-[#f5f3ff] text-[#7c3aed] text-[10px] font-bold rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#7c3aed] rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Profile tab ───────────────────────────────────────────────────── */}
            {activeTab === 'profile' && (
                <div className="flex gap-6 items-start">

                    {/* Main form */}
                    <div className="flex-1 bg-white border border-[#ede9fe] rounded-2xl p-6 space-y-5">
                        <h2 className="text-[15px] font-semibold text-[#111827]">Personal information</h2>

                        {/* Avatar row */}
                        <div className="flex items-center gap-4 pb-5 border-b border-[#f5f3ff]">
                            <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] flex items-center justify-center text-xl font-bold text-[#7c3aed] flex-shrink-0">
                                {initials}
                            </div>
                            <div>
                                <p className="text-[14px] font-semibold text-[#111827]">{user?.first_name} {user?.last_name}</p>
                                <p className="text-[12px] text-[#9ca3af]">{user?.email}</p>
                                <p className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest mt-0.5">
                                    {user?.client?.company || 'Client Account'}
                                </p>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>First Name</Label>
                                <Field value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
                            </div>
                            <div>
                                <Label>Last Name</Label>
                                <Field value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
                            </div>
                        </div>

                        {/* Email read-only */}
                        <div>
                            <Label>Email</Label>
                            <Field value={user?.email || ''} disabled />
                            <p className="text-[11px] text-[#9ca3af] mt-1">Email cannot be changed. Contact support if needed.</p>
                        </div>

                        {/* Phone */}
                        <div>
                            <Label>Phone</Label>
                            <Field value={phone} onChange={e => setPhone(e.target.value)} placeholder="+213 xxx xxx xxx" />
                        </div>

                        {/* Company + City */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Company Name</Label>
                                <Field value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company" />
                            </div>
                            <div>
                                <Label>City</Label>
                                <Field value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Alger, Oran" />
                            </div>
                        </div>

                        {/* Save */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-[13px] font-semibold disabled:opacity-60 transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-56 flex-shrink-0 space-y-4">
                        <div className="bg-white border border-[#ede9fe] rounded-2xl p-5">
                            <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-4">Account</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-[#6b7280]">Role</span>
                                    <span className="text-[12px] font-bold text-[#7c3aed] uppercase tracking-widest">Client</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-[#6b7280]">Status</span>
                                    <span className="text-[12px] font-bold text-green-600 uppercase tracking-widest">
                                        {user?.status || 'Active'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-[#6b7280]">Member since</span>
                                    <span className="text-[12px] font-bold text-[#374151]">
                                        {user?.created_at
                                            ? new Date(user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Security tab ──────────────────────────────────────────────────── */}
            {activeTab === 'security' && (
                <div className="bg-white border border-[#ede9fe] rounded-2xl p-6 max-w-2xl">
                    <h2 className="text-[15px] font-semibold text-[#111827] mb-1">Change password</h2>
                    <p className="text-[13px] text-[#9ca3af] mb-6">Choose a strong password of at least 8 characters.</p>

                    <div className="space-y-4 mb-6">

                        {/* Current password */}
                        <div>
                            <Label>Current Password</Label>
                            <div className="relative">
                                <Field
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPwd}
                                    onChange={e => setCurrentPwd(e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    onClick={() => setShowCurrent(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                                >
                                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* New password */}
                        <div>
                            <Label>New Password</Label>
                            <div className="relative">
                                <Field
                                    type={showNew ? 'text' : 'password'}
                                    value={newPwd}
                                    onChange={e => setNewPwd(e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    onClick={() => setShowNew(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                                >
                                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            {newPwd && newPwd.length < 8 && (
                                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={11} /> At least 8 characters required
                                </p>
                            )}
                            {newPwd && newPwd.length >= 8 && (
                                <p className="text-[11px] text-green-500 mt-1.5 flex items-center gap-1">
                                    <CheckCircle size={11} /> Password strength looks good
                                </p>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div>
                            <Label>Confirm New Password</Label>
                            <Field
                                type="password"
                                value={confirmPwd}
                                onChange={e => setConfirmPwd(e.target.value)}
                            />
                            {confirmPwd && newPwd !== confirmPwd && (
                                <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                                    <AlertCircle size={11} /> Passwords do not match
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleChangePassword}
                            disabled={savingPwd}
                            className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-[13px] font-semibold disabled:opacity-60 transition-colors"
                        >
                            {savingPwd ? 'Updating...' : 'Update password'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Notifications tab ─────────────────────────────────────────────── */}
            {activeTab === 'notifications' && (
                <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden max-w-2xl">
                    <div className="px-6 py-4 border-b border-[#f5f3ff] flex items-center justify-between">
                        <div>
                            <h2 className="text-[15px] font-semibold text-[#111827]">Notifications</h2>
                            <p className="text-[12px] text-[#9ca3af] mt-0.5">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[12px] font-semibold text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {loadingNotifs ? (
                        <div className="flex justify-center py-12">
                            <div className="w-5 h-5 border-[1.5px] border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <Bell size={24} className="text-[#ede9fe] mx-auto mb-3" />
                            <p className="text-[13px] text-[#9ca3af]">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#f5f3ff]">
                            {notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`flex items-start gap-3 px-6 py-4 ${!notif.read ? 'bg-[#f5f3ff]/40' : ''}`}
                                >
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? 'bg-[#d1d5db]' : 'bg-[#7c3aed]'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] leading-snug ${notif.read ? 'text-[#6b7280]' : 'text-[#111827] font-medium'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-[11px] text-[#9ca3af] mt-0.5">
                                            {new Date(notif.sent_at || notif.created_at).toLocaleDateString('en-GB', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {!notif.read && (
                                            <button
                                                onClick={() => handleMarkRead(notif.id)}
                                                className="p-1.5 rounded-lg text-[#9ca3af] hover:text-[#7c3aed] hover:bg-[#f5f3ff] transition-colors"
                                            >
                                                <Check size={13} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteNotif(notif.id)}
                                            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}