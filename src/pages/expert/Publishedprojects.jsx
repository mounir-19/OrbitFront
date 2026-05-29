import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, ChevronRight, Users, Calendar, AlertCircle,
    RefreshCw, FolderOpen, Clock, CheckCircle, Loader2,
    Globe, Layers, Sparkles, Code2,
} from 'lucide-react';
import { getProjects } from '../../api/expert.api';
import toast from 'react-hot-toast';

const DOMAIN_LABEL = {
    web_dev: 'Web Dev',
    mobile_dev: 'Mobile',
    ui_ux_design: 'UI/UX',
    video_editing: 'Video',
    other: 'Other',
};

const STATUS_CONFIG = {
    accepted: { label: 'Open', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    in_review: { label: 'In Review', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    delivered: { label: 'Delivered', bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
    under_review: { label: 'Under Review', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
    submitted: { label: 'Submitted', bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-300' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
    rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function ProjectCard({ project, onClick }) {
    const pending = Number(project.pending_applications || 0);
    const deadline = project.deadline
        ? new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer group"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                        {project.title}
                    </h3>
                    <span className="text-[11px] text-gray-400 mt-0.5 block">
                        {DOMAIN_LABEL[project.service_type] || project.service_type}
                    </span>
                </div>
                <StatusBadge status={project.status} />
            </div>

            {project.description && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">
                    {project.description}
                </p>
            )}

            <div className="flex items-center gap-4 text-[11px] text-gray-400">
                {project.team_size && (
                    <span className="flex items-center gap-1">
                        <Users size={11} /> {project.team_size} students
                    </span>
                )}
                {deadline && (
                    <span className="flex items-center gap-1">
                        <Calendar size={11} /> {deadline}
                    </span>
                )}
                {project.total_price && (
                    <span className="font-medium text-gray-600">
                        {Number(project.total_price).toLocaleString('fr-DZ')} DZD
                    </span>
                )}
            </div>

            {pending > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[11px] font-semibold text-amber-600">
                        {pending} pending application{pending !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
}

export default function PublishedProjects() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');

    const fetchProjects = () => {
        setLoading(true);
        setError(null);
        getProjects()
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                // Only show pre-start statuses — in_progress+ belong on the Projects page
                const PRE_START = ['submitted', 'under_review', 'accepted', 'rejected', 'cancelled'];
                setProjects(data.filter(p => PRE_START.includes(p.status)));
            })
            .catch(err => setError(err.response?.data?.error || 'Failed to load projects'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProjects(); }, []);

    const FILTERS = [
        { key: 'all', label: 'All' },
        { key: 'accepted', label: 'Open' },
        { key: 'under_review', label: 'Under Review' },
        { key: 'delivered', label: 'Delivered' },
    ];

    const filtered = filter === 'all'
        ? projects
        : projects.filter(p => p.status === filter);

    const totalPending = projects.reduce((s, p) => s + Number(p.pending_applications || 0), 0);

    return (
        <div className="px-8 py-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Published Projects</h1>
                    <p className="text-sm text-gray-500">
                        {projects.length} project{projects.length !== 1 ? 's' : ''}
                        {totalPending > 0 && ` · ${totalPending} pending application${totalPending !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/expert/projects/publish')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <Plus size={15} /> Publish Project
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                            ${filter === f.key
                                ? 'bg-gray-900 text-white'
                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="bg-white border border-gray-100 rounded-2xl p-5 h-44 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
                            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-4/5" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                    <AlertCircle size={15} />
                    {error}
                    <button onClick={fetchProjects} className="ml-auto text-xs underline flex items-center gap-1">
                        <RefreshCw size={11} /> Retry
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                    <FolderOpen size={28} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-3">
                        {filter === 'all' ? 'No projects yet.' : `No ${filter} projects.`}
                    </p>
                    <button
                        onClick={() => navigate('/expert/projects/publish')}
                        className="text-sm font-medium text-gray-900 hover:underline"
                    >
                        Publish your first project →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {filtered.map(p => (
                        <ProjectCard
                            key={p.project_id || p.id}
                            project={p}
                            onClick={() => navigate(`/expert/projects/published/${p.project_id || p.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}