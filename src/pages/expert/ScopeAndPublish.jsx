import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Sparkles, ChevronRight, Loader2, Check, AlertCircle,
    DollarSign, Users, Calendar, Code2, Globe, Layers,
} from 'lucide-react';
import { getProject, updateProject, getAiProjectRequirements } from '../../api/expert.api';
import toast from 'react-hot-toast';

const SERVICE_LABELS = {
    web_dev: 'Web Development',
    mobile_dev: 'Mobile Development',
    ui_ux_design: 'UI/UX Design',
    video_editing: 'Video Editing',
    other: 'Other',
};

const FIELD = ({ label, hint, children }) => (
    <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {label}
            {hint && <span className="ml-1.5 font-normal normal-case text-gray-400">{hint}</span>}
        </label>
        {children}
    </div>
);

const INPUT_CLS = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all';

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

export default function ScopeProject() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        total_price: '',
        skills_needed: '',
        languages_needed: '',
        team_size: '',
        deadline: '',
    });

    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // ── Load existing project ─────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        getProject(id)
            .then(res => {
                const p = res.data;
                setProject(p);
                // Pre-fill whatever the client already provided
                setForm({
                    total_price: p.total_price ? String(p.total_price) : '',
                    skills_needed: p.skills_needed || '',
                    languages_needed: p.languages_needed || '',
                    team_size: p.team_size ? String(p.team_size) : '',
                    deadline: p.deadline ? p.deadline.slice(0, 10) : '',
                });
            })
            .catch(() => setError('Project not found or access denied.'))
            .finally(() => setLoading(false));
    }, [id]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // ── AI requirements generation ────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!project?.description || project.description.length < 20) {
            toast.error('Project description is too short for AI generation.');
            return;
        }
        setAiLoading(true);
        setAiResult(null);
        try {
            const res = await getAiProjectRequirements({
                description: project.description,
                service_type: project.service_type,
                title: project.title,
            });
            const data = res.data;
            setAiResult(data);
            setForm(f => ({
                ...f,
                skills_needed: data.skills_needed || f.skills_needed,
                languages_needed: data.languages_needed || f.languages_needed,
                team_size: data.team_size ? String(data.team_size) : f.team_size,
                deadline: data.deadline || f.deadline,
            }));
            toast.success('Requirements generated — review and adjust as needed.');
        } catch {
            toast.error('AI generation failed. Fill requirements manually.');
        } finally {
            setAiLoading(false);
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.total_price) { toast.error('Set a price before scoping.'); return; }
        if (!form.team_size) { toast.error('Set team size before scoping.'); return; }
        if (!form.deadline) { toast.error('Set a deadline before scoping.'); return; }

        setSubmitting(true);
        try {
            await updateProject(id, {
                total_price: Number(form.total_price),
                skills_needed: form.skills_needed || undefined,
                languages_needed: form.languages_needed || undefined,
                team_size: Number(form.team_size),
                deadline: form.deadline,
                status: 'accepted', // signals client that project is scoped and ready
            });
            toast.success('Project scoped and accepted! Client will be notified.');
            navigate('/expert/projects/published');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to scope project.');
        } finally {
            setSubmitting(false);
        }
    };

    if (error) {
        return (
            <div className="px-8 py-8 flex flex-col items-center justify-center min-h-[400px]">
                <AlertCircle size={32} className="text-red-400 mb-3" />
                <p className="text-sm text-gray-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate('/expert/projects/published')}
                    className="text-sm font-bold text-gray-900 hover:underline"
                >
                    ← Back to projects
                </button>
            </div>
        );
    }

    return (
        <div className="px-8 py-8">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span
                        className="hover:text-gray-600 cursor-pointer"
                        onClick={() => navigate('/expert/projects/published')}
                    >
                        Projects
                    </span>
                    <ChevronRight size={12} />
                    <span className="text-gray-700 font-medium">Scope Project</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Scope Project</h1>
                <p className="text-sm text-gray-500">
                    Review the client's request, set the budget and requirements, then accept it to notify the client.
                </p>
            </div>

            {/* ── Client request card ─────────────────────────────────────────── */}
            <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-2xl p-6 mb-6">
                <div className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest mb-3">
                    Client Request
                </div>
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : (
                    <>
                        <h2 className="text-[18px] font-bold text-[#111827] mb-1">{project?.title}</h2>
                        <div className="text-[12px] text-[#7c3aed] font-semibold mb-3">
                            {SERVICE_LABELS[project?.service_type] || project?.service_type}
                            {project?.client_name && ` · Client: ${project.client_name}`}
                        </div>
                        {project?.description && (
                            <p className="text-[13px] text-[#374151] leading-relaxed">{project.description}</p>
                        )}
                    </>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Section: Scoping ── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                            Project Scope
                        </h2>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={aiLoading || loading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                                ${!aiLoading && !loading
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm shadow-violet-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            {aiLoading
                                ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                                : <><Sparkles size={14} /> Generate with AI</>
                            }
                        </button>
                    </div>

                    {/* AI reasoning banner */}
                    {aiResult?.reasoning && (
                        <div className="flex gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                            <Sparkles size={14} className="text-violet-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-violet-700 leading-relaxed">{aiResult.reasoning}</p>
                        </div>
                    )}

                    {/* Price */}
                    <FIELD label="Price (DZD)" hint="(your fee for this project) *">
                        <div className="relative">
                            <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            {loading
                                ? <Skeleton className="h-10 w-full" />
                                : <input
                                    type="number"
                                    value={form.total_price}
                                    onChange={e => set('total_price', e.target.value)}
                                    placeholder="e.g. 150000"
                                    className={`${INPUT_CLS} pl-9`}
                                    min="0"
                                    required
                                />
                            }
                        </div>
                    </FIELD>

                    <div className="grid grid-cols-2 gap-4">
                        <FIELD label="Team Size" hint="(students needed) *">
                            <div className="relative">
                                <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                {loading
                                    ? <Skeleton className="h-10 w-full" />
                                    : <input
                                        type="number"
                                        value={form.team_size}
                                        onChange={e => set('team_size', e.target.value)}
                                        placeholder="e.g. 3"
                                        min="1" max="10"
                                        className={`${INPUT_CLS} pl-9`}
                                        required
                                    />
                                }
                            </div>
                        </FIELD>

                        <FIELD label="Deadline *">
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                {loading
                                    ? <Skeleton className="h-10 w-full" />
                                    : <input
                                        type="date"
                                        value={form.deadline}
                                        onChange={e => set('deadline', e.target.value)}
                                        className={`${INPUT_CLS} pl-9`}
                                        required
                                    />
                                }
                            </div>
                        </FIELD>
                    </div>

                    <FIELD label="Skills Needed" hint="(comma-separated)">
                        <div className="relative">
                            <Code2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            {loading
                                ? <Skeleton className="h-10 w-full" />
                                : <input
                                    value={form.skills_needed}
                                    onChange={e => set('skills_needed', e.target.value)}
                                    placeholder="e.g. React, Node.js, PostgreSQL"
                                    className={`${INPUT_CLS} pl-9`}
                                />
                            }
                        </div>
                    </FIELD>

                    <FIELD label="Languages Needed" hint="(comma-separated)">
                        <div className="relative">
                            <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            {loading
                                ? <Skeleton className="h-10 w-full" />
                                : <input
                                    value={form.languages_needed}
                                    onChange={e => set('languages_needed', e.target.value)}
                                    placeholder="e.g. JavaScript, Python"
                                    className={`${INPUT_CLS} pl-9`}
                                />
                            }
                        </div>
                    </FIELD>
                </div>

                {/* Note */}
                <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                        Submitting will set the project status to <strong>Accepted</strong> and notify the client
                        that their project has been scoped and is ready for payment. Make sure all details are correct before proceeding.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/expert/projects/published')}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || loading}
                        className="flex items-center gap-2 px-7 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        {submitting
                            ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                            : <><Check size={14} /> Accept & Notify Client</>
                        }
                    </button>
                </div>
            </form>
        </div>
    );
}