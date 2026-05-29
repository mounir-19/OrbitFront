import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const steps = [
    { num: '00', label: 'Get started', title: 'Sign up in minutes', description: "Create your free Orbite account. No commitment, no credit card.", accent: '#8b5cf6', cta: { label: 'Create account', to: '/register' }, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
    { num: '01', label: 'Submit', title: 'Tell us what you need', description: "Pick your service, describe your vision, submit from your dashboard.", accent: '#3b82f6', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg> },
    { num: '02', label: 'We scope it', title: 'Expert review in 24–48h', description: "A senior expert scopes your project — deliverables, timeline, price.", accent: '#ec4899', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> },
    { num: '03', label: 'Confirm & pay 50%', title: 'Approve & kick off', description: "Approve the scope and make the first payment. Work starts immediately.", accent: '#f59e0b', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
    { num: '04', label: 'We build', title: 'Track in real time', description: "Your team works under expert supervision. Follow every milestone live.", accent: '#10b981', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
    { num: '05', label: 'Deliver & pay 50%', title: 'Review & receive', description: "Expert-reviewed output. Approve, pay the final 50%, get your deliverables.", accent: '#06b6d4', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> },
];

function StepCard({ step }) {
    return (
        <div style={{
            borderRadius: '16px', padding: '16px',
            background: 'rgba(18,14,36,0.9)',
            border: `1px solid ${step.accent}25`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.63rem', fontWeight: 700, color: step.accent }}>{step.num}</span>
                <span style={{ fontSize: '0.56rem', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>{step.label}</span>
            </div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '5px', lineHeight: 1.3 }}>{step.title}</h3>
            <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, fontWeight: 300 }}>{step.description}</p>
            {step.cta && (
                <Link to={step.cta.to} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '0.72rem', fontWeight: 500, color: step.accent, textDecoration: 'none' }}>
                    {step.cta.label}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </Link>
            )}
        </div>
    );
}

export default function HowItWorks() {
    return (
        <div style={{ background: '#0a0a1a', minHeight: '100vh' }}>
            <style>{`
        .grain { position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.3;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E"); }
        .step-fade { animation: stepUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
        .step-fade:nth-child(1){animation-delay:0.05s} .step-fade:nth-child(2){animation-delay:0.12s}
        .step-fade:nth-child(3){animation-delay:0.19s} .step-fade:nth-child(4){animation-delay:0.26s}
        .step-fade:nth-child(5){animation-delay:0.33s} .step-fade:nth-child(6){animation-delay:0.40s}
        @keyframes stepUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

            <div className="grain" />
            <Navbar />

            <div className="relative z-10 max-w-[1400px] mx-auto px-8 pt-36 pb-24">

                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-6 py-2 rounded-full text-xs font-semibold tracking-[1.5px] uppercase text-violet-400 mb-6"
                        style={{ border: '1px solid rgba(139,92,246,0.4)' }}>
                        THE PROCESS
                    </span>
                    <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-extrabold text-white leading-[1.1] mb-4">
                        How it works
                    </h1>
                    <p className="text-[0.95rem] text-white/50 leading-[1.8] max-w-[480px] mx-auto">
                        Six steps from idea to delivery. Transparent, expert-supervised, every time.
                    </p>
                </div>

                {/* ── TOP CARDS ROW (even steps: 00, 02, 04) ── */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '0' }}>
                    {steps.map((step, i) => (
                        <div key={i} className="step-fade" style={{ flex: 1, minWidth: 0 }}>
                            {i % 2 === 0 ? <StepCard step={step} /> : <div style={{ height: '100%' }} />}
                        </div>
                    ))}
                </div>

                {/* ── TIMELINE ROW ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', position: 'relative', margin: '14px 0' }}>
                    {/* Full width line */}
                    <div style={{
                        position: 'absolute', top: '50%', left: '28px', right: '28px',
                        height: '1px', transform: 'translateY(-50%)',
                        background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.25) 6%, rgba(139,92,246,0.25) 94%, transparent)',
                    }} />

                    {steps.map((step, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                            {/* Connector above (for top cards) */}
                            <div style={{ width: '1px', height: '14px', background: i % 2 === 0 ? `${step.accent}50` : 'transparent' }} />

                            {/* Icon node */}
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `${step.accent}18`, color: step.accent,
                                border: `1px solid ${step.accent}45`,
                                boxShadow: `0 0 22px ${step.accent}28`,
                                flexShrink: 0,
                            }}>
                                {step.icon}
                            </div>

                            {/* Connector below (for bottom cards) */}
                            <div style={{ width: '1px', height: '14px', background: i % 2 !== 0 ? `${step.accent}50` : 'transparent' }} />
                        </div>
                    ))}
                </div>

                {/* ── BOTTOM CARDS ROW (odd steps: 01, 03, 05) ── */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    {steps.map((step, i) => (
                        <div key={i} className="step-fade" style={{ flex: 1, minWidth: 0 }}>
                            {i % 2 !== 0 ? <StepCard step={step} /> : <div />}
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
}