import { useState, useEffect } from 'react';
import {
    getNotifications, markNotificationRead, markAllRead, deleteNotification,
    updateSettings, changePassword, getRatings,
} from '../../api/expert.api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import {
    User, Lock, Bell, Check, Trash2, Star,
    CheckCircle, AlertCircle, Eye, EyeOff,
} from 'lucide-react';

const DOMAIN_LABELS = {
    web_dev: 'Web Development',
    mobile_dev: 'Mobile Development',
    ui_ux_design: 'UI/UX Design',
    video_editing: 'Video Editing',
    other: 'Other',
};

export function ExpertSettings() {
    const { user } = useAuthStore();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');

    // ── Profile state ──
    const [specialty, setSpecialty] = useState('');
    const [bio, setBio] = useState('');
    const [available, setAvailable] = useState(true);
    const [stats, setStats] = useState({ projects_rated: 0, avg_rating: '—' });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // ── Security state ──
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [savingPwd, setSavingPwd] = useState(false);

    // ── Notifications state ──
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);

    useEffect(() => {
        if (user) {
            setSpecialty(user.expert?.specialty || user.specialty || '');
            setBio(user.expert?.bio || user.bio || '');
            setAvailable(user.expert?.available ?? true);
        }
        getRatings()
            .then(res => {
                const ratings = Array.isArray(res.data) ? res.data : [];
                if (ratings.length > 0) {
                    const avg = ratings.reduce((s, r) => s + Number(r.global_score || 0), 0) / ratings.length;
                    setStats({ projects_rated: ratings.length, avg_rating: avg.toFixed(1) });
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user]);

    useEffect(() => {
        if (activeTab !== 'notifications') return;
        setLoadingNotifs(true);
        getNotifications()
            .then(res => setNotifications(res.data || []))
            .catch(() => { })
            .finally(() => setLoadingNotifs(false));
    }, [activeTab]);

    // ── Handlers ──
    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await updateSettings({ specialty, bio, available });
            toast.success('Profile saved');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to save');
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
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update password');
        } finally {
            setSavingPwd(false);
        }
    };

    const handleMarkRead = async (id) => {
        try { await markNotificationRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); }
        catch { toast.error('Failed'); }
    };
    const handleMarkAllRead = async () => {
        try { await markAllRead(); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); toast.success('All marked as read'); }
        catch { toast.error('Failed'); }
    };
    const handleDeleteNotif = async (id) => {
        try { await deleteNotification(id); setNotifications(prev => prev.filter(n => n.id !== id)); }
        catch { toast.error('Failed to delete'); }
    };

    if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading...</div>;

    const TABS = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ];

    const unreadCount = notifications.filter(n => !n.read).length;
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();
    const domainLabel = DOMAIN_LABELS[user?.expert?.domain || user?.domain] || '';

    return (
        <div className="px-8 py-10">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
                    <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Settings</h1>
                </div>
                <p className="text-sm text-gray-400 pl-3">Manage your profile, security, and notifications.</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 border-b border-gray-100 mb-8">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Icon size={14} />
                            {tab.label}
                            {tab.id === 'notifications' && unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-violet-100 text-violet-600 text-[10px] font-bold rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-violet-500 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Profile tab ── */}
            {activeTab === 'profile' && (
                <div className="flex gap-6 items-start">
                    {/* Main form */}
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-6 space-y-6">
                        <h2 className="text-[15px] font-semibold text-gray-900">Personal information</h2>

                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-xl font-bold text-violet-600 flex-shrink-0">
                                {initials}
                            </div>
                            <div>
                                <p className="text-[14px] font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                                <p className="text-[12px] text-gray-400">{user?.email}</p>
                                {domainLabel && <p className="text-[12px] text-violet-500 font-medium mt-0.5">{domainLabel}</p>}
                            </div>
                        </div>

                        {/* Name (read-only) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">First name</label>
                                <input type="text" value={user?.first_name || ''} disabled
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-[13px] bg-gray-50 text-gray-400 cursor-not-allowed" />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Last name</label>
                                <input type="text" value={user?.last_name || ''} disabled
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-[13px] bg-gray-50 text-gray-400 cursor-not-allowed" />
                            </div>
                        </div>

                        {/* Email read-only */}
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                            <input type="email" value={user?.email || ''} disabled
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-[13px] bg-gray-50 text-gray-400 cursor-not-allowed" />
                            <p className="text-[11px] text-gray-300 mt-1">Email cannot be changed.</p>
                        </div>

                        {/* Specialty */}
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Specialty</label>
                            <input type="text" value={specialty} onChange={e => setSpecialty(e.target.value)}
                                placeholder="e.g. Full-stack web development, UI/UX"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-gray-300" />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Bio</label>
                            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                                placeholder="A short description of your expertise and approach…"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[13px] bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-gray-300" />
                        </div>

                        {/* Save */}
                        <div className="flex justify-end pt-2">
                            <button onClick={handleSaveProfile} disabled={saving}
                                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[13px] font-semibold disabled:opacity-60 transition-colors">
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-60 space-y-4 flex-shrink-0">
                        <div className="bg-white border border-gray-100 rounded-2xl p-5">
                            <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-4">Stats</p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-gray-500">Projects rated</span>
                                    <span className="text-[13px] font-bold text-gray-900">{stats.projects_rated}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-gray-500">Avg rating</span>
                                    <span className="text-[13px] font-bold text-gray-900 flex items-center gap-1">
                                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                        {stats.avg_rating !== '—' ? `${stats.avg_rating}/10` : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-gray-500">Domain</span>
                                    <span className="text-[13px] font-bold text-violet-600">{domainLabel || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-5">
                            <p className="text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-3">Availability</p>
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-gray-600">
                                    {available ? 'Open to projects' : 'Not available'}
                                </span>
                                <button
                                    onClick={() => setAvailable(v => !v)}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${available ? 'bg-violet-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${available ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-300 mt-2">Save changes to apply.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Security tab ── */}
            {activeTab === 'security' && (
                <div className="bg-white border border-gray-100 rounded-2xl p-6 max-w-2xl">
                    <h2 className="text-[15px] font-semibold text-gray-900 mb-1">Change password</h2>
                    <p className="text-[13px] text-gray-400 mb-6">Choose a strong password of at least 8 characters.</p>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Current password</label>
                            <div className="relative">
                                <input type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                <button onClick={() => setShowCurrent(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">New password</label>
                            <div className="relative">
                                <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                <button onClick={() => setShowNew(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            {newPwd && newPwd.length < 8 && (
                                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={11} /> At least 8 characters required
                                </p>
                            )}
                            {newPwd && newPwd.length >= 8 && (
                                <p className="text-[11px] text-emerald-500 mt-1.5 flex items-center gap-1">
                                    <CheckCircle size={11} /> Password strength looks good
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Confirm new password</label>
                            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                            {confirmPwd && newPwd !== confirmPwd && (
                                <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleChangePassword} disabled={savingPwd}
                            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[13px] font-semibold disabled:opacity-60 transition-colors">
                            {savingPwd ? 'Updating...' : 'Update password'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Notifications tab ── */}
            {activeTab === 'notifications' && (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden max-w-2xl">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-[15px] font-semibold text-gray-900">Notifications</h2>
                            <p className="text-[12px] text-gray-400 mt-0.5">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead}
                                className="text-[12px] font-semibold text-violet-500 hover:text-violet-700 transition-colors">
                                Mark all as read
                            </button>
                        )}
                    </div>
                    {loadingNotifs ? (
                        <div className="flex justify-center py-12">
                            <div className="w-5 h-5 border-[1.5px] border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <Bell size={24} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-[13px] text-gray-400">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {notifications.map(notif => (
                                <div key={notif.id}
                                    className={`flex items-start gap-3 px-6 py-4 ${!notif.read ? 'bg-violet-50/40' : ''}`}>
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? 'bg-gray-200' : 'bg-violet-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] leading-snug ${notif.read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            {new Date(notif.sent_at).toLocaleDateString('en-GB', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {!notif.read && (
                                            <button onClick={() => handleMarkRead(notif.id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                                                <Check size={13} />
                                            </button>
                                        )}
                                        <button onClick={() => handleDeleteNotif(notif.id)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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