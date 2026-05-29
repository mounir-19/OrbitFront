import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const services = [
    { num: '01', name: 'Web Development', tagline: 'Full-stack web experiences', description: "Modern, responsive websites and web applications — from corporate sites to complex dashboards. Clean architecture, polished interfaces.", accent: '#8b5cf6', accentBg: 'rgba(139,92,246,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg> },
    { num: '02', name: 'App Development', tagline: 'iOS & Android, native & cross-platform', description: "Mobile applications built for performance and delight. Smooth, intuitive experiences your users will come back to.", accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> },
    { num: '03', name: 'UI/UX Design', tagline: 'Interfaces that feel as good as they look', description: "User-centered design that balances aesthetics with usability. Wireframes to high-fidelity prototypes — every decision grounded in clarity.", accent: '#ec4899', accentBg: 'rgba(236,72,153,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><circle cx="11" cy="11" r="2" /></svg> },
    { num: '04', name: 'Architecture', tagline: 'Technical foundations built to scale', description: "Database schemas, API structures, infrastructure planning. We architect the foundation so your product can grow without breaking.", accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></svg> },
    { num: '05', name: 'Commerce', tagline: 'E-commerce that converts', description: "Online stores built for performance. Product catalogs, payment integrations, inventory management — everything to sell professionally.", accent: '#10b981', accentBg: 'rgba(16,185,129,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg> },
    { num: '06', name: 'Video Editing', tagline: 'From raw footage to final cut', description: "Editing, color grading, motion graphics, subtitling — product demos, promotional content, explainer videos, social campaigns.", accent: '#ef4444', accentBg: 'rgba(239,68,68,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg> },
    { num: '07', name: 'Data Science', tagline: 'Data turned into decisions', description: "Exploratory analysis, visualization dashboards, predictive models, automated reporting. We make your data work for you.", accent: '#06b6d4', accentBg: 'rgba(6,182,212,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
    { num: '08', name: 'Presentation', tagline: 'Slides that command attention', description: "Investor pitches, business proposals, corporate decks. Clean layouts, compelling visuals — the kind of deck that closes deals.", accent: '#a855f7', accentBg: 'rgba(168,85,247,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg> },
    { num: '09', name: 'Voice Over', tagline: 'Professional voice for any medium', description: "High-quality recordings for videos, ads, e-learning, presentations. Multiple tones to match your brand's voice perfectly.", accent: '#f97316', accentBg: 'rgba(249,115,22,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg> },
    { num: '10', name: 'Social Media', tagline: 'Presence that grows your brand', description: "Content calendars, copywriting, graphic design, performance tracking. Consistent, creative, and effective online presence.", accent: '#84cc16', accentBg: 'rgba(132,204,22,0.12)', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg> },
];

const n = services.length;
const SLOTS = {
    '-1': { x: -430, y: 55, scale: 0.76, opacity: 0.4, z: 1 },
    '0': { x: 0, y: 0, scale: 1, opacity: 1, z: 10 },
    '1': { x: 430, y: 55, scale: 0.76, opacity: 0.4, z: 1 },
};

export default function Services() {
    const [active, setActive] = useState(0);
    const [offset, setOffset] = useState(0);

    const go = (dir) => {
        if (offset !== 0) return;
        setOffset(dir);
        setTimeout(() => {
            setActive(a => (a + dir + n) % n);
            setOffset(0);
        }, 550);
    };

    const s = services[active];

    return (
        <div style={{ background: '#07071a', minHeight: '100vh' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500&display=swap');

        .card-slot {
          will-change: transform, opacity;
          transition: transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94),
                      opacity 0.55s cubic-bezier(0.25,0.46,0.45,0.94),
                      filter 0.55s ease,
                      box-shadow 0.55s ease;
        }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 1;
          opacity: 0.35;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
        }

        .ghost-num {
          font-family: 'Playfair Display', serif;
          font-size: clamp(12rem, 28vw, 22rem);
          font-weight: 700;
          font-style: italic;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 1px rgba(255,255,255,0.04);
          user-select: none;
          letter-spacing: -0.05em;
          transition: all 0.5s ease;
        }
      `}</style>

            <div className="grain" />
            <Navbar />

            {/* ── SERVICES SECTION ── */}
            <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-24 pb-16">

                {/* Ghost number background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                    <span className="ghost-num">{s.num}</span>
                </div>

                {/* Accent glow */}
                <div className="absolute inset-0 pointer-events-none z-0 transition-all duration-700"
                    style={{ background: `radial-gradient(ellipse at 50% 50%, ${s.accent}18 0%, transparent 65%)`, transition: 'background 0.55s cubic-bezier(0.25,0.46,0.45,0.94)' }} />

                <div className="relative z-10 max-w-[1200px] mx-auto px-8 w-full">

                    {/* Section label */}
                    <div className="flex items-center justify-between mb-20 justify-center">
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                            Our Services
                        </span>
        
                    </div>

                    {/* Carousel with side arrows */}
                    <div className="relative flex items-center justify-center" style={{ height: '460px' }}>

                        {/* Left arrow */}
                        <button onClick={() => go(-1)}
                            className="absolute flex items-center justify-center cursor-pointer z-20"
                            style={{
                                left: '0px',
                                width: '44px', height: '44px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.4)',
                                backdropFilter: 'blur(8px)',
                            }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>

                        {/* Right arrow */}
                        <button onClick={() => go(1)}
                            className="absolute flex items-center justify-center cursor-pointer z-20"
                            style={{
                                right: '0px',
                                width: '44px', height: '44px',
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'rgba(255,255,255,0.4)',
                                backdropFilter: 'blur(8px)',
                            }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                        {[-1, 0, 1].map(slot => {
                            const idx = (active + slot + n) % n;
                            const card = services[idx];
                            const isCenter = slot === 0;
                            const animSlot = slot - offset;
                            const clamped = Math.max(-1, Math.min(1, animSlot));
                            const pos = SLOTS[String(clamped)];
                            const visible = Math.abs(animSlot) <= 1.5;

                            return (
                                <div key={idx} className="card-slot absolute rounded-3xl"
                                    style={{
                                        width: isCenter ? '420px' : '320px',
                                        padding: '2rem',
                                        minHeight: isCenter ? '400px' : '300px',
                                        background: isCenter
                                            ? 'rgba(18,14,40,0.96)'
                                            : 'rgba(12,10,28,0.6)',
                                        border: `1px solid ${isCenter ? card.accent + '45' : 'rgba(255,255,255,0.04)'}`,
                                        boxShadow: isCenter
                                            ? `0 40px 100px ${card.accent}20, 0 0 0 1px ${card.accent}15`
                                            : 'none',
                                        zIndex: pos.z,
                                        cursor: !isCenter ? 'pointer' : 'default',
                                        transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.scale})`,
                                        opacity: visible ? pos.opacity : 0,
                                        filter: isCenter ? 'none' : 'blur(1.5px) saturate(0.3)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                    onClick={() => !isCenter && go(slot)}
                                >
                                    {/* Top row */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                            style={{ background: card.accentBg, color: card.accent }}>
                                            {card.icon}
                                        </div>
                                        <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '0.9rem', color: isCenter ? card.accent : 'rgba(255,255,255,0.15)', transition: 'color 0.4s' }}>
                                            {card.num}
                                        </span>
                                    </div>

                                    {/* Name */}
                                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: isCenter ? '1.9rem' : '1.2rem', color: '#fff', lineHeight: 1.2, marginBottom: '0.6rem' }}>
                                        {card.name}
                                    </h3>

                                    {/* Tagline */}
                                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', color: isCenter ? card.accent : 'rgba(255,255,255,0.2)', fontWeight: 400, marginBottom: isCenter ? '1rem' : 0 }}>
                                        {card.tagline}
                                    </p>

                                    {/* Description — center only */}
                                    {isCenter && (
                                        <>
                                            <div className="h-px my-4" style={{ background: `linear-gradient(to right, ${card.accent}35, transparent)` }} />
                                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.83rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, fontWeight: 300 }}>
                                                {card.description}
                                            </p>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Dots only */}
                    <div className="flex gap-[6px] items-center justify-center mt-14">
                        {services.map((sv, i) => (
                            <button key={i} onClick={() => { if (offset === 0) setActive(i); }}
                                className="rounded-full cursor-pointer"
                                style={{
                                    width: i === active ? '28px' : '5px',
                                    height: '5px',
                                    background: i === active ? sv.accent : 'rgba(255,255,255,0.12)',
                                    transition: 'all 0.35s ease',
                                    border: 'none',
                                }} />
                        ))}
                    </div>
                </div>
            </section>



            <Footer />
        </div>
    );
}