import Navbar from './Navbar';
import HeroMain from './HeroMain';
import DomainsBar from './DomainsBar';
import HeroTop from './HeroTop';
import WhyUs from './WhyUs';
import Contact from './Contact';
import Newsletter from './Newsletter';
import Footer from './Footer';

export default function LandingPage() {
  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh' }}>
      <Navbar />
      <HeroMain />
      <DomainsBar />
      <HeroTop />
      <WhyUs />
      <Contact />
      <Newsletter />
      <Footer />
    </div>
  );
}