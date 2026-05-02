import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const tabs = ['All (4)', 'Active (2)', 'In review (1)', 'Awaiting payment (1)'];

const statusStyle = {
  'on-track':        'bg-green-50 text-green-700',
  'at-risk':         'bg-red-50 text-red-600',
  'pay to receive':  'bg-indigo-50 text-indigo-700',
};

const mockProjects = [
  { id:1, name:'NovaClinic Patient Portal v2', due:'Jun 14', expertInit:'YB', expert:'Yacine Benali', teamExtra:'+3 on team', progress:48,  spent:'196,000', total:'420,000', status:'on-track' },
  { id:2, name:'Telehealth video add-on',       due:'May 2',  expertInit:'YB', expert:'Yacine Benali', teamExtra:'+2 on team', progress:92,  spent:'148,000', total:'160,000', status:'at-risk' },
  { id:3, name:'Patient records migration',      due:'Apr 10', expertInit:'WH', expert:'Walid Hamidi',  teamExtra:'+2 on team', progress:100, spent:'180,000', total:'180,000', status:'pay to receive' },
];

export default function ClientProjects() {
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="px-8 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Projects</h1>
      <p className="text-sm text-gray-500 mb-6">All projects you've commissioned — active, in review, and delivered.</p>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${tab===i ? 'text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] px-5 py-3 bg-gray-50 border-b border-gray-200">
          {['PROJECT','EXPERT / TEAM','PROGRESS','BUDGET','STATUS',''].map(h => (
            <div key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</div>
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {mockProjects.map(p => (
            <div key={p.id} className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] items-center px-5 py-4 hover:bg-gray-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-gray-900">{p.name}</div>
                <div className="text-xs text-gray-400">Due {p.due}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">{p.expertInit}</div>
                <div>
                  <div className="text-sm text-gray-700">{p.expert}</div>
                  <div className="text-xs text-gray-400">{p.teamExtra}</div>
                </div>
              </div>
              <div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-28 mb-0.5">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width:`${p.progress}%` }} />
                </div>
                <div className="text-xs text-gray-400">{p.progress}%</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{p.spent} DZD</div>
                <div className="text-xs text-gray-400">of {p.total} DZD</div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${statusStyle[p.status]}`}>{p.status}</span>
              <button onClick={() => navigate(`/client/projects/${p.id}`)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Open →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
