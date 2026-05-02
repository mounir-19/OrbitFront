import { useState } from 'react';
import { Image, GitPullRequest, Send, Star } from 'lucide-react';
import { Filter, Plus, X } from 'lucide-react';

// ─── REVIEW QUEUE ─────────────────────────────────────────────────────────────

const mockSubmissions = [
  { id: 1, type: 'png', name: 'Booking flow — animated walkthrough.mp4', project: 'NovaClinic Patient Portal', by: 'Lina Cherifi', submitted: '8m ago', actions: ['Open', 'Comment'] },
  { id: 2, type: 'pr', name: 'PR #42 — Booking conflict resolver', project: 'NovaClinic Patient Portal', by: 'Sara Hammadi', submitted: '2h ago', actions: ['Open', 'Approve'] },
  { id: 3, type: 'png', name: 'NovaClinic — Logo system v2.png', project: 'NovaClinic Patient Portal', by: 'Lina Cherifi', submitted: '7h ago', actions: ['Open', 'Comment'] },
  { id: 4, type: 'pr', name: 'PR #18 — Stripe webhook + idempotency', project: 'Al-Karama Bakery', by: 'Mohamed Benali', submitted: '1h ago', actions: ['Open', 'Approve'] },
  { id: 5, type: 'png', name: 'Dashboard v2 — desktop + tablet.png', project: 'OranMarket B2B dashboard', by: 'Lina Cherifi', submitted: '1h ago', actions: ['Open', 'Comment'] },
];
const tabs = ['All (5)', 'GitHub PRs', 'Designs', 'Videos'];

