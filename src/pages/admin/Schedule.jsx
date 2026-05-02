import { useState } from 'react';

const days = [
  { day: 'MON', date: 28, events: [
    { time: '10:00', title: 'OranMarket — kickoff',    people: 'Lina Cherif + Amira Z.',  color: 'bg-green-100 border-green-400 text-green-800' },
    { time: '14:30', title: 'ESI Algiers — cohort review', people: 'Dr. Benali (Faculty)', color: 'bg-indigo-100 border-indigo-400 text-indigo-800' },
  ]},
  { day: 'TUE', date: 29, events: [
    { time: '09:30', title: 'NovaClinic standup',      people: 'Samira H. + Yacine B.',   color: 'bg-blue-100 border-blue-400 text-blue-800' },
    { time: '15:00', title: 'Mohamed Benali — 1:1',   people: 'Student mentoring',        color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  ]},
  { day: 'WED', date: 30, events: [
    { time: '11:00', title: 'Sahel Brew storyboard',   people: 'Omar D. + Farah S.',      color: 'bg-green-100 border-green-400 text-green-800' },
  ]},
  { day: 'THU', date: 1, events: [
    { time: '10:00', title: 'Djezzy scope sign-off',   people: 'Y. Boukhedir (Djezzy)',   color: 'bg-red-100 border-red-400 text-red-800' },
    { time: '16:00', title: 'Al-Karama menu demo',     people: 'Client + Student team',   color: 'bg-purple-100 border-purple-400 text-purple-800' },
  ]},
  { day: 'FRI', date: 2, events: [
    { time: '09:00', title: 'USTHB — onboarding 14 stu.', people: 'University office',   color: 'bg-indigo-100 border-indigo-400 text-indigo-800' },
    { time: '14:00', title: 'Platform ops sync',       people: 'Internal team',           color: 'bg-gray-100 border-gray-400 text-gray-700' },
  ]},
];

const legend = [
  { label: 'Kickoff',    color: 'bg-green-400'  },
  { label: 'Standup',   color: 'bg-blue-400'   },
  { label: 'Student 1:1', color: 'bg-yellow-400' },
  { label: 'Cohort',    color: 'bg-indigo-400' },
  { label: 'Demo',      color: 'bg-purple-400' },
  { label: 'Contract',  color: 'bg-red-400'    },
  { label: 'Internal',  color: 'bg-gray-400'   },
];

export default function Schedule() {
  return (
    <div className="px-8 py-8 flex flex-col h-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Schedule</h1>
      <p className="text-sm text-gray-500 mb-6">Meetings, cohort reviews, and scope sign-offs across the platform — week of Apr 28.</p>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Meetings this week', value: 9 },
          { label: 'Student 1:1s',       value: 1 },
          { label: 'Client sign-offs',   value: 3 },
          { label: 'University sessions',value: 2 },
        ].map(s => (
          <div key={s.label} className="border border-gray-200 rounded-xl px-5 py-4">
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-5 border-b border-gray-200">
          {days.map(d => (
            <div key={d.day} className="px-4 py-3 border-r border-gray-200 last:border-r-0">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{d.day}</div>
              <div className={`text-2xl font-bold ${d.date === 30 ? 'text-indigo-600' : 'text-gray-800'}`}>{d.date}</div>
            </div>
          ))}
        </div>
        {/* Events */}
        <div className="grid grid-cols-5 flex-1">
          {days.map(d => (
            <div key={d.day} className="border-r border-gray-200 last:border-r-0 p-3 flex flex-col gap-2">
              {d.events.map((e, i) => (
                <div key={i} className={`border-l-2 rounded-r-lg px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity ${e.color}`}>
                  <div className="text-xs font-semibold mb-0.5">{e.time}</div>
                  <div className="text-xs font-bold leading-tight">{e.title}</div>
                  <div className="text-[11px] mt-0.5 opacity-75">{e.people}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {legend.map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
