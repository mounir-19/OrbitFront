import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';


export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={{
                background: scrolled ? 'rgba(10,10,26,0.92)' : 'transparent',
                borderBottom: scrolled ? '1px solid rgba(100,80,180,0.15)' : '1px solid transparent',
                backdropFilter: scrolled ? 'blur(16px)' : 'none',
            }}
        >
            <div className="max-w-[1200px] mx-auto px-6 h-[70px] flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center">
                    <img src={logo} alt="Orbite" className="h-24 w-auto block -ml-3" />
                </Link>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-8">
                    {[
                        { label: 'Services', to: '/services' },
                        { label: 'How it works', to: '/how-it-works' },
                        { label: 'About', to: '/about' },
                        { label: 'Contact', to: '/contact' },
                    ].map(link => (
                        <Link
                            key={link.label}
                            to={link.to}
                            className="text-[0.875rem] font-medium text-white/70 transition-colors hover:text-white"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
                {/* CTA */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        to="/login"
                        className="text-[0.875rem] font-medium text-white/70 hover:text-white transition-colors px-4 py-2"
                    >
                        Sign in
                    </Link>
                    <Link
                        to="/register"
                        className="text-[0.875rem] font-semibold text-[#0a0a1a] px-5 py-2.5 rounded-xl transition-all"
                        style={{ background: '#ffffff' }}
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden flex flex-col gap-[5px] p-2"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                    <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                    <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div
                    className="md:hidden px-6 pb-6 flex flex-col gap-4"
                    style={{ background: 'rgba(10,10,26,0.97)', borderTop: '1px solid rgba(100,80,180,0.15)' }}
                >
                    {['Services', 'How it works', 'About', 'Contact'].map(link => (
                        <a key={link} href="#" className="text-[0.9rem] text-white/70 transition-colors py-1">
                            {link}
                        </a>
                    ))}
                    <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
                        <Link to="/login" className="text-[0.9rem] text-white/70 transition-colors py-1">Sign in</Link>
                        <Link to="/register" className="text-[0.9rem] font-semibold text-[#0a0a1a] bg-white px-5 py-3 rounded-xl text-center">
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}