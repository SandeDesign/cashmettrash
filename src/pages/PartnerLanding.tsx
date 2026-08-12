import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Handshake, Wrench, Car, TrendingUp, Shield, CheckCircle, ArrowRight,
  X, Euro, Users, Zap, Package, CalendarCheck, Star, ChevronRight
} from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import Logo from '../components/shared/Logo';

const BOOKING_URL = 'https://agendi.sandedesign.nl/book/marc/vlottr';

const PartnerLanding: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (bookingOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [bookingOpen]);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        .font-mono-space { font-family: 'Space Mono', monospace; }
        .hero-gradient-partner { background: linear-gradient(135deg, #0a0a0a 0%, #0d1f0d 40%, #0a1a0a 70%, #0a0a0a 100%); }
        .price-glow { text-shadow: 0 0 40px rgba(34,197,94,0.4), 0 0 80px rgba(34,197,94,0.15); }
        .card-shine { background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.03) 100%); }
        .border-glow { border: 1px solid rgba(255,255,255,0.08); }
        .cta-pulse { animation: pulse-green 2s ease-in-out infinite; }
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4);} 50%{box-shadow:0 0 0 12px rgba(34,197,94,0);} }
        .fade-up { opacity:0; transform:translateY(40px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
        .fade-up.visible { opacity:1; transform:translateY(0); }
        .stagger-1{transition-delay:0.1s;} .stagger-2{transition-delay:0.2s;} .stagger-3{transition-delay:0.3s;} .stagger-4{transition-delay:0.4s;}
        .noise-bg { position:relative; }
        .noise-bg::before { content:''; position:absolute; inset:0; opacity:0.03; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events:none; }
        .scroll-indicator { animation: bounce 2s ease-in-out infinite; }
        @keyframes bounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(8px);} }
        .marquee { animation: marquee 24s linear infinite; }
        @keyframes marquee { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }
      `}</style>

      <PublicHeader />

      {/* ─── Booking overlay ─── */}
      {bookingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl border-glow" style={{ background: 'rgba(18,18,18,0.98)', height: '80vh' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="font-semibold text-white">Plan een kennismaking</span>
              <button onClick={() => setBookingOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe src={BOOKING_URL} className="w-full" style={{ height: 'calc(80vh - 57px)' }} title="Plan een kennismaking" />
          </div>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section className="hero-gradient-partner noise-bg relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://d3kjluh73b9h9o.cloudfront.net/optimized/4X/d/e/a/dea17f83ac87c9d631ebfe639b8796ccb1cdc40e_2_690x446.jpeg"
            alt="Partner worden"
            className="w-full h-full object-cover opacity-60"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/80 to-neutral-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Garages &amp; Handelaren</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none mb-6 tracking-tight">
              Jouw auto's aan het
              <br />
              <span className="text-green-400 price-glow">werk</span>, niet aan de kant.
            </h1>

            <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
              Vlottr neemt je stilstaande auto's over, verhuurt ze en brengt ze bij jou terug voor onderhoud. Jij verdient aan <span className="text-white font-semibold">twee kanten</span> — zonder extra werk.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                to="/partner-registreren"
                className="cta-pulse bg-green-500 text-neutral-950 px-8 py-4 rounded-xl text-lg font-bold hover:bg-green-400 transition-all inline-flex items-center justify-center gap-2 hover:gap-3"
              >
                <CalendarCheck className="w-5 h-5" />
                Direct aanmelden <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#het-model"
                className="border border-neutral-700 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/5 transition-all inline-flex items-center justify-center gap-2"
              >
                Hoe werkt het?
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-lg">
              {[
                { value: '8–9', label: 'mnd terugverdientijd' },
                { value: '2×', label: 'verdienmodel' },
                { value: '€0', label: 'extra werk voor jou' },
              ].map((stat, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono-space">{stat.value}</div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator">
          <div className="w-6 h-10 border-2 border-neutral-600 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-green-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* ═══ HET MODEL ═══ */}
      <section id="het-model" className="py-24 sm:py-32 noise-bg relative" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('het-model') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Het model</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Zo werkt het</h2>
            <p className="text-neutral-400 text-lg mb-16 max-w-3xl leading-relaxed">
              Vlottr neemt jouw auto over en verhuurt hem aan mensen die betaalbare mobiliteit nodig hebben. De huuropbrengsten dekken aanschaf, onderhoud en verzekering. Na circa <span className="text-white font-semibold">8 tot 9 maanden verhuur</span> zijn alle kosten terugverdiend — daarna stijgt de marge elke maand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: <Car className="w-6 h-6" />, title: 'Auto inbrengen', desc: 'Jij brengt de auto in — of wij halen hem op. Wij nemen alles over: verzekering, administratie, klantcontact.' },
              { step: '02', icon: <Users className="w-6 h-6" />, title: 'Vlottr verhuurt', desc: 'Wij zetten de auto aan het werk. Elke week verhuur genereert inkomsten die jouw inkoopprijs terugbetalen.' },
              { step: '03', icon: <Wrench className="w-6 h-6" />, title: 'Onderhoud bij jou', desc: 'Alle service en onderhoud aan jouw ingebrachte auto gaat terug naar jouw garage. Zo verdien je twee keer.' },
            ].map((item, i) => (
              <div
                key={i}
                id={`model-stap-${i}`}
                data-animate
                className={`fade-up stagger-${i + 1} ${isVisible(`model-stap-${i}`) ? 'visible' : ''} card-shine border-glow rounded-2xl p-8 relative overflow-hidden group hover:border-green-500/20 transition-all duration-500`}
              >
                <span className="absolute top-6 right-6 text-6xl font-black text-white/[0.03] font-mono-space">{item.step}</span>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-6 group-hover:bg-green-500/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VOOR WIE ═══ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" id="voor-wie" data-animate>
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-green-950/10 to-neutral-950" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('voor-wie') ? 'visible' : ''} text-center mb-16`}>
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Partners</span>
              <div className="h-px w-12 bg-green-500" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Voor wie is dit?</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Iedereen met auto's die niet optimaal benut worden.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Handelaren */}
            <div className={`fade-up stagger-1 ${isVisible('voor-wie') ? 'visible' : ''} relative rounded-3xl p-8 sm:p-10 card-shine border-glow hover:border-green-500/20 transition-all duration-500`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neutral-600 to-transparent rounded-t-3xl" />
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-6">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider font-mono-space mb-3">Autohandelaren</h3>
              <p className="text-2xl font-black mb-6">Stop met wachten<br />op een koper</p>
              <p className="text-neutral-400 mb-8 leading-relaxed">
                Elke dag dat een auto op je terrein staat kost geld. Vlottr neemt de auto over en betaalt de inkoopprijs af via verhuurinkomsten. Jij haalt kapitaal uit je vloot — nu.
              </p>
              <ul className="space-y-3">
                {[
                  'Inkoop + marge terugverdiend via verhuurstroom',
                  'Geen stilstand meer op je terrein',
                  'Flexibel: auto terugkopen zodra je een koper hebt',
                  'Wij regelen administratie, verzekering en klantcontact',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Garages */}
            <div
              className={`fade-up stagger-2 ${isVisible('voor-wie') ? 'visible' : ''} relative rounded-3xl p-8 sm:p-10 overflow-hidden`}
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-t-3xl" />
              <div className="absolute top-6 right-6">
                <span className="bg-green-500 text-neutral-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono-space">Populair</span>
              </div>
              <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-6">
                <Wrench className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider font-mono-space mb-3">Autogarages</h3>
              <p className="text-2xl font-black mb-6">Vaste stroom opdrachten<br />zonder acquisitie</p>
              <p className="text-neutral-400 mb-8 leading-relaxed">
                Vlottr brengt de vloot bij jou voor al het onderhoud. Geen losse klanten binnenhalen — gewoon vaste, geplande opdrachten van een groeiende vloot die altijd bij jou terugkomt.
              </p>
              <ul className="space-y-3">
                {[
                  'Vaste onderhoudsstroom van een groeiende vloot',
                  'Gegarandeerde, voorspelbare inkomsten',
                  'Geen wisselende losse klanten, betrouwbare B2B-partner',
                  'Vloot groeit → meer opdrachten voor jouw garage',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Double benefit */}
          <div
            id="double"
            data-animate
            className={`fade-up ${isVisible('double') ? 'visible' : ''} mt-8 max-w-5xl mx-auto card-shine border-glow rounded-2xl p-8 sm:p-10 text-center hover:border-green-500/20 transition-all`}
          >
            <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mx-auto mb-4">
              <TrendingUp className="w-7 h-7" />
            </div>
            <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Dubbel voordeel</span>
            <h3 className="text-2xl sm:text-3xl font-black mt-2 mb-4">Garage én handelaar?</h3>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-2xl mx-auto">
              Dan sla je een dubbel slaatje. Vlottr koopt je auto's in via het verhuurmodel <em className="text-white not-italic font-semibold">én</em> brengt ze terug naar jouw werkplaats voor onderhoud. Je verdient aan de verkoop én aan elke servicebeurt — van dezelfde auto, bij jou om de hoek.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ TERUGVERDIENTIJDLIJN ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="tijdlijn" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('tijdlijn') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Terugverdientijd</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Transparant en voorspelbaar</h2>
            <p className="text-neutral-400 text-lg mb-16 max-w-xl">Vanaf dag één weet je wat je kunt verwachten.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { maand: 'Maand 1–3', step: '01', label: 'Opstartfase', desc: 'Auto gaat de verhuurrotatie in, eerste inkomsten komen binnen', color: 'border-neutral-700' },
              { maand: 'Maand 4–7', step: '02', label: 'Kostendekkend', desc: 'Onderhoud en verzekering zijn gedekt vanuit de verhuurstroom', color: 'border-yellow-700/50' },
              { maand: 'Maand 8–9', step: '03', label: 'Inkoop eruit', desc: 'Inkoopprijs volledig terugverdiend via de maandelijkse verhuur', color: 'border-green-600/50' },
              { maand: 'Maand 9+', step: '04', label: 'Pure winst', desc: 'Elke verhuurde dag daarna is netto marge — en die klimt', color: 'border-green-400' },
            ].map((item, i) => (
              <div
                key={i}
                id={`tj-${i}`}
                data-animate
                className={`fade-up stagger-${(i % 4) + 1} ${isVisible(`tj-${i}`) ? 'visible' : ''} card-shine ${item.color} border rounded-2xl p-6 text-center relative overflow-hidden`}
              >
                <span className="absolute top-3 right-4 text-5xl font-black text-white/[0.03] font-mono-space">{item.step}</span>
                <div className="text-xs font-semibold text-green-400 mb-2 font-mono-space uppercase tracking-wider">{item.maand}</div>
                <div className="text-lg font-bold text-white mb-3">{item.label}</div>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VOORDELEN GRID ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="voordelen" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('voordelen') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Voordelen</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-16 tracking-tight">Wat haal jij eruit?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Euro className="w-6 h-6" />, title: 'Geen stilstand = geen verlies', desc: 'Stilstaande auto\'s kosten geld. Via Vlottr worden ze een inkomstenbron.' },
              { icon: <Shield className="w-6 h-6" />, title: 'Wij regelen alles', desc: 'Verzekering, klantcontact, schadeafhandeling — onze taak, niet de jouwe.' },
              { icon: <Users className="w-6 h-6" />, title: 'Betaalbare mobiliteit', desc: 'Jouw auto helpt mensen met een klein budget betrouwbaar te rijden.' },
              { icon: <Package className="w-6 h-6" />, title: 'Voorspelbaar onderhoud', desc: 'Vaste onderhoudsintervallen, geplande afspraken. Geen verrassingen.' },
              { icon: <TrendingUp className="w-6 h-6" />, title: 'Groeiend model', desc: 'Hoe meer auto\'s in de vloot, hoe meer zekerheid voor jou als partner.' },
              { icon: <Zap className="w-6 h-6" />, title: 'Snel van start', desc: 'Registratie duurt 5 minuten. Onboarding regelen wij in een kennismaking.' },
            ].map((b, i) => (
              <div
                key={i}
                id={`vd-${i}`}
                data-animate
                className={`fade-up stagger-${(i % 4) + 1} ${isVisible(`vd-${i}`) ? 'visible' : ''} group p-6 rounded-2xl border-glow card-shine hover:border-green-500/20 transition-all duration-500`}
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-5 group-hover:bg-green-500/20 transition-colors">
                  {b.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <section className="py-12 border-y border-white/5 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className="marquee flex items-center gap-8">
            {[...Array(2)].map((_, setIndex) => (
              <React.Fragment key={setIndex}>
                {[
                  '⭐ "Auto stond te roesten, nu verdient hij geld"',
                  '⭐ "Eindelijk een partner die meedenkt"',
                  '⭐ "Werkplaats zit vol dankzij Vlottr"',
                  '⭐ "Handelaar én garage — twee keer raak"',
                  '⭐ "Geen acquisitie meer, gewoon opdrachten"',
                  '⭐ "Eenvoudig, eerlijk en winstgevend"',
                ].map((text, i) => (
                  <span key={`${setIndex}-${i}`} className="text-neutral-600 text-sm font-medium mx-4">{text}</span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="faq" data-animate>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('faq') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">FAQ</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-12 tracking-tight">Veelgestelde vragen</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'Hoe weet ik zeker dat ik mijn inkoopprijs terugkrijg?', a: 'We leggen dit contractueel vast. De verhuurinkomsten worden transparant verdeeld. Na 8–9 maanden is de inkoopprijs terugverdiend, daarna is elke week winst.' },
              { q: 'Wat als de auto schade oploopt?', a: 'Alle auto\'s in onze vloot zijn volledig verzekerd. Bij schade regelen wij de afhandeling en het herstel. Dat is niet jouw kopzorg.' },
              { q: 'Kan ik de auto terugkopen als ik een koper vind?', a: 'Ja. We spreken een regeling af waarbij je de auto kunt terugkopen. Flexibiliteit voor de handelaar staat centraal.' },
              { q: 'Hoe weet ik dat het onderhoud altijd bij mij terechtkomt?', a: 'We leggen dit vast in de partnerovereenkomst. Jij bent de vaste onderhoudspartner voor de auto\'s die jij inbrengt.' },
              { q: 'Hoeveel auto\'s kan ik inbrengen?', a: 'Dat bespreken we in de kennismaking. Er is geen minimum of maximum — het hangt af van jouw situatie en onze vlootcapaciteit.' },
              { q: 'Wat kost het om partner te worden?', a: 'Niets. Aansluiten bij Vlottr is gratis. Jij verdient via de verhuurinkomsten en onderhoudsafspraken.' },
            ].map((item, i) => (
              <details
                key={i}
                className={`fade-up stagger-${(i % 4) + 1} ${isVisible('faq') ? 'visible' : ''} group border-glow rounded-xl overflow-hidden`}
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-white/[0.02] transition-colors list-none">
                  <span className="font-semibold text-white pr-4">{item.q}</span>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6 text-neutral-400 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" id="cta" data-animate>
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/20 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 opacity-10">
          <img src="https://www.aristocracy.london/wp-content/uploads/2019/08/the-81-rules-of-handshake-etiquette.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`fade-up ${isVisible('cta') ? 'visible' : ''}`}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight">
              Klinkt dit als iets voor jou?
              <br />
              <span className="text-green-400">Meld je direct aan.</span>
            </h2>
            <p className="text-neutral-400 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
              Vrijblijvend. Maak een account aan en we nemen contact op.
            </p>
            <Link
              to="/partner-registreren"
              className="cta-pulse inline-flex items-center gap-3 bg-green-500 text-neutral-950 px-10 py-5 rounded-xl text-xl font-bold hover:bg-green-400 transition-all hover:scale-105"
            >
              <CalendarCheck className="w-6 h-6" />
              Partner worden <ArrowRight className="w-6 h-6" />
            </Link>
            <p className="text-neutral-600 text-sm mt-6">Geen verplichtingen. Gratis aanmelden. Samen kijken wat er mogelijk is.</p>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo variant="glow" size="sm" />
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <Link to="/terms" className="hover:text-white transition-colors">Algemene Voorwaarden</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacybeleid</Link>
            </div>
            <div className="text-sm text-neutral-600">© {new Date().getFullYear()} Vlottr · Zuid-Limburg</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PartnerLanding;
