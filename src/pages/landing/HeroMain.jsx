import { useState } from 'react';
import TermsModal from './TermsModal';
import { Link } from 'react-router-dom';

const stats = [
  { target: 30, suffix: 'K+', label: 'CLIENTS' },
  { target: 15, suffix: 'K+', label: 'PROJECTS' },
  { target: 100, suffix: '%', label: 'SATISFACTION' },
];

export default function HeroMain() {
  const [formData, setFormData] = useState({
    projectType: 'Web Development',
  });
  const [showTerms, setShowTerms] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">

      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay muted loop playsInline
          src="/bg.MOV"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,10,26,0.35) 0%, rgba(10,10,26,0.4) 40%, rgba(10,10,26,0.55) 70%, #0a0a1a 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-[60px] py-32 pt-36">

        {/* Left */}
        <div>
          <span
            className="inline-block px-6 py-2 rounded-full text-xs font-semibold tracking-[1.5px] uppercase text-white mb-7"
            style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.4)',
            }}
          >
            YOUR VISION, OUR EXECUTION
          </span>

          <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] font-extrabold leading-[1.15] mb-5 text-white">
            Your complete<br />digital agency
          </h1>

          <p className="text-[0.95rem] text-white/70 leading-[1.7] max-w-[480px] mb-10">
            From web development to design and video production — we deliver
            quality digital work, on time, with full expert oversight at every step.
          </p>

          {/* Stats */}
          <div className="flex gap-8 lg:gap-12 flex-wrap">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-[2.8rem] font-black text-white leading-none">
                  {s.target}<span>{s.suffix}</span>
                </span>
                <span className="text-[0.75rem] tracking-[2px] text-white/50 mt-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form card */}
        <div
          className="rounded-[20px] p-8 backdrop-blur-xl"
          style={{
            background: 'rgba(20,20,45,0.85)',
            border: '1px solid rgba(100,80,180,0.25)',
          }}
        >
          <h3 className="text-[1.3rem] font-bold text-center text-white mb-7">
            Start Your Project
          </h3>

          {/* Project Type */}
          <div className="mb-5">
            <label className="block text-[0.85rem] text-white/70 mb-2">
              Service
            </label>
            <div className="relative">
              <select
                value={formData.projectType}
                onChange={e => setFormData({ ...formData, projectType: e.target.value })}
                className="w-full px-4 py-[14px] rounded-xl text-[0.9rem] text-white appearance-none cursor-pointer transition-all focus:outline-none pr-10"
                style={{
                  background: 'rgba(30,30,60,0.8)',
                  border: '1px solid rgba(100,80,180,0.3)',
                }}
              >
                {['Web Development', 'Mobile Development', 'UI/UX Design', 'Data Science', 'Presentation', 'Voice Over', 'Social Media', 'Video Editing'].map(opt => (
                  <option key={opt} style={{ background: '#1e1e3c' }}>{opt}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-white/60" />
            </div>
          </div>


          <p className="text-center text-[0.72rem] tracking-[0.5px] text-white/50 my-5">
            A DETAILED QUOTE WILL BE SENT WITHIN{' '}
            <strong className="text-white">24–48 HOURS</strong>
          </p>

          <button onClick={() => setShowTerms(true)} className="block w-full text-center text-[0.82rem] text-white/70 mb-5 bg-transparent border-none cursor-pointer hover:text-violet-400 transition-colors">
            Terms and Conditions
          </button>

          <Link to="/register" className="block w-full py-4 bg-white text-[#0a0a1a] text-[1rem] font-semibold rounded-xl cursor-pointer text-center transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:bg-white/90">
            Get Started
          </Link>
        </div>
      </div>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </section>
  );
}