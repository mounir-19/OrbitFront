import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Zap, Lock, Download } from 'lucide-react';

const deliverables = [
  { name: 'Final database schema (v2.3).sql', date: 'Apr 10', size: '214 KB' },
  { name: 'Migration runbook.pdf', date: 'Apr 10', size: '1.2 MB' },
  { name: 'Cutover checklist & rollback plan.docx', date: 'Apr 10', size: '428 KB' },
  { name: 'Anonymised sample data', date: 'Apr 10', size: '—' },
];

const team = [
  { init: 'WH', name: 'Walid Hamidi', role: 'Expert — Lead' },
  { init: 'MB', name: 'Mohamed Benali', role: 'Developer' },
  { init: 'SH', name: 'Sara Hammadi', role: 'Data engineer' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);

  if (showPayment) return <PaymentPage onBack={() => setShowPayment(false)} />;

  return (
    <div className="px-8 py-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/client/projects')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={14} /> Back to projects
        </button>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <MessageCircle size={14} /> Chat with expert
          </button>
          <button onClick={() => setShowPayment(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">
            <Zap size={14} /> Pay to receive
          </button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient records migration</h1>
      <p className="text-sm text-gray-500 mb-6">NovaClinic SARL · Expert: Walid Hamidi · Due Apr 10</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Progress', value: '100%', sub: null, progress: true },
          { label: 'Budget spent', value: '180,000 DZD', sub: 'of 180,000 DZD' },
          { label: 'Team', value: '3', sub: '1 expert + 2 students' },
          { label: 'Status', value: 'Awaiting payment', badge: true },
        ].map(s => (
          <div key={s.label} className="border border-gray-200 rounded-xl px-5 py-4">
            <div className="text-sm text-gray-500 mb-2">{s.label}</div>
            {s.badge ? (
              <span className="text-sm font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">{s.value}</span>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                {s.sub && <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>}
                {s.progress && <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2"><div className="h-full bg-indigo-500 rounded-full w-full" /></div>}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Deliverables */}
        <div className="flex-1 min-w-0">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <span className="font-semibold text-gray-900">Deliverables</span>
              <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full">
                <Lock size={11} /> Locked until payment
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {deliverables.map(d => (
                <div key={d.name} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Download size={14} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{d.name}</div>
                    <div className="text-xs text-gray-400">Delivered {d.date} · {d.size}</div>
                  </div>
                  <button className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full hover:bg-amber-100">
                    <Lock size={11} /> Pay to download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
          {/* Ready to receive */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-200 flex items-center justify-center"><Zap size={16} className="text-indigo-700" /></div>
              <span className="font-semibold text-gray-900">Ready to receive</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">Your team delivered the full scope. Pay the final invoice to unlock downloads and release escrow to the team.</p>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-600">Amount due</span>
              <span className="font-semibold text-gray-900">180,000 DZD</span>
            </div>
            <button onClick={() => setShowPayment(true)} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900 transition-colors">
              <Zap size={14} /> Pay & receive deliverables
            </button>
          </div>

          {/* Team */}
          <div className="border border-gray-200 rounded-xl px-5 py-4">
            <div className="font-semibold text-gray-900 mb-3">Team</div>
            <div className="flex flex-col gap-2.5">
              {team.map(m => (
                <div key={m.init} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">{m.init}</div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-400">{m.role}</div>
                    </div>
                  </div>
                  <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                    <MessageCircle size={12} className="text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Payment page ──────────────────────────────────────────────────────────────
function PaymentPage({ onBack }) {
  const [method, setMethod] = useState('card');
  const [cardNum, setCardNum] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12 / 28');
  const [cvc, setCvc] = useState('424');
  const [holder, setHolder] = useState('Samira Haddad');
  const [paying, setPaying] = useState(false);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => { setPaying(false); alert('Payment successful! Deliverables unlocked.'); }, 1500);
  };

  const methods = [
    { id: 'card', label: 'Card', sub: 'Visa / Mastercard', icon: 'CRD' },
    { id: 'cib', label: 'CIB / Edahabia', sub: 'Algeria Post / SATIM', icon: 'CIB' },
    { id: 'wire', label: 'Wire transfer', sub: '24–48h clearance', icon: 'WIR' },
  ];

  return (
    <div className="px-8 py-6 max-w-3xl">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft size={14} /> Back to project</button>

      {/* Invoice summary */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-6 py-5 mb-6">
        <h2 className="font-semibold text-lg text-gray-900 mb-1">Receive your deliverables</h2>
        <p className="text-sm text-gray-600 mb-5">Complete payment to release escrow to the team and unlock all project files.</p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Patient records migration', value: '180,000 DZD', bold: false },
            { label: 'Paid in milestones', value: '– 180,000 DZD', bold: false },
            { label: 'Platform fee (5%)', value: '9,000 DZD', bold: false },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm text-gray-600 border-b border-indigo-100 pb-2 last:border-0">
              <span>{r.label}</span><span>{r.value}</span>
            </div>
          ))}
          <div className="flex justify-between text-base font-bold text-indigo-700 pt-1">
            <span>Amount due today</span><span>180,000 DZD</span>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Payment method</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {methods.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border-2 transition-colors ${method === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <span className="text-xs font-bold text-gray-500">{m.icon}</span>
              <span className="text-sm font-semibold text-gray-900">{m.label}</span>
              <span className="text-xs text-gray-400">{m.sub}</span>
            </button>
          ))}
        </div>

        {method === 'card' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Card number</label>
              <input value={cardNum} onChange={e => setCardNum(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry</label>
                <input value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CVC</label>
                <input value={cvc} onChange={e => setCvc(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cardholder name</label>
              <input value={holder} onChange={e => setHolder(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-4">
          Funds held in escrow until you confirm. Deliverables stay locked until payment clears.
        </p>

        <button onClick={handlePay} disabled={paying} className="w-full mt-4 flex items-center justify-center gap-1.5 px-4 py-3.5 bg-indigo-800 text-white rounded-xl text-sm font-semibold hover:bg-indigo-900 disabled:opacity-60 transition-colors">
          <Zap size={16} /> {paying ? 'Processing...' : 'Pay 180,000 DZD & unlock'}
        </button>
      </div>
    </div>
  );
}