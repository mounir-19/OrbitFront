import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Users, Calendar, Star,
    Sparkles, Check, X, Loader2, AlertCircle, RefreshCw,
    FileText, Play, FolderOpen, Code2, Globe, Layers, Clock,
} from 'lucide-react';
import {
    getProject, getProjectApplications,
    updateApplication, approveTeam, runTeamMatching, startProject,
    getMyEarnings,
} from '../../api/expert.api';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DOMAIN_LABEL = {
    web_dev: 'Web Dev', mobile_dev: 'Mobile', ui_ux_design: 'UI/UX',
    video_editing: 'Video', other: 'Other',
};

function StarRating({ value }) {
    const stars = Math.round((value / 10) * 5);
    return (
        <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={11}
                    className={s <= stars ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
            ))}
            <span className="text-xs text-gray-500 ml-1">{Number(value).toFixed(1)}</span>
        </span>
    );
}

// ─── Application Row ──────────────────────────────────────────────────────────
function ApplicationRow({ app, selected, onSelect, onReject, aiHighlighted, aiReasoning }) {
    const name = `${app.first_name} ${app.last_name}`;
    const isApproved = app.status === 'selected';
    const isRejected = app.status === 'rejected';

    return (
        <div className={`border rounded-xl px-5 py-4 transition-all
            ${aiHighlighted ? 'border-violet-300 bg-violet-50/40' : 'border-gray-200 bg-white'}
            ${isApproved ? 'border-emerald-300 bg-emerald-50/30' : ''}
            ${isRejected ? 'opacity-40' : ''}`}
        >
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                    {app.first_name?.[0]}{app.last_name?.[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-gray-900">{name}</span>
                        {aiHighlighted && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                                <Sparkles size={9} /> AI Pick
                            </span>
                        )}
                        {isApproved && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Selected
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span>{DOMAIN_LABEL[app.domain] || app.domain}</span>
                        <span>·</span>
                        <StarRating value={app.global_rating || 0} />
                        <span>·</span>
                        <span>{app.consecutive_projects || 0} active project{app.consecutive_projects !== 1 ? 's' : ''}</span>
                        {app.university && <><span>·</span><span>{app.university}</span></>}
                    </div>
                    {app.message && (
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                            "{app.message}"
                        </p>
                    )}
                    {aiReasoning && (
                        <p className="text-xs text-violet-600 mt-1 italic">
                            AI: {aiReasoning}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {app.cv_url && (
                        <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={e => e.stopPropagation()}>
                            <FileText size={13} className="text-gray-400" />
                        </a>
                    )}
                    {!isApproved && !isRejected && (
                        <>
                            <button
                                onClick={() => onSelect(app.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                                    ${selected
                                        ? 'bg-emerald-600 text-white'
                                        : 'border border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                <Check size={11} /> {selected ? 'Selected' : 'Select'}
                            </button>
                            <button
                                onClick={() => onReject(app.id)}
                                className="flex items-center gap-1 p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                            >
                                <X size={13} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // AI matching
    const [aiRunning, setAiRunning] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);

    // Team + project start
    const [approving, setApproving] = useState(false);
    const [starting, setStarting] = useState(false);
    const [teamApproved, setTeamApproved] = useState(false);
    const [clientPaid, setClientPaid] = useState(false);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [projRes, appsRes] = await Promise.all([
                getProject(id),
                getProjectApplications(id),
            ]);

            setProject(projRes.data);
            setApplications(appsRes.data || []);

            const alreadySelected = (appsRes.data || [])
                .filter(a => a.status === 'selected')
                .map(a => a.id);
            if (alreadySelected.length) {
                setSelectedIds(new Set(alreadySelected));
                setTeamApproved(true);
            }

            if (projRes.data?.status === 'in_progress') {
                setClientPaid(true);
                setTeamApproved(true);
            }

            // Check payment state directly from project fields
            if (projRes.data?.payment_initiated || projRes.data?.payment_confirmed) {
                setClientPaid(true);
            }

        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    const toggleSelect = (appId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(appId) ? next.delete(appId) : next.add(appId);
            return next;
        });
    };

    const handleReject = async (appId) => {
        try {
            await updateApplication(appId, 'rejected');
            setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
            setSelectedIds(prev => { const n = new Set(prev); n.delete(appId); return n; });
            toast.success('Application rejected');
        } catch { toast.error('Failed to reject'); }
    };

    const handleAiMatch = async () => {
        setAiRunning(true);
        setAiSuggestion(null);
        try {
            const res = await runTeamMatching(id);
            const suggested = res.data.suggested_team || [];
            setAiSuggestion(suggested);
            const aiIds = new Set(
                suggested.map(s => {
                    const app = applications.find(a => a.student_id === s.student_id);
                    return app?.id;
                }).filter(Boolean)
            );
            setSelectedIds(aiIds);
            toast.success(`AI suggested ${suggested.length} student${suggested.length !== 1 ? 's' : ''}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'AI matching failed');
        } finally {
            setAiRunning(false);
        }
    };

    const handleApproveTeam = async () => {
        if (!selectedIds.size) {
            toast.error('Select at least one student first.');
            return;
        }
        setApproving(true);
        try {
            const studentIds = applications
                .filter(a => selectedIds.has(a.id))
                .map(a => a.student_id);

            await approveTeam(id, studentIds);
            setTeamApproved(true);
            setApplications(prev => prev.map(a =>
                selectedIds.has(a.id)
                    ? { ...a, status: 'selected' }
                    : a.status === 'pending' ? { ...a, status: 'rejected' } : a
            ));
            toast.success('Team approved! Waiting for client to pay 50% to start.');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to approve team');
        } finally {
            setApproving(false);
        }
    };

    const handleStartProject = async () => {
        setStarting(true);
        try {
            await startProject(id);
            toast.success('Project started! Redirecting to projects…');
            setTimeout(() => navigate('/expert/projects'), 1200);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to start project');
        } finally {
            setStarting(false);
        }
    };

    // ── Loading / Error ────────────────────────────────────────────────────────
    if (loading) return (
        <div className="px-8 py-8 space-y-4">
            {[1, 2, 3].map(n => (
                <div key={n} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
        </div>
    );

    if (error) return (
        <div className="px-8 py-8">
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertCircle size={15} />
                {error}
                <button onClick={fetchData} className="ml-auto text-xs underline flex items-center gap-1">
                    <RefreshCw size={11} /> Retry
                </button>
            </div>
        </div>
    );

    const pendingApps = applications.filter(a => a.status === 'pending');
    const deadline = project.deadline
        ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    const aiMap = {};
    (aiSuggestion || []).forEach(s => { aiMap[s.student_id] = s; });

    return (
        <div className="px-8 py-8 max-w-4xl">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
                <span
                    className="hover:text-gray-600 cursor-pointer"
                    onClick={() => navigate('/expert/projects/published')}
                >
                    Published Projects
                </span>
                <ChevronRight size={12} />
                <span className="text-gray-700 font-medium truncate max-w-xs">{project.title}</span>
            </div>

            {/* Project header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{project.title}</h1>
                        <span className="text-sm text-gray-400">{DOMAIN_LABEL[project.service_type] || project.service_type}</span>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize
                        ${project.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                            project.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-100 text-gray-600'}`}>
                        {project.status?.replace('_', ' ')}
                    </span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-5">{project.description}</p>

                <div className="grid grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: 'Team size', value: project.team_size ? `${project.team_size} students` : '—' },
                        { icon: Calendar, label: 'Deadline', value: deadline || '—' },
                        { icon: Code2, label: 'Skills', value: project.skills_needed || '—' },
                        { icon: Globe, label: 'Languages', value: project.languages_needed || '—' },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Icon size={11} className="text-gray-400" />
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-700">{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Applications section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-gray-900">
                        Applications
                        <span className="ml-2 text-sm font-normal text-gray-400">
                            ({applications.length} total · {pendingApps.length} pending)
                        </span>
                    </h2>
                    {!teamApproved && (
                        <button
                            onClick={handleAiMatch}
                            disabled={aiRunning || pendingApps.length === 0}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                                ${pendingApps.length > 0 && !aiRunning
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-sm shadow-violet-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            {aiRunning
                                ? <><Loader2 size={13} className="animate-spin" /> Matching…</>
                                : <><Sparkles size={13} /> AI Team Match</>
                            }
                        </button>
                    )}
                </div>

                {applications.length === 0 ? (
                    <div className="py-12 text-center">
                        <Users size={22} className="text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No applications yet.</p>
                        <p className="text-xs text-gray-300 mt-1">Students will appear here once they apply.</p>
                    </div>
                ) : (
                    <div className="space-y-3 mb-6">
                        {applications.map(app => {
                            const aiEntry = aiMap[app.student_id];
                            return (
                                <ApplicationRow
                                    key={app.id}
                                    app={app}
                                    selected={selectedIds.has(app.id)}
                                    onSelect={toggleSelect}
                                    onReject={handleReject}
                                    aiHighlighted={!!aiEntry}
                                    aiReasoning={aiEntry?.reasoning}
                                />
                            );
                        })}
                    </div>
                )}

                {/* ── Action bar ── */}
                {applications.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex items-center gap-3">
                            {!teamApproved ? (
                                <button
                                    onClick={handleApproveTeam}
                                    disabled={approving || selectedIds.size === 0}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                >
                                    {approving
                                        ? <><Loader2 size={13} className="animate-spin" /> Approving…</>
                                        : <><Check size={13} /> Approve Team</>
                                    }
                                </button>
                            ) : !clientPaid ? (
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                                        <Check size={14} /> Team approved
                                    </span>
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                                        <Clock size={13} className="text-amber-600 flex-shrink-0" />
                                        <span className="text-sm text-amber-700 font-medium">
                                            Awaiting client 50% payment — project starts automatically
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <Check size={13} className="text-emerald-600 flex-shrink-0" />
                                    <span className="text-sm text-emerald-700 font-medium">
                                        Client paid · Project is in progress
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}