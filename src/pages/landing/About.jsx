import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const values = [
    {
        num: '01',
        title: 'Quality over speed',
        description: "Every deliverable passes through expert review before it reaches the client. We never ship work that isn't ready no exceptions.",
        accent: '#8b5cf6',
    },
    {
        num: '02',
        title: 'Full transparency',
        description: "Clients track every milestone in real time. No black boxes, no guessing full visibility from kickoff to delivery.",
        accent: '#3b82f6',
    },
    {
        num: '03',
        title: 'Real opportunities',
        description: "We connect talented people with real client work building careers, portfolios, and experience that actually matters.",
        accent: '#10b981',
    },
    {
        num: '04',
        title: 'Fair compensation',
        description: "Every contributor is paid fairly and on time. Transparent revenue splits, no hidden deductions, no delays.",
        accent: '#f59e0b',
    },
];

export default function About() {
    return (
        <div style={{ background: '#0a0a1a', minHeight: '100vh' }}>
            <style>{`
        .grain { position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.3;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E"); }
        .value-row {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          transition: background 0.2s ease;
        }
        .value-row:hover { background: rgba(255,255,255,0.02); }
        .fade-up { animation: fadeUp 0.7s cubic-bezier(0.4,0,0.2,1) both; }
        .fade-up:nth-child(1){animation-delay:0.0s}
        .fade-up:nth-child(2){animation-delay:0.1s}
        .fade-up:nth-child(3){animation-delay:0.2s}
        .fade-up:nth-child(4){animation-delay:0.3s}
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

            <div className="grain" />
            <Navbar />

            {/* ── HERO ── */}
            <section className="relative pt-36 pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 65%)' }} />

                <div className="relative z-10 max-w-[1200px] mx-auto px-8">
                    <span className="inline-block px-6 py-2 rounded-full text-xs font-semibold tracking-[1.5px] uppercase text-violet-400 mb-12"
                        style={{ border: '1px solid rgba(139,92,246,0.4)' }}>
                        ABOUT ORBITE
                    </span>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-16 items-start">
                        {/* Left — label + title */}
                        <div>
                            <h1 className="text-[clamp(2rem,4vw,3.7rem)] font-extrabold text-white leading-[1.1]"
                                style={{ letterSpacing: '-0.02em' }}>
                                We exist to make<br />quality digital<br />work accessible.
                            </h1>
                        </div>

                        {/* Right — pull quote */}
                        <div className="lg:pt-2">
                            <div className="text-[0.7rem] tracking-[3px] uppercase text-white/20 mb-6">Founded in Algeria, 2026</div>
                            <p className="text-[1.15rem] text-white/55 leading-[1.9]" style={{ fontWeight: 300 }}>
                                Orbite is a digital agency built differently. We combine vetted specialist talent with senior expert oversight to deliver work that meets professional standards — every single time.
                            </p>
                            <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                                <p className="text-[0.95rem] text-white/35 leading-[1.9]" style={{ fontWeight: 300 }}>
                                    We started with one question: why does quality digital work have to be expensive or inaccessible? Orbite is our answer — a platform where talent meets opportunity, and clients get results they can trust.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MISSION PULL QUOTE ── */}
            <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0a0a1a' }}>
                <div className="max-w-[1200px] mx-auto px-8 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 items-start">
                        <div>
                            <span className="text-[0.68rem] tracking-[3px] uppercase text-white/20 block mt-1">Our Mission</span>
                        </div>
                        <div>
                            <blockquote className="text-[clamp(1.4rem,3vw,2.1rem)] font-extrabold text-white leading-[1.35]"
                                style={{ letterSpacing: '-0.01em' }}>
                                "Bridge the gap between talent and opportunity in Algeria and beyond."
                            </blockquote>
                            <p className="mt-6 text-[0.9rem] text-white/35 leading-[1.85] max-w-[600px]" style={{ fontWeight: 300 }}>
                                Algeria has an enormous pool of skilled digital talent who lack access to real professional work. Businesses need quality output but can't always afford established agencies. Orbite solves both sides simultaneously.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── VALUES ── */}
            <section className="py-24" style={{ background: '#0a0a1a' }}>
                <div className="max-w-[1200px] mx-auto px-8">

                    {/* Header row */}
                    <div className="grid grid-cols-[80px_1fr_2fr] gap-8 pb-6 mb-2"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="text-[0.65rem] tracking-[3px] uppercase text-white/20">#</span>
                        <span className="text-[0.65rem] tracking-[3px] uppercase text-white/20">Value</span>
                        <span className="text-[0.65rem] tracking-[3px] uppercase text-white/20">What it means</span>
                    </div>

                    {values.map((v, i) => (
                        <div key={i} className="value-row fade-up grid grid-cols-[80px_1fr_2fr] gap-8 py-8 px-2 rounded-lg">
                            <span className="text-[0.75rem] font-semibold pt-1" style={{ color: v.accent }}>{v.num}</span>
                            <h3 className="text-[1rem] font-bold text-white leading-snug pt-0.5">{v.title}</h3>
                            <p className="text-[0.88rem] text-white/40 leading-[1.75]" style={{ fontWeight: 300 }}>{v.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    );
}