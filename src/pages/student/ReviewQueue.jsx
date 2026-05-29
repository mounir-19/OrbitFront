import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';

export default function ReviewQueue() {
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setLoading(false), 300);
    }, []);

    const mockItems = [
        {
            id: 1,
            project: 'AL-KARAMA BAKERY',
            title: 'Stripe Webhooks Handler',
            expert: 'Lina Cherif',
            submitted: '2 hours ago',
            priority: 'HIGH PRIORITY',
            priorityColor: 'purple',
            status: 'pending'
        },
        {
            id: 2,
            project: 'ORANMARKET',
            title: 'Mobile Auth Flow Mockups',
            expert: 'Yacine Benali',
            submitted: 'Yesterday',
            priority: 'MEDIUM PRIORITY',
            priorityColor: 'blue',
            status: 'feedback',
            feedback: 'The AR interface needs more contrast on the buttons.'
        },
        {
            id: 3,
            project: 'AL-KARAMA BAKERY',
            title: 'Bilingual Menu Implementation',
            expert: 'Lina Cherif',
            submitted: '2 days ago',
            priority: 'LOW PRIORITY',
            priorityColor: 'gray',
            status: 'approved'
        }
    ];

    if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading review queue...</div>;

    return (
        <div className="px-8 py-8 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Queue</h1>
                <p className="text-sm text-gray-500">Track your submissions and expert evaluations.</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                >
                    ALL
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'pending'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                >
                    PENDING
                </button>
                <button
                    onClick={() => setFilter('feedback')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'feedback'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                >
                    FEEDBACK
                </button>
                <button
                    onClick={() => setFilter('approved')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'approved'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                >
                    APPROVED
                </button>
            </div>

            {/* Review items */}
            <div className="space-y-4">
                {mockItems.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${item.status === 'pending' ? 'bg-blue-100' :
                                item.status === 'feedback' ? 'bg-orange-100' :
                                    'bg-green-100'
                                }`}>
                                {item.status === 'pending' && <Clock size={24} className="text-blue-600" />}
                                {item.status === 'feedback' && <AlertCircle size={24} className="text-orange-600" />}
                                {item.status === 'approved' && <CheckCircle size={24} className="text-green-600" />}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {item.project}
                                    </span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${item.priorityColor === 'purple' ? 'bg-purple-100 text-purple-700' :
                                        item.priorityColor === 'blue' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {item.priority}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>

                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M7 7.5v3.5M7 3.5h.01M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                        </svg>
                                        <span>Expert: {item.expert}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
                                            <path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                        </svg>
                                        <span>Submitted {item.submitted}</span>
                                    </div>
                                </div>

                                {item.feedback && (
                                    <div className="bg-orange-50 border-l-4 border-orange-400 rounded p-3 mb-3">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-1">
                                                    EXPERT FEEDBACK
                                                </div>
                                                <div className="text-sm text-orange-900">{item.feedback}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium">
                                    VIEW DETAILS
                                </button>
                                <button className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                                    MESSAGE EXPERT
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}