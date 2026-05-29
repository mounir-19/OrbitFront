import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getProjects, getRatings } from '../../api/expert.api';
import { useAuthStore } from '../../store/authStore';

function StatCard({ label, value, sub, accent }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</div>
            <div className={`text-3xl font-bold mb-1 ${accent || 'text-gray-900'}`}>{value}</div>
            {sub && <div className="text-xs text-gray-400">{sub}</div>}
        </div>
    );
}

export function ExpertAnalytics() {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        Promise.allSettled([
            getProjects(),
            getRatings({ expert_id: user.id }),
        ]).then(([projRes, ratingRes]) => {
            if (projRes.status === 'fulfilled') {
                setProjects(Array.isArray(projRes.value.data) ? projRes.value.data : []);
            }
            if (ratingRes.status === 'fulfilled') {
                setRatings(Array.isArray(ratingRes.value.data) ? ratingRes.value.data : []);
            }
        }).finally(() => setLoading(false));
    }, [user?.id]);
    const delivered = projects.filter(p => p.status === 'delivered').length;
    const inProgress = projects.filter(p => p.status === 'in_progress').length;
    const totalProjs = projects.length;

    const avgRating = ratings.length
        ? (ratings.reduce((s, r) => s + Number(r.global_score || 0), 0) / ratings.length).toFixed(1)
        : '—';

    const onTimeRate = delivered > 0
        ? `${Math.round((delivered / Math.max(totalProjs, 1)) * 100)}%`
        : '—';

    const monthlyData = (() => {
        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return {
                label: d.toLocaleDateString('en-GB', { month: 'short' }),
                year: d.getFullYear(),
                month: d.getMonth(),
                count: 0,
            };
        });
        projects.forEach(p => {
            if (!p.created_at) return;
            const d = new Date(p.created_at);
            const slot = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
            if (slot) slot.count++;
        });
        return months;
    })();
    const maxCount = Math.max(...monthlyData.map(m => m.count), 1);

    const ratingDimensions = ['quality', 'deadline', 'communication', 'collaboration', 'technical'];
    const avgByDim = ratingDimensions.map(dim => ({
        label: dim.charAt(0).toUpperCase() + dim.slice(1),
        avg: ratings.length
            ? (ratings.reduce((s, r) => s + Number(r[dim] || 0), 0) / ratings.length).toFixed(1)
            : null,
    }));

    const STATUS_COLORS = {
        in_progress: 'bg-blue-500',
        in_review: 'bg-amber-500',
        delivered: 'bg-emerald-500',
        accepted: 'bg-violet-500',
        submitted: 'bg-gray-300',
    };

    const byStatus = Object.entries(
        projects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]);

    return (
        <div className="px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics</h1>
                <p className="text-sm text-gray-500">Your performance and portfolio overview.</p>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-12">
                    <Loader2 size={16} className="animate-spin" /> Loading data…
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <StatCard label="Total Projects" value={totalProjs} sub={`${inProgress} active`} />
                        <StatCard label="Delivered" value={delivered} sub="Completed successfully" accent="text-emerald-600" />
                        <StatCard label="Delivery Rate" value={onTimeRate} sub="Projects delivered" accent="text-blue-600" />
                        <StatCard label="Avg. Rating" value={avgRating} sub={`${ratings.length} ratings`} accent="text-amber-600" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-6">
                        <div className="col-span-2 bg-white border border-gray-200 rounded-2xl px-6 py-5">
                            <h2 className="font-semibold text-gray-900 mb-6">Projects created (last 6 months)</h2>
                            <div className="flex items-end gap-3 h-36">
                                {monthlyData.map((m, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                        <span className="text-xs font-medium text-gray-500">{m.count || ''}</span>
                                        <div className="w-full rounded-t-lg bg-gray-900 transition-all"
                                            style={{ height: `${(m.count / maxCount) * 100}%`, minHeight: m.count ? '8px' : '2px' }} />
                                        <span className="text-[10px] text-gray-400">{m.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-5">
                            <h2 className="font-semibold text-gray-900 mb-5">By status</h2>
                            {byStatus.length === 0 ? (
                                <p className="text-sm text-gray-400">No projects yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {byStatus.map(([status, count]) => (
                                        <div key={status}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                                                <span className="text-xs font-semibold text-gray-700">{count}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${STATUS_COLORS[status] || 'bg-gray-400'}`}
                                                    style={{ width: `${(count / totalProjs) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {ratings.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5">
                            <h2 className="font-semibold text-gray-900 mb-5">
                                Rating breakdown
                                <span className="ml-2 text-sm font-normal text-gray-400">avg across {ratings.length} rating{ratings.length !== 1 ? 's' : ''}</span>
                            </h2>
                            <div className="grid grid-cols-5 gap-4">
                                {avgByDim.map(({ label, avg }) => (
                                    <div key={label} className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">{avg ?? '—'}</div>
                                        <div className="text-xs text-gray-400">{label}</div>
                                        {avg && (
                                            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(avg / 10) * 100}%` }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}