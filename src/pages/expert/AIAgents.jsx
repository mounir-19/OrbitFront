import { useState, useRef, useEffect } from 'react';
import { X, Plus, RefreshCw, Trash2, Zap, User, Sparkles, Check } from 'lucide-react';
import { runTaskBreakdown, approveTaskBreakdown, runTeamMatching, approveTeam } from '../../api/expert.api';
import toast from 'react-hot-toast';

// ─── TASK BREAKDOWN AGENT ─────────────────────────────────────────────────────
const DOMAINS = ['Web Dev', 'UI/UX', 'Mobile', 'Video'];
const COMMITS = ['One-off', 'Weekly', 'Twice weekly'];

const defaultTasks = [
  { id: 1, title: 'Project setup & Next.js + i18n scaffold', desc: 'Initialize repo, tooling, ESLint, Tailwind', domain: 'Web Dev', weight: 6, commits: 'One-off' },
  { id: 2, title: 'Auth flow — phone + OTP', desc: 'Patient signup/login via phone number', domain: 'Web Dev', weight: 10, commits: 'Weekly' },
  { id: 3, title: 'Patient profile + medical history UI', desc: 'Profile creation, editable fields, timeline', domain: 'Web Dev', weight: 12, commits: 'Weekly' },
  { id: 4, title: 'Doctor calendar & booking engine', desc: 'Doctor availability model, slot generation', domain: 'Web Dev', weight: 18, commits: 'Twice weekly' },
  { id: 5, title: 'Admin panel — secretary daily overview', desc: 'Per-doctor schedule, quick-edit, notifications', domain: 'Web Dev', weight: 12, commits: 'Weekly' },
  { id: 6, title: 'Prescription PDF generator (Fr/Ar)', desc: 'Server-side PDF with bilingual layout', domain: 'Web Dev', weight: 8, commits: 'One-off' },
];

