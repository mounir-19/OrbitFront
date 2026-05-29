import logo from '../../assets/logo.png';

export default function Footer() {
  return (
    <footer className="py-16 pb-10" style={{ background: '#0a0a1a', borderTop: '1px solid rgba(100,80,180,0.15)' }}>
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 lg:gap-16">

        {/* Brand */}
        <div>
          <img src={logo} alt="Orbite Logo" className="h-24 w-auto block -ml-4 -mt-6 -mb-3" />
          <p className="text-[0.82rem] text-white/70 leading-[1.7]">
            Orbite delivers expert quality digital services from web development
            to design and media production with full transparency at every step.
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              title: 'Company',
              links: ['About Us', 'Our Team', 'Careers', 'Contact', 'Book a Demo'],
            },
            {
              title: 'Services',
              links: ['Web Development', 'Mobile Development', 'UI/UX Design', 'Video Editing', 'Social Media'],
            },
            {
              title: 'Legal',
              links: ['Terms & Conditions', 'Privacy Policy', 'Cookie Policy'],
            },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-[0.9rem] font-bold text-white mb-5">{col.title}</h4>
              <ul className="space-y-[10px]">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#"
                      className="text-[0.82rem] text-white/70 transition-colors hover:text-violet-400">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1200px] mx-auto px-6 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-center"
        style={{ borderTop: '1px solid rgba(100,80,180,0.1)' }}>
        <p className="text-[0.78rem] text-white/40">
          © {new Date().getFullYear()} Orbite. All rights reserved.
        </p>
      </div>
    </footer>
  );
}