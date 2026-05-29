import { useState, useEffect } from 'react';
import { getMyProjects, getMyInterviews, getMyTasks } from '../../api/student.api';
import { Clock, Video, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Agenda() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        Promise.all([
            getMyInterviews().catch(() => ({ data: [] })),
            getMyTasks().catch(() => ({ data: [] })),
        ])
            .then(([interviewsRes, tasksRes]) => {
                const interviews = interviewsRes.data || [];
                const tasks = tasksRes.data || [];

                // ── Interview events ──
                const interviewEvents = interviews
                    .filter(i => i.status === 'scheduled')
                    .map(i => ({
                        id: i.id,
                        title: i.expert_name ? `Interview with ${i.expert_name}` : 'Interview',
                        type: 'meeting',
                        date: new Date(i.scheduled_at),
                        time: new Date(i.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                        description: i.meeting_link || '',
                        color: 'blue',
                    }));

                // ── Task due date events ──
                const taskEvents = tasks
                    .filter(t => t.due_date)
                    .map(t => ({
                        id: t.id,
                        title: t.title || t.description,
                        type: 'task',
                        date: new Date(t.due_date),
                        time: new Date(t.due_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                        description: t.project_title || '',
                        color: t.status === 'completed' ? 'green' : 'red',
                    }));

                setEvents([...interviewEvents, ...taskEvents].sort((a, b) => a.date - b.date));
            })
            .catch(err => console.error('Error loading agenda:', err))
            .finally(() => setLoading(false));
    }, []);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        const days = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--)
            days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
        for (let i = 1; i <= daysInMonth; i++)
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        for (let i = 1; days.length < 42; i++)
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });

        return days;
    };

    const getEventsForDate = (date) =>
        events.filter(e =>
            e.date.getDate() === date.getDate() &&
            e.date.getMonth() === date.getMonth() &&
            e.date.getFullYear() === date.getFullYear()
        );

    const upcomingEvents = events.filter(e => e.date >= new Date()).slice(0, 5);
    const todayEvents = getEventsForDate(new Date());
    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading agenda...</div>;

    return (
        <div className="px-8 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Agenda</h1>
                <p className="text-sm text-gray-500">Task deadlines, interviews, and upcoming events.</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="col-span-2">
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{monthName}</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ChevronLeft size={20} className="text-gray-600" />
                                </button>
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ChevronRight size={20} className="text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">{day}</div>
                            ))}
                            {days.map((day, index) => {
                                const dayEvents = getEventsForDate(day.date);
                                const isToday = day.date.toDateString() === new Date().toDateString();
                                const isSelected = day.date.toDateString() === selectedDate.toDateString();
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(day.date)}
                                        className={`aspect-square p-2 rounded-lg text-sm relative
                      ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                      ${isToday ? 'bg-purple-100 font-bold text-purple-700' : ''}
                      ${isSelected && !isToday ? 'bg-purple-50' : ''}
                      ${day.isCurrentMonth && !isToday && !isSelected ? 'hover:bg-gray-50' : ''}
                    `}
                                    >
                                        <div>{day.date.getDate()}</div>
                                        {dayEvents.length > 0 && (
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                {dayEvents.slice(0, 3).map((event, i) => (
                                                    <div key={i} className={`w-1 h-1 rounded-full ${event.type === 'meeting' ? 'bg-blue-500' :
                                                        event.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                                                        }`} />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {getEventsForDate(selectedDate).length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 mt-4">
                            <h3 className="font-semibold text-gray-900 mb-4">
                                {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <div className="space-y-3">
                                {getEventsForDate(selectedDate).map(event => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {todayEvents.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Today</h3>
                            <div className="space-y-3">
                                {todayEvents.map(event => <EventCard key={event.id} event={event} />)}
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h3 className="font-semibold text-gray-900 mb-4">Upcoming</h3>
                        {upcomingEvents.length === 0 ? (
                            <div className="text-sm text-gray-400 text-center py-4">No upcoming events</div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function EventCard({ event }) {
    const dateStr = event.date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    return (
        <div className="border-l-2 border-purple-500 pl-3 py-2">
            <div className="flex items-start justify-between mb-1">
                <div className="font-medium text-sm text-gray-900">{event.title}</div>
                <span className="text-xs text-gray-500">{event.time}</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">{dateStr}</div>
            {event.description && (
                <div className="text-xs text-gray-400 mb-1">{event.description}</div>
            )}
            {event.type === 'task' && (
                <div className={`flex items-center gap-1 text-xs ${event.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                    <Clock size={12} />
                    {event.color === 'green' ? 'Completed' : 'Due date'}
                </div>
            )}
            {event.type === 'meeting' && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Video size={12} />
                    Interview
                    {event.description?.startsWith('http') && (
                        <a href={event.description} target="_blank" rel="noopener noreferrer" className="ml-1 underline">
                            Join
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}