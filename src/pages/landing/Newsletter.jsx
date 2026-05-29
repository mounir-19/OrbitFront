import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <section className="py-24" style={{ background: '#0f0f24' }}>
      <div className="max-w-[1200px] mx-auto px-6 text-center">

        <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-extrabold leading-[1.3] text-white mb-4">
          Stay ahead — be the first to know<br />about new services and opportunities
        </h2>

        <p className="text-[0.9rem] text-white/70 leading-[1.7] mb-10">
          Subscribe to Orbite and receive updates on new services,<br />
          project showcases, and exclusive offers straight to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="flex justify-center max-w-[480px] mx-auto flex-col sm:flex-row gap-3 sm:gap-0">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="flex-1 px-5 py-[14px] text-[0.9rem] text-white placeholder:text-white/50 focus:outline-none transition-all rounded-full sm:rounded-r-none"
            style={{
              background: 'rgba(30,30,60,0.8)',
              border: '1px solid rgba(100,80,180,0.3)',
            }}
            onFocus={e => e.target.style.borderColor = '#8b5cf6'}
            onBlur={e => e.target.style.borderColor = 'rgba(100,80,180,0.3)'}
          />
          <button
            type="submit"
            className="px-8 py-[14px] text-[0.9rem] font-semibold whitespace-nowrap cursor-pointer transition-all hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(255,255,255,0.15)] rounded-full sm:rounded-l-none"
            style={{
              background: subscribed ? '#8b5cf6' : '#ffffff',
              color: subscribed ? '#ffffff' : '#0a0a1a',
            }}
          >
            {subscribed ? '✓ Subscribed!' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
}