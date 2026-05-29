import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare } from 'lucide-react';
import { getProjects, getProjectTasks, startConversation } from '../../api/expert.api';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// Fetch team for a project
const getProjectTeam = (id) => api.get(`/projects/${id}/team`);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (str = '') =>
    str.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

// Derive a simple "last seen" label from a date string — we don't have
// a real presence system, so we derive an approximate from task updated_at
const timeAgo = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 120) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    const d = Math.floor(diff / 86400);
    return `${d} day${d !== 1 ? 's' : ''} ago`;
};

// Status derived from how recently a task was touched
const deriveStatus = (dateStr) => {
    if (!dateStr) return 'offline';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 600) return 'online';
    if (diff < 7200) return 'away';
    return 'offline';
};

const STATUS_CFG = {
    online: { label: 'ONLINE', color: 'text-emerald-500' },
    away: { label: 'AWAY', color: 'text-amber-500' },
    offline: { label: 'OFFLINE', color: 'text-[#9ca3af]' },
};

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-[#f0eeff] rounded-xl ${className}`} />
);

// ─── STUDENT PIPELINE ─────────────────────────────────────────────────────────
export const StudentPipeline = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);   // flat list of student-project-task rows
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                // 1. Get all active projects
                const projRes = await getProjects();
                const projects = (projRes.data || []).filter(p =>
                    ['in_progress', 'accepted', 'in_review'].includes(p.status)
                );

                // 2. For each project, fetch team + tasks in parallel
                const perProject = await Promise.allSettled(
                    projects.map(async (proj) => {
                        const pid = proj.project_id || proj.id;
                        const [teamRes, tasksRes] = await Promise.allSettled([
                            getProjectTeam(pid),
                            getProjectTasks(pid),
                        ]);

                        const team = teamRes.status === 'fulfilled' ? (teamRes.value.data || []) : [];
                        const tasks = tasksRes.status === 'fulfilled' ? (tasksRes.value.data || []) : [];

                        // Map each team member to their latest active task
                        return team.map((member, memberIdx) => {
                            const memberTasks = tasks
                                .filter(t => t.student_id === member.id)
                                .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

                            const latestTask = memberTasks[0] || null;
                            const lastActive = latestTask?.updated_at || latestTask?.created_at || null;

                            return {
                                key: `${pid}-${member.id}`,
                                studentId: member.id,
                                name: member.name || 'Student',
                                shortId: `S${memberIdx + 1}`,
                                projectId: pid,
                                projectTitle: proj.title || '—',
                                task: latestTask?.title || null,
                                taskSub: latestTask ? 'Latest Deliverable' : null,
                                taskStatus: latestTask?.status || null,
                                lastActive,
                                status: deriveStatus(lastActive),
                                timeAgoStr: timeAgo(lastActive),
                            };
                        });
                    })
                );

                // Flatten and deduplicate by studentId (keep highest-priority project)
                const all = perProject
                    .filter(r => r.status === 'fulfilled')
                    .flatMap(r => r.value);

                // Dedupe: if same student appears in multiple projects, keep all rows
                setRows(all);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load student pipeline');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return rows;
        return rows.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.projectTitle.toLowerCase().includes(q) ||
            (r.task || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    const handleMessage = async (studentId) => {
        try {
            const res = await startConversation(studentId);
            const cid = res.data?.id || res.data?.conversation_id;
            navigate('/expert/chat', { state: { conversationId: cid } });
        } catch {
            toast.error('Could not open chat');
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#fafafa] px-10 py-8">

            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">
                        Student Pipeline
                    </h1>
                    <p className="text-sm text-[#9ca3af] mt-1.5">
                        Direct oversight of your active mentees and their current tasks.
                    </p>
                </div>

                {/* Search */}
                <div className="flex items-center gap-3 bg-white border border-[#ede9fe] rounded-2xl px-4 py-3 w-72">
                    <Search size={15} className="text-[#9ca3af] flex-shrink-0" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search names or projects…"
                        className="flex-1 text-[13px] text-[#111827] placeholder:text-[#d1d5db] outline-none bg-transparent"
                    />
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────────────────────────── */}
            <div className="bg-white border border-[#ede9fe] rounded-2xl overflow-hidden">

                {/* Table header */}
                <div className="grid grid-cols-[2fr_1.5fr_2fr_1fr] px-8 py-4 border-b border-[#f5f3ff]">
                    {['Name', 'Project', 'Current Task', 'Status'].map(h => (
                        <span key={h} className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">
                            {h}
                        </span>
                    ))}
                </div>

                {/* Rows */}
                {loading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="px-8 py-16 text-center">
                        <p className="text-sm text-[#9ca3af]">
                            {search ? 'No results found.' : 'No active mentees yet.'}
                        </p>
                    </div>
                ) : (
                    filtered.map((row, i) => {
                        const cfg = STATUS_CFG[row.status] || STATUS_CFG.offline;
                        return (
                            <div
                                key={row.key}
                                className={`grid grid-cols-[2fr_1.5fr_2fr_1fr] px-8 py-5 items-center
                  ${i !== filtered.length - 1 ? 'border-b border-[#f5f3ff]' : ''}`}
                            >
                                {/* Name + ID */}
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-[#ede9fe] flex items-center justify-center text-[11px] font-bold text-[#7c3aed] flex-shrink-0">
                                        {getInitials(row.name)}
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => handleMessage(row.studentId)}
                                            className="font-bold text-[#111827] text-[15px] leading-tight text-left group flex items-center gap-2"
                                        >
                                            {row.name}
                                            <MessageSquare size={12} className="text-[#d1d5db] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <div className="text-[11px] text-[#9ca3af] mt-0.5 font-semibold tracking-wide">
                                            ID: {row.shortId}
                                        </div>
                                    </div>
                                </div>

                                {/* Project */}
                                <div>
                                    <button
                                        onClick={() => navigate(`/expert/projects/${row.projectId}`)}
                                        className="text-[14px] font-semibold text-[#374151] text-left truncate max-w-[200px] block"
                                    >
                                        {row.projectTitle}
                                    </button>
                                </div>

                                {/* Current task */}
                                <div>
                                    {row.task ? (
                                        <>
                                            <div className="text-[14px] font-semibold text-[#111827] truncate max-w-[280px]">
                                                {row.task}
                                            </div>
                                            {row.taskSub && (
                                                <div className="text-[11px] text-[#9ca3af] mt-0.5">{row.taskSub}</div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[13px] text-[#d1d5db]">No active task</span>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="flex flex-col items-start">
                                    <span className={`text-[11px] font-bold tracking-widest ${cfg.color}`}>
                                        {cfg.label}
                                    </span>
                                    {row.timeAgoStr && (
                                        <span className="text-[11px] text-[#9ca3af] mt-0.5">{row.timeAgoStr}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
                <p className="text-[11px] text-[#9ca3af] mt-4 text-right">
                    {filtered.length} mentee{filtered.length !== 1 ? 's' : ''} across{' '}
                    {new Set(filtered.map(r => r.projectId)).size} project{new Set(filtered.map(r => r.projectId)).size !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
};

export default StudentPipeline;