export default function Contact() {
    return (
        <section className="py-24" style={{ background: '#0a0a1a', borderTop: '1px solid rgba(100,80,180,0.1)' }}>
            <div className="max-w-[1200px] mx-auto px-6">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left */}
                    <div>
                        <span className="inline-block px-6 py-2 rounded-full text-xs font-semibold tracking-[1.5px] uppercase text-violet-400 mb-7"
                            style={{ border: '1px solid rgba(139,92,246,0.4)' }}>
                            CONTACT
                        </span>
                        <h2 className="text-[clamp(2rem,4.5vw,3.2rem)] font-bold text-white leading-[1.15] mb-5"
                            style={{ letterSpacing: '-0.02em' }}>
                            Build it right,<br />or don't build it.
                        </h2>
                        <p className="text-[0.95rem] text-white/50 leading-[1.8] max-w-[420px]" style={{ fontWeight: 300 }}>
                            Have a question or ready to get started? Reach out — we'll get back to you within 24 hours.
                        </p>

                        {/* Contact details */}
                        <div className="mt-10 flex flex-col gap-5">
                            {/* Email */}
                            <a href="mailto:contact@orbite.dz"
                                className="flex items-center gap-4 group"
                                style={{ textDecoration: 'none' }}>
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#8b5cf6' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[0.7rem] tracking-[2px] uppercase text-white/25 mb-0.5">Email</p>
                                    <p className="text-[0.9rem] text-white/70 group-hover:text-violet-400 transition-colors">contact@orbite.dz</p>
                                </div>
                            </a>

                            {/* Phone */}
                            <a href="tel:+213555000000"
                                className="flex items-center gap-4 group"
                                style={{ textDecoration: 'none' }}>
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#8b5cf6' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.89a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[0.7rem] tracking-[2px] uppercase text-white/25 mb-0.5">Phone</p>
                                    <p className="text-[0.9rem] text-white/70 group-hover:text-violet-400 transition-colors">+213 555 000 000</p>
                                </div>
                            </a>

                            {/* Location */}
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#8b5cf6' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[0.7rem] tracking-[2px] uppercase text-white/25 mb-0.5">Location</p>
                                    <p className="text-[0.9rem] text-white/70">Mostaganem, Algeria</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right — Map */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(100,80,180,0.2)', height: '380px' }}>
                        <iframe
                            title="Orbite location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d51673.44!2d0.0871!3d35.9313!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128e61c83748b5a9%3A0x400a01269bf5e30!2sMostaganem%2C%20Algeria!5e0!3m2!1sen!2sdz!4v1"
                            width="100%"
                            height="100%"
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) saturate(0.8) brightness(0.85)' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}