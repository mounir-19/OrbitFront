const iconColors = [
  { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
  { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
];

const cards = [
  {
    title: 'Quality Guaranteed',
    desc: 'Every deliverable passes through expert review before it reaches you. We don\'t ship work that isn\'t ready — period. Your brand deserves nothing less than polished, production-ready output.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7z" /></svg>,
  },
  {
    title: 'Right Team, Every Time',
    desc: 'Our intelligent matching system assigns specialists whose skills align precisely with your project requirements. No generalists, no guesswork — the right people from day one.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
  },
  {
    title: 'Verified Professionals',
    desc: 'Every specialist on Orbite is thoroughly vetted. We ensure a safe, professional environment where your work is handled by people committed to excellence and accountability.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  },
  {
    title: 'Secure Payments',
    desc: 'Funds are held securely until project milestones are met and approved. You only pay for work that delivers on what was promised — full transparency, no surprises.',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  },
];

export default function WhyUs() {
  return (
    <section className="py-24" style={{ background: '#0a0a1a' }}>
      <div className="max-w-[1200px] mx-auto px-6">

        <h2 className="text-[clamp(3.5rem,10vw,7rem)] font-black text-center mb-16 tracking-[-2px]"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.15) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
          WHY US?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, i) => {
            const color = iconColors[i % iconColors.length];
            return (
              <div key={i}
                className="text-center p-8 md:p-9 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(139,92,246,0.1)]"
                style={{
                  background: 'rgba(18,18,42,0.7)',
                  border: '1px solid rgba(100,80,180,0.25)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(100,80,180,0.25)'}
              >
                <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: color.bg, color: color.text }}>
                  {card.icon}
                </div>
                <h3 className="text-[1.15rem] font-bold text-white mb-3">{card.title}</h3>
                <p className="text-[0.85rem] text-white/70 leading-[1.7] mb-6">{card.desc}</p>
                <button
                  className="px-7 py-2.5 rounded-full text-[0.82rem] font-medium text-white bg-transparent transition-all hover:bg-violet-500 hover:shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
                  style={{ border: '1px solid rgba(139,92,246,0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'}
                >
                  Learn more
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}