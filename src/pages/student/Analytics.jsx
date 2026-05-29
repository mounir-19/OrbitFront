import { useState, useEffect } from 'react';
import { getEarnings, getMyProjects, getMyRatings, getMyTasks } from '../../api/student.api';
import { TrendingUp, CheckCircle, Star, Clock } from 'lucide-react';

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        completionRate: 0,
        expertRating: '—',
        activeHours: 0,
        profitGrowth: '+0%',
        completedTasks: 0,
        totalTasks: 0,
        monthlyIncome: [],
        taskDistribution: { completed: 0, inProgress: 0, inReview: 0, todo: 0 },
    });

    useEffect(() => {
        Promise.all([
            getMyProjects(),
            getEarnings(),
            getMyRatings().catch(() => ({ data: [] })),
            getMyTasks().catch(() => ({ data: [] })),
        ])
            .then(([projectsRes, earningsRes, ratingsRes, tasksRes]) => {
                const projects = projectsRes.data || [];
                const earnings = earningsRes.data || [];
                const ratings = ratingsRes.data || [];
                const tasks = tasksRes.data || [];

                // ── Completion rate ──
                const completedProjects = projects.filter(p =>
                    ['completed', 'delivered'].includes(p.status)
                );
                const completionRate = projects.length > 0
                    ? Math.round((completedProjects.length / projects.length) * 100)
                    : 0;

                // ── Task stats — use 'open' not 'todo' ──
                const completedTasks = tasks.filter(t => t.status === 'completed').length;
                const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
                const inReviewTasks = tasks.filter(t => t.status === 'in_review').length;
                const todoTasks = tasks.filter(t => t.status === 'open').length;

                // ── Real ratings from rating table ──
                const avgRating = ratings.length > 0
                    ? (ratings.reduce((sum, r) => sum + Number(r.global_score || 0), 0) / ratings.length).toFixed(1)
                    : '—';

                // ── Active hours: sum weight_pct of completed tasks as proxy ──
                const completedTasksData = tasks.filter(t => t.status === 'completed');
                const activeHours = completedTasksData.reduce((sum, t) => sum + Math.round((t.weight_pct || 0) / 10), 0);

                // ── Monthly income — use 'processed' not 'released' ──
                const now = new Date();
                const monthlyData = [];
                for (let i = 5; i >= 0; i--) {
                    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthEarnings = earnings.filter(e => {
                        const eDate = new Date(e.processed_at || e.created_at);
                        return eDate.getMonth() === monthDate.getMonth() &&
                            eDate.getFullYear() === monthDate.getFullYear() &&
                            e.status === 'processed';
                    });
                    monthlyData.push({
                        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
                        amount: monthEarnings.reduce((sum, e) => sum + Number(e.amount || 0), 0),
                    });
                }

                // ── Profit growth ──
                const currentMonth = monthlyData[5]?.amount || 0;
                const lastMonth = monthlyData[4]?.amount || 0;
                const growth = lastMonth > 0
                    ? (((currentMonth - lastMonth) / lastMonth) * 100).toFixed(1)
                    : '0';

                setStats({
                    completionRate,
                    expertRating: avgRating,
                    activeHours,
                    profitGrowth: `${Number(growth) >= 0 ? '+' : ''}${growth}%`,
                    completedTasks,
                    totalTasks: tasks.length,
                    monthlyIncome: monthlyData,
                    taskDistribution: {
                        completed: completedTasks,
                        inProgress: inProgressTasks,
                        inReview: inReviewTasks,
                        todo: todoTasks,
                    },
                });
            })
            .catch(err => console.error('Analytics error:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading analytics...</div>;

    const maxIncome = Math.max(...stats.monthlyIncome.map(m => m.amount), 1);
    const totalTasksCount = Object.values(stats.taskDistribution).reduce((a, b) => a + b, 0);

    return (
        <div className="px-8 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
                <p className="text-sm text-gray-500">Insights into your work progress and financial growth.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.completionRate}%</div>
                    <div className="text-xs text-gray-500 mt-1">{stats.completedTasks} of {stats.totalTasks} tasks done</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Star size={20} className="text-yellow-600" />
                        </div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                        {stats.expertRating !== '—' ? `${stats.expertRating}/10` : '—'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Expert feedback</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Clock size={20} className="text-purple-600" />
                        </div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.activeHours}h</div>
                    <div className="text-xs text-gray-500 mt-1">Estimated work time</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <TrendingUp size={20} className="text-blue-600" />
                        </div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.profitGrowth}</div>
                    <div className="text-xs text-gray-500 mt-1">Monthly change</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-3 gap-6">
                {/* Monthly Income */}
                <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                    <div className="mb-6">
                        <h2 className="font-semibold text-gray-900 mb-1">Monthly Income</h2>
                        <p className="text-xs text-gray-500">Processed earnings over the last 6 months.</p>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-3">
                        {stats.monthlyIncome.map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full relative group cursor-pointer" style={{ height: '200px' }}>
                                    <div
                                        className="absolute bottom-0 w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all group-hover:from-purple-700 group-hover:to-purple-500"
                                        style={{ height: `${(item.amount / maxIncome) * 100}%` }}
                                    />
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                                        {item.amount.toLocaleString()} DZD
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium">{item.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Task Distribution */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="mb-6">
                        <h2 className="font-semibold text-gray-900 mb-1">Task Status</h2>
                        <p className="text-xs text-gray-500">Current task breakdown.</p>
                    </div>
                    <div className="flex items-center justify-center mb-6">
                        <div className="relative w-40 h-40">
                            {totalTasksCount > 0 ? (
                                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12"
                                        strokeDasharray={`${(stats.taskDistribution.completed / totalTasksCount) * 251} 251`}
                                        strokeLinecap="round" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12"
                                        strokeDasharray={`${(stats.taskDistribution.inProgress / totalTasksCount) * 251} 251`}
                                        strokeDashoffset={`-${(stats.taskDistribution.completed / totalTasksCount) * 251}`}
                                        strokeLinecap="round" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#a78bfa" strokeWidth="12"
                                        strokeDasharray={`${(stats.taskDistribution.inReview / totalTasksCount) * 251} 251`}
                                        strokeDashoffset={`-${((stats.taskDistribution.completed + stats.taskDistribution.inProgress) / totalTasksCount) * 251}`}
                                        strokeLinecap="round" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#d1d5db" strokeWidth="12"
                                        strokeDasharray={`${(stats.taskDistribution.todo / totalTasksCount) * 251} 251`}
                                        strokeDashoffset={`-${((stats.taskDistribution.completed + stats.taskDistribution.inProgress + stats.taskDistribution.inReview) / totalTasksCount) * 251}`}
                                        strokeLinecap="round" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                </svg>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{totalTasksCount}</div>
                                    <div className="text-xs text-gray-500">Tasks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {[
                            { label: 'Completed', color: 'bg-green-500', count: stats.taskDistribution.completed },
                            { label: 'In Progress', color: 'bg-blue-500', count: stats.taskDistribution.inProgress },
                            { label: 'In Review', color: 'bg-purple-400', count: stats.taskDistribution.inReview },
                            { label: 'To Do', color: 'bg-gray-300', count: stats.taskDistribution.todo },
                        ].map(({ label, color, count }) => (
                            <div key={label} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${color}`} />
                                    <span className="text-gray-700">{label}</span>
                                </div>
                                <span className="font-semibold text-gray-900">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}