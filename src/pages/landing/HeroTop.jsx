export default function HeroTop() {
  return (
    <section className="relative py-24 text-center overflow-hidden" style={{ background: '#0a0a1a' }}>

      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none z-0 opacity-60"
        style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.4) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6">

        <span className="inline-block px-6 py-2 rounded-full text-xs font-semibold tracking-[1.5px] uppercase text-violet-400 mb-7"
          style={{ border: '1px solid #8b5cf6' }}>
          WHY Orbite?
        </span>

        <h2 className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-[1.2] text-white mt-0 mb-5">
          Expert-reviewed quality,<br />delivered on time
        </h2>

        <p className="text-[0.95rem] text-white/70 leading-[1.7] max-w-[600px] mx-auto mb-16">
          Every project goes through a rigorous delivery pipeline — scoped by experts,
          executed with precision, and reviewed before it ever reaches you.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[800px] mx-auto">
          {[
            {
              title: 'Client Dashboard',
              desc: 'Track every milestone of your project in real time. Stay informed from kickoff to delivery without chasing updates.',
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
            },
            {
              title: 'Expert Oversight',
              desc: 'Your point of contact is always a senior expert. Every deliverable is reviewed and approved before you receive it.',
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></svg>,
            },
            {
              title: 'Fast Matching',
              desc: 'Our AI-powered system assigns the right team to your project instantly, so work starts without delay.',
              icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
            },
          ].map((card, i) => (
            <div key={i}
              className="text-left p-7 rounded-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(139,92,246,0.15)]"
              style={{
                background: 'rgba(18,18,42,0.7)',
                border: '1px solid rgba(100,80,180,0.25)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(100,80,180,0.25)'}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-violet-400 mb-4"
                style={{ background: 'rgba(139,92,246,0.15)' }}>
                {card.icon}
              </div>
              <h3 className="text-[1rem] font-bold text-white mb-2">{card.title}</h3>
              <p className="text-[0.82rem] text-white/70 leading-[1.6]">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}