export function TaskBreakdown() {
  const [step, setStep] = useState(1); // 1=Scope, 2=Generating, 3=Review
  const [scope, setScope] = useState(`NovaClinic needs a responsive patient portal where registered patients can book appointments with any of 6 doctors, view their medical history, download prescriptions as PDF, and receive SMS reminders. Admin side: doctors manage their calendar, secretaries see a daily overview. French + Arabic UI. Auth via phone + OTP. Launch target: 8 weeks. Budget: 420,000 DZD.`);
  const [duration, setDuration] = useState('8 weeks');
  const [budget, setBudget] = useState('420,000 DZD');
  const [domains, setDomains] = useState(['Web Dev', 'UI/UX']);
  const [tasks, setTasks] = useState(defaultTasks);
  const [streamLines, setStreamLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectId] = useState(2);
  const streamRef = useRef(null);

  const totalWeight = tasks.reduce((s, t) => s + Number(t.weight), 0);

  const toggleDomain = (d) => setDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const simulate = async () => {
    setStep(2);
    setLoading(true);
    const lines = [
      'Parsing scope… 3 user roles, 2 languages (fr/ar), RTL',
      'Identified domains: web development, UI/UX design',
      'Estimated complexity: medium-high (8-week target)',
      'Decomposing into atomic tasks…✓',
      '→ infrastructure + scaffolding✓',
      '→ authentication (phone + OTP)✓',
      '→ patient-facing screens✓',
      '→ doctor calendar & booking engine✓',
      '→ admin / secretary workflow✓',
      '→ SMS + PDF services✓',
      '→ bilingual design system✓',
      '→ QA & deployment✓',
    ];
    setStreamLines([]);
    for (const line of lines) {
      await new Promise(r => setTimeout(r, 300));
      setStreamLines(prev => [...prev, line]);
    }
    // Try real API
    try {
      await runTaskBreakdown({ project_id: projectId, scope_summary: scope, team_size: 3, deadline: duration, domain: domains.join(',') });
    } catch { }
    setLoading(false);
    setTimeout(() => setStep(3), 600);
  };

  const handleApprove = async () => {
    try {
      await approveTaskBreakdown(projectId, tasks);
      toast.success('Task plan locked and pushed to workspace!');
      setStep(1);
    } catch {
      toast.success('Task plan approved! (Demo mode)');
      setStep(1);
    }
  };

  const autoBalance = () => {
    const each = Math.floor(100 / tasks.length);
    const remainder = 100 - each * tasks.length;
    setTasks(t => t.map((task, i) => ({ ...task, weight: each + (i === 0 ? remainder : 0) })));
  };

  const updateTask = (id, key, val) => setTasks(t => t.map(x => x.id === id ? { ...x, [key]: val } : x));
  const deleteTask = (id) => setTasks(t => t.filter(x => x.id !== id));
  const addTask = () => setTasks(t => [...t, { id: Date.now(), title: 'New task', desc: '', domain: 'Web Dev', weight: 5, commits: 'Weekly' }]);

  return (
    <div className="px-0 py-0 h-full flex flex-col">
      {/* Agent header */}
      <div className="border-b border-gray-200 px-8 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Zap size={18} className="text-indigo-600" />
        </div>
        <div>
          <div className="font-bold text-gray-900">Task Breakdown Agent</div>
          <div className="text-sm text-gray-500">NovaClinic Patient Portal · NovaClinic SARL</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Claude Haiku 4.5
          </span>
          {step === 3 && <button onClick={() => setStep(1)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>}
        </div>
      </div>

      {/* Steps */}
      <div className="border-b border-gray-200 px-8 py-3 flex items-center gap-6">
        {[{ n: 1, l: 'Scope' }, { n: 2, l: 'Generating' }, { n: 3, l: 'Review' }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-gray-200" />}
            <div className={`flex items-center gap-2 text-sm font-medium ${step === s.n ? 'text-indigo-700' : step > s.n ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s.n ? 'bg-indigo-600 text-white' : step > s.n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s.n ? <Check size={12} /> : s.n}
              </div>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* STEP 1 — Scope */}
        {step === 1 && (
          <div className="flex gap-6 px-8 py-6">
            <div className="flex-1 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmed scope from client meeting</label>
                <textarea value={scope} onChange={e => setScope(e.target.value)} rows={8}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                  <input value={duration} onChange={e => setDuration(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget</label>
                  <input value={budget} onChange={e => setBudget(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domains involved</label>
                <div className="flex gap-2 flex-wrap">
                  {DOMAINS.map(d => (
                    <button key={d} onClick={() => toggleDomain(d)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${domains.includes(d) ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {domains.includes(d) && '✓ '}{d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-64 flex-shrink-0">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-5">
                <div className="text-xs font-semibold text-indigo-500 mb-3 flex items-center gap-1"><Zap size={11} /> What happens next</div>
                <ol className="text-sm text-gray-700 flex flex-col gap-2 list-decimal list-inside">
                  <li>Claude receives your scope + project context.</li>
                  <li>It proposes a weighted task plan in your format.</li>
                  <li>You review, edit, rebalance weights.</li>
                  <li>On approval, tasks lock and ship to the workspace.</li>
                </ol>
                <p className="text-xs text-gray-600 mt-4 font-medium">Nothing is applied without your approval. Weights can be edited, rows added or removed, and the total must equal 100% before you can lock.</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Generating */}
        {step === 2 && (
          <div className="px-8 py-8 max-w-2xl">
            <div className="flex items-center gap-2 mb-4 text-sm font-medium text-indigo-600">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Thinking · Step 3 of 3 · Balancing
            </div>
            <div className="bg-gray-950 rounded-xl px-6 py-5 font-mono text-sm">
              {streamLines.map((l, i) => (
                <div key={i} className={`mb-1 ${l.startsWith('→') ? 'text-green-400' : l.includes('domains:') || l.includes('complexity:') ? 'text-yellow-300' : 'text-gray-200'}`}>
                  › {l}
                </div>
              ))}
              {loading && <div className="text-gray-400 animate-pulse">› _</div>}
            </div>
          </div>
        )}

        {/* STEP 3 — Review */}
        {step === 3 && (
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium flex items-center gap-1"><Zap size={10} /> AI-drafted · {tasks.length} tasks</span>
                <span className="text-sm text-gray-500">Edit freely. Weights must total 100%.</span>
                <span className={`text-sm font-semibold ${totalWeight === 100 ? 'text-green-600' : 'text-red-500'}`}>{totalWeight}%</span>
              </div>
              <div className="flex gap-2">
                <button onClick={autoBalance} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  <RefreshCw size={13} /> Auto-balance
                </button>
                <button onClick={addTask} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  <Plus size={13} /> Add task
                </button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_auto] px-4 py-3 bg-gray-50 border-b border-gray-200">
                {['TASK', 'DESCRIPTION', 'DOMAIN', 'WEIGHT', 'COMMITS', ''].map(h => (
                  <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
                ))}
              </div>
              <div className="divide-y divide-gray-100">
                {tasks.map(t => (
                  <div key={t.id} className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_auto] items-center px-4 py-3 hover:bg-gray-50 gap-2">
                    <input value={t.title} onChange={e => updateTask(t.id, 'title', e.target.value)} className="text-sm text-gray-900 outline-none bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-400 py-0.5" />
                    <span className="text-xs text-gray-400 truncate">{t.desc}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium w-fit">{t.domain}</span>
                    <div className="flex items-center gap-2">
                      <input type="number" value={t.weight} onChange={e => updateTask(t.id, 'weight', Number(e.target.value))} min={1} max={100}
                        className="w-12 border border-gray-200 rounded px-2 py-1 text-sm text-center outline-none focus:border-indigo-400" />
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${t.weight}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{t.commits}</span>
                    <button onClick={() => deleteTask(t.id)} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-between bg-white">
        <span className="text-xs text-gray-400">Claude Haiku 4.5 · est. 15s · ~$0.004</span>
        <div className="flex gap-3">
          {step === 1 && <><button onClick={() => { }} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={simulate} disabled={!scope.trim()} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"><Zap size={14} /> Generate tasks</button></>}
          {step === 2 && <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Stop</button>}
          {step === 3 && <><button onClick={() => simulate()} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Regenerate</button>
            <button onClick={handleApprove} disabled={totalWeight !== 100} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-800 text-white rounded-lg text-sm font-semibold hover:bg-indigo-900 disabled:opacity-60">✓ Approve & lock plan</button></>}
        </div>
      </div>
    </div>
  );
}

// ─── TEAM MATCHING AGENT ──────────────────────────────────────────────────────
const criteria = ['Domain', 'Rating', 'History', 'Tags', 'Consecutive', 'Referral', 'Availability'];
const applicants = [
  { init: 'MB', color: 'bg-indigo-100 text-indigo-700', name: 'Mohamed Benali', sub: 'Web Dev · 3 projects · 4.7', badge: 'Referrer', badgeColor: 'bg-blue-50 text-blue-600' },
  { init: 'SH', color: 'bg-teal-100 text-teal-700', name: 'Sarah Haddad', sub: 'Web Dev · 4 projects · 4.8', badge: null },
  { init: 'LC', color: 'bg-pink-100 text-pink-700', name: 'Lina Cherifi', sub: 'Design · 3 projects · 4.6', badge: null },
  { init: 'KM', color: 'bg-amber-100 text-amber-700', name: 'Karim Meziane', sub: 'Web Dev · 2 projects · 4.4', badge: 'On project', badgeColor: 'bg-amber-50 text-amber-600' },
  { init: 'NT', color: 'bg-purple-100 text-purple-700', name: 'Nadir Talbi', sub: 'UI · 1 project · 4.4', badge: null },
];

export function TeamMatching() {
  const [step, setStep] = useState(1);
  const [teamSize, setTeamSize] = useState(3);
  const [selected, setSelected] = useState(['Domain', 'Rating', 'History', 'Consecutive', 'Referral', 'Availability']);
  const [loading, setLoading] = useState(false);
  const [projectId] = useState(2);

  const toggleCriteria = (c) => setSelected(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const generate = async () => {
    setStep(2);
    setLoading(true);
    try {
      await runTeamMatching(projectId);
    } catch { }
    setTimeout(() => { setLoading(false); setStep(3); }, 2000);
  };

  const handleApprove = async () => {
    try {
      await approveTeam(projectId, [1, 2, 3]);
      toast.success('Team approved and notified!');
      setStep(1);
    } catch {
      toast.success('Team approved! (Demo mode)');
      setStep(1);
    }
  };

  const shortlist = applicants.slice(0, teamSize);

  return (
    <div className="px-0 py-0 h-full flex flex-col">
      {/* Agent header */}
      <div className="border-b border-gray-200 px-8 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center"><User size={18} className="text-indigo-600" /></div>
        <div>
          <div className="font-bold text-gray-900">Student Matching Agent</div>
          <div className="text-sm text-gray-500">NovaClinic Patient Portal · 7 applicants</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Claude Haiku 4.5
          </span>
          {step === 3 && <button onClick={() => setStep(1)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>}
        </div>
      </div>

      {/* Steps */}
      <div className="border-b border-gray-200 px-8 py-3 flex items-center gap-6">
        {[{ n: 1, l: 'Config' }, { n: 2, l: 'Ranking' }, { n: 3, l: 'Review' }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-8 bg-gray-200" />}
            <div className={`flex items-center gap-2 text-sm font-medium ${step === s.n ? 'text-indigo-700' : step > s.n ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s.n ? 'bg-indigo-600 text-white' : step > s.n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s.n ? <Check size={12} /> : s.n}
              </div>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {(step === 1 || step === 2) && (
          <div className="flex gap-6 px-8 py-6">
            <div className="flex-1 flex flex-col gap-6">
              {/* Team size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team size to shortlist</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setTeamSize(n)}
                      className={`px-5 py-2 rounded-full text-sm font-medium border transition-colors ${teamSize === n ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {n} members
                    </button>
                  ))}
                </div>
              </div>

              {/* Criteria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Matching criteria (sent to Claude)</label>
                <div className="flex flex-wrap gap-2">
                  {criteria.map(c => (
                    <button key={c} onClick={() => toggleCriteria(c)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selected.includes(c) ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {selected.includes(c) && '✓ '}{c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Applicant pool */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Applicant pool ({applicants.length})</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {applicants.map(a => (
                    <div key={a.init} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <div className={`w-8 h-8 rounded-full ${a.color} flex items-center justify-center text-xs font-bold flex-shrink-0`}>{a.init}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{a.name}</div>
                        <div className="text-xs text-gray-400">{a.sub}</div>
                      </div>
                      {a.badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.badgeColor}`}>{a.badge}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {step === 2 && (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Ranking applicants against project requirements…
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-5">
                <div className="text-xs font-semibold text-indigo-500 mb-3 flex items-center gap-1"><Sparkles size={11} /> How ranking works</div>
                <p className="text-sm text-gray-700 mb-4">Claude weighs each criterion you selected and produces a ranked shortlist of <strong>{teamSize} students</strong>, each with a one-line reason you can audit.</p>
                <div className="font-semibold text-gray-900 text-sm mb-2">Rules applied automatically</div>
                <ul className="text-xs text-gray-600 flex flex-col gap-1.5 list-disc list-inside">
                  <li>Consecutive-project constraint deprioritizes on-project students.</li>
                  <li>Referrer gets priority among equally-qualified candidates.</li>
                  <li>You always have final selection authority.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="px-8 py-6 max-w-2xl">
            <p className="text-sm text-gray-500 mb-4">AI-ranked shortlist of {teamSize} students. Review and approve to notify them.</p>
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {shortlist.map((a, i) => (
                <div key={a.init} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                  <span className="text-sm font-bold text-gray-400 w-4">#{i + 1}</span>
                  <div className={`w-9 h-9 rounded-full ${a.color} flex items-center justify-center text-sm font-bold flex-shrink-0`}>{a.init}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                    <div className="text-xs text-gray-400">{a.sub}</div>
                  </div>
                  {a.badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.badgeColor}`}>{a.badge}</span>}
                  <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">View profile</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-between bg-white">
        <span className="text-xs text-gray-400">Claude Haiku 4.5 · est. 9s · ~$0.002</span>
        <div className="flex gap-3">
          {step === 1 && <><button className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={generate} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"><Zap size={14} /> Generate shortlist</button></>}
          {step === 2 && <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>}
          {step === 3 && <><button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Back</button>
            <button onClick={handleApprove} className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-800 text-white rounded-lg text-sm font-semibold hover:bg-indigo-900">✓ Approve team</button></>}
        </div>
      </div>
    </div>
  );
}