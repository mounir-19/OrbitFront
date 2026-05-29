import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles, ChevronRight, Loader2, Check, AlertCircle,
    DollarSign, Users, Calendar, Code2, Globe, Layers,
} from 'lucide-react';
import { createProject, getAiProjectRequirements } from '../../api/expert.api';
import toast from 'react-hot-toast';

const SERVICE_TYPES = [
    { value: 'web_dev', label: 'Web Development', icon: Globe },
    { value: 'mobile_dev', label: 'Mobile Dev', icon: Layers },
    { value: 'ui_ux_design', label: 'UI/UX Design', icon: Sparkles },
    { value: 'video_editing', label: 'Video Editing', icon: Layers },
    { value: 'other', label: 'Other', icon: Code2 },
];

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

export default function PublishProject() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '',
        service_type: '',
        description: '',
        total_price: '',
        skills_needed: '',
        languages_needed: '',
        team_size: '',
        deadline: '',
    });

    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // ── AI requirements generation ────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!form.description || form.description.length < 20) {
            toast.error('Enter a description (at least 20 characters) before generating.');
            return;
        }
        if (!form.service_type) {
            toast.error('Select a service type first.');
            return;
        }
        setAiLoading(true);
        setAiResult(null);
        try {
            const res = await getAiProjectRequirements({
                description: form.description,
                service_type: form.service_type,
                title: form.title,
            });
            const data = res.data;
            setAiResult(data);
            // Pre-fill the form with AI suggestions
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
        if (!form.title || !form.service_type || !form.description) {
            toast.error('Title, service type, and description are required.');
            return;
        }
        setSubmitting(true);
        try {
            await createProject({
                title: form.title,
                service_type: form.service_type,
                description: form.description,
                total_price: form.total_price ? Number(form.total_price) : undefined,
                team_size: form.team_size ? Number(form.team_size) : undefined,
                skills_needed: form.skills_needed || undefined,
                languages_needed: form.languages_needed || undefined,
                deadline: form.deadline || undefined,
            });
            toast.success('Project published!');
            navigate('/expert/projects/published');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to publish project.');
        } finally {
            setSubmitting(false);
        }
    };

    const canGenerate = form.description.length >= 20 && form.service_type;

    return (
        <div className="px-8 py-8 max-w-3xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span className="hover:text-gray-600 cursor-pointer" onClick={() => navigate('/expert/projects/published')}>
                        Published Projects
                    </span>
                    <ChevronRight size={12} />
                    <span className="text-gray-700 font-medium">New Project</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Publish a Project</h1>
                <p className="text-sm text-gray-500">Fill in the basics, then let AI suggest requirements — or do it yourself.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* ── Section 1: Core info ── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Project Info</h2>

                    <FIELD label="Project Title">
                        <input
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            placeholder="e.g. E-commerce platform for local bakery"
                            className={INPUT_CLS}
                            required
                        />
                    </FIELD>

                    <FIELD label="Service Type">
                        <div className="grid grid-cols-5 gap-2">
                            {SERVICE_TYPES.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => set('service_type', value)}
                                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-all
                                        ${form.service_type === value
                                            ? 'border-gray-900 bg-gray-900 text-white'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </FIELD>

                    <FIELD label="Description" hint="(min 20 chars to use AI)">
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={4}
                            placeholder="Describe the project scope, goals, and any known technical constraints..."
                            className={`${INPUT_CLS} resize-none`}
                            required
                        />
                        <div className="flex items-center justify-between mt-1.5">
                            <span className={`text-xs ${form.description.length < 20 ? 'text-gray-300' : 'text-gray-400'}`}>
                                {form.description.length} chars
                            </span>
                        </div>
                    </FIELD>

                    <FIELD label="Price (DZD)" hint="(your fee for this project)">
                        <div className="relative">
                            <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                value={form.total_price}
                                onChange={e => set('total_price', e.target.value)}
                                placeholder="e.g. 150000"
                                className={`${INPUT_CLS} pl-9`}
                                min="0"
                            />
                        </div>
                    </FIELD>
                </div>

                {/* ── Section 2: Requirements ── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Requirements</h2>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={!canGenerate || aiLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                                ${canGenerate && !aiLoading
                                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm shadow-violet-200'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            {aiLoading
                                ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                                : <><Sparkles size={14} /> Generate with AI</>
                            }
                        </button>
                    </div>

                    {/* AI result reasoning banner */}
                    {aiResult?.reasoning && (
                        <div className="flex gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
                            <Sparkles size={14} className="text-violet-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-violet-700 leading-relaxed">{aiResult.reasoning}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FIELD label="Team Size" hint="(students needed)">
                            <div className="relative">
                                <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number"
                                    value={form.team_size}
                                    onChange={e => set('team_size', e.target.value)}
                                    placeholder="e.g. 3"
                                    min="1" max="10"
                                    className={`${INPUT_CLS} pl-9`}
                                />
                            </div>
                        </FIELD>

                        <FIELD label="Deadline">
                            <div className="relative">
                                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    value={form.deadline}
                                    onChange={e => set('deadline', e.target.value)}
                                    className={`${INPUT_CLS} pl-9`}
                                />
                            </div>
                        </FIELD>
                    </div>

                    <FIELD label="Skills Needed" hint="(comma-separated)">
                        <div className="relative">
                            <Code2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={form.skills_needed}
                                onChange={e => set('skills_needed', e.target.value)}
                                placeholder="e.g. React, Node.js, PostgreSQL, REST APIs"
                                className={`${INPUT_CLS} pl-9`}
                            />
                        </div>
                    </FIELD>

                    <FIELD label="Languages Needed" hint="(comma-separated)">
                        <div className="relative">
                            <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={form.languages_needed}
                                onChange={e => set('languages_needed', e.target.value)}
                                placeholder="e.g. JavaScript, Python, Dart"
                                className={`${INPUT_CLS} pl-9`}
                            />
                        </div>
                    </FIELD>
                </div>

                {/* ── Submit ── */}
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
                        disabled={submitting}
                        className="flex items-center gap-2 px-7 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                        {submitting
                            ? <><Loader2 size={14} className="animate-spin" /> Publishing…</>
                            : <><Check size={14} /> Publish Project</>
                        }
                    </button>
                </div>
            </form>
        </div>
    );
}