export function ReviewQueue() {
  const [activeTab, setActiveTab] = useState(0);
  const [items, setItems] = useState(mockSubmissions);

  const handleAction = (id, action) => {
    if (action === 'Approve') setItems(i => i.filter(x => x.id !== id));
  };

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Review queue</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${activeTab === i ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[auto_2fr_1.5fr_1fr_1fr_auto] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['', 'SUBMISSION', 'PROJECT', 'BY', 'SUBMITTED', 'ACTION'].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-[auto_2fr_1.5fr_1fr_1fr_auto] items-center px-5 py-4 hover:bg-gray-50 transition-colors gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                {item.type === 'pr' ? (
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="white"><path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.426a.25.25 0 010-.353zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" /></svg>
                  </div>
                ) : <Image size={16} className="text-indigo-500" />}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
              </div>
              <span className="text-sm text-gray-500">{item.project}</span>
              <span className="text-sm text-gray-700">{item.by}</span>
              <span className="text-sm text-gray-500">{item.submitted}</span>
              <div className="flex flex-col gap-1.5">
                {item.actions.map(a => (
                  <button key={a} onClick={() => handleAction(item.id, a)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${a === 'Approve' ? 'bg-indigo-800 text-white hover:bg-indigo-900' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    {a === 'Approve' ? '✓ Approve' : a}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AGENDA ───────────────────────────────────────────────────────────────────
const weekDays = [
  {
    day: 'MON 28', date: 'Apr 28', events: [
      { time: '10:00', title: 'NovaClinic — booking demo', person: 'Samira Haddad (NovaClinic)', color: 'border-indigo-400 bg-indigo-50' },
      { time: '14:30', title: 'Mohamed — 1:1 mentoring', person: 'Mohamed Benali', color: 'border-green-400 bg-green-50' },
    ]
  },
  {
    day: 'TUE 29', date: 'Apr 29', events: [
      { time: '09:30', title: 'NovaClinic standup', person: 'Team channel', color: 'border-blue-400 bg-blue-50' },
      { time: '15:00', title: 'OranMarket review', person: 'Lina Cherifi + Karim Meziane', color: 'border-orange-400 bg-orange-50' },
      { time: '17:00', title: 'Submission deadline — Auth flow', person: 'Mohamed Benali', color: 'border-red-400 bg-red-50' },
    ]
  },
  {
    day: 'WED 30', date: 'Apr 30', events: [
      { time: '11:00', title: 'Al-Karama — menu demo', person: 'Nora Kadri (Al-Karama)', color: 'border-blue-400 bg-blue-50' },
      { time: '17:00', title: 'Submission deadline — Charts swap', person: 'Karim Meziane', color: 'border-red-400 bg-red-50' },
    ]
  },
  {
    day: 'THU 1', date: 'May 1', events: [
      { time: '10:00', title: 'Sahel Brew — intro call', person: 'Omar Djaffar', color: 'border-amber-400 bg-amber-50' },
    ]
  },
  {
    day: 'FRI 2', date: 'May 2', events: [
      { time: '14:00', title: 'Internal — pipeline review', person: 'Yacine + ops', color: 'border-gray-400 bg-gray-50' },
    ]
  },
];

const agendaAlerts = [
  { color: 'bg-amber-400', name: 'Nadir Talbi', msg: "Hasn't logged in for 4 days", sub: 'Al-Karama · 4d ago' },
  { color: 'bg-red-500', name: 'Karim Meziane', msg: 'Missed submission: Charts library swap (was due yesterday)', sub: 'OranMarket · 1d ago' },
  { color: 'bg-blue-400', name: 'NovaClinic SARL', msg: 'Requested a meeting on Monday for booking demo', sub: 'Client · 2h ago' },
  { color: 'bg-blue-400', name: 'Lina Cherifi', msg: 'Submitted Booking flow walkthrough for review', sub: 'NovaClinic · 8m ago' },
];

export function Agenda() {
  const [showModal, setShowModal] = useState(false);
  const [meetForm, setMeetForm] = useState({ with: 'Samira Haddad (NovaClinic)', slot: 'Mon Apr 28 — 10:00', topic: 'Booking flow demo', notes: 'Walk through patient signup → booking conflict resolver → prescription PDF.' });

  return (
    <div className="px-8 py-8 flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">This week — meetings, standups, deadlines, and submission gates.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">← This week</button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">
            <Plus size={14} /> Request meeting
          </button>
        </div>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Calendar */}
        <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-gray-200 text-sm font-semibold text-gray-700">Mon Apr 28 — Fri May 2</div>
          <div className="grid grid-cols-5 flex-1">
            {weekDays.map(d => (
              <div key={d.day} className="border-r border-gray-200 last:border-r-0">
                <div className="px-3 py-2 border-b border-gray-100">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase">{d.day}</div>
                  <div className="text-lg font-bold text-gray-800">{d.date}</div>
                </div>
                <div className="p-2 flex flex-col gap-1.5">
                  {d.events.map((e, i) => (
                    <div key={i} className={`border-l-2 rounded-r-lg px-2 py-1.5 ${e.color} cursor-pointer hover:opacity-80`}>
                      <div className="text-[10px] font-semibold text-gray-600">{e.time}</div>
                      <div className="text-xs font-bold text-gray-900 leading-tight">{e.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{e.person}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-56 flex-shrink-0 flex flex-col gap-4">
          <div className="border border-gray-200 rounded-xl px-4 py-4">
            <div className="font-semibold text-gray-900 mb-3">Alerts</div>
            <div className="flex flex-col gap-3">
              {agendaAlerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${a.color}`} />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{a.name}</div>
                    <div className="text-xs text-gray-600 leading-snug">{a.msg}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{a.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-indigo-100 bg-indigo-50 rounded-xl px-4 py-4">
            <div className="font-semibold text-gray-900 mb-1">This week at a glance</div>
            <div className="text-xs text-gray-600">9 events scheduled · 1 urgent alerts.</div>
          </div>
        </div>
      </div>

      {/* Request meeting modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[540px] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Request a meeting</h2>
                <p className="text-sm text-gray-500">Sends an invitation with calendar slots.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: 'With', key: 'with', type: 'select', options: ['Samira Haddad (NovaClinic)', 'Mohamed Benali', 'Nadir Talbi'] },
                { label: 'Proposed slot', key: 'slot', type: 'select', options: ['Mon Apr 28 — 10:00', 'Tue Apr 29 — 09:30', 'Wed Apr 30 — 11:00'] },
                { label: 'Topic', key: 'topic', type: 'text' },
                { label: 'Notes', key: 'notes', type: 'textarea' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={meetForm[f.key]} onChange={e => setMeetForm(x => ({ ...x, [f.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 appearance-none bg-white">
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea value={meetForm[f.key]} onChange={e => setMeetForm(x => ({ ...x, [f.key]: e.target.value }))} rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none" />
                  ) : (
                    <input value={meetForm[f.key]} onChange={e => setMeetForm(x => ({ ...x, [f.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowModal(false)} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-800 text-white rounded-lg text-sm font-semibold hover:bg-indigo-900">
                <Send size={14} /> Send request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STUDENT PIPELINE ─────────────────────────────────────────────────────────
const domainTabs = ['All (14)', 'Video', 'Design', 'Web', 'UI', 'Front-end', 'Mobile', 'Data', 'QA', 'DevOps'];
const mockStudents = [
  { init: 'FS', color: 'bg-orange-100 text-orange-700', name: 'Farah Sadi', sub: 'Ex-broadcast editor, fastest video turnaround in pool.', domain: 'Video', rating: 4.6, projects: 5, skills: ['Premiere', 'Motion'], status: 'Available', statusColor: 'text-green-600' },
  { init: 'YH', color: 'bg-yellow-100 text-yellow-700', name: 'Yanis Hamidi', sub: 'Newer but eager.', domain: 'Video', rating: 4.0, projects: 1, skills: ['Davinci'], status: 'Available', statusColor: 'text-green-600' },
  { init: 'AB', color: 'bg-pink-100 text-pink-700', name: 'Amira Boudiaf', sub: 'Could pair on storyboard.', domain: 'Design', rating: 4.2, projects: 2, skills: ['Brand', 'Motion'], status: 'Available', statusColor: 'text-green-600' },
  { init: 'LC', color: 'bg-indigo-100 text-indigo-700', name: 'Lina Cherifi', sub: 'Available — could lead style.', domain: 'Design', rating: 4.6, projects: 3, skills: ['Brand'], status: 'On project', statusColor: 'text-blue-600' },
  { init: 'MB', color: 'bg-blue-100 text-blue-700', name: 'Mohamed Benali', sub: 'Already on team.', domain: 'Web', rating: 4.7, projects: 3, skills: ['Next.js', 'i18n'], status: 'On project', statusColor: 'text-blue-600' },
  { init: 'SH', color: 'bg-teal-100 text-teal-700', name: 'Sara Hammadi', sub: 'Already on team.', domain: 'Web', rating: 4.8, projects: 4, skills: ['Scheduling'], status: 'On project', statusColor: 'text-blue-600' },
  { init: 'NT', color: 'bg-purple-100 text-purple-700', name: 'Nadir Talbi', sub: 'On active project.', domain: 'UI', rating: 4.4, projects: 1, skills: ['Figma', 'UI', 'Brand'], status: 'On project', statusColor: 'text-blue-600' },
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={12} className={s <= Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
      ))}
      <span className="text-sm font-semibold text-gray-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export function StudentPipeline() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="px-8 py-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">14 students in your bench — assignable to any project the AI suggests.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Plus size={14} /> Invite student</button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900"><Filter size={12} /> Advanced filter</button>
        </div>
      </div>

      {/* Domain tabs */}
      <div className="flex gap-1 mb-6 mt-4 flex-wrap">
        {domainTabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === i ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1.5fr_1fr_auto] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['STUDENT', 'DOMAIN', 'RATING', 'PROJECTS', 'SKILLS', 'STATUS', 'ACTION'].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {mockStudents.map(s => (
            <div key={s.init} className="grid grid-cols-[2fr_1fr_1.5fr_0.8fr_1.5fr_1fr_auto] items-center px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>{s.init}</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.sub}</div>
                </div>
              </div>
              <span className="text-sm text-gray-600">{s.domain}</span>
              <StarRating rating={s.rating} />
              <span className="text-sm text-gray-600">{s.projects}</span>
              <div className="flex flex-wrap gap-1">
                {s.skills.map(sk => (
                  <span key={sk} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{sk}</span>
                ))}
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-medium ${s.statusColor}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />{s.status}
              </span>
              <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Profile</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}