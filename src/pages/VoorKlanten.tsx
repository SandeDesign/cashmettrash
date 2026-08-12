import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, Euro, Shield, Clock, CheckCircle, ArrowRight, Smartphone,
  Star, Zap, MapPin, FileText, HeartHandshake, ChevronRight, Wallet, PhoneCall
} from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import Logo from '../components/shared/Logo';

const VoorKlanten: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

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

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        .font-mono-space { font-family: 'Space Mono', monospace; }
        .hero-gradient-klanten { background: linear-gradient(135deg, #0a0a0a 0%, #0a0a1a 40%, #0a1020 70%, #0a0a0a 100%); }
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

      {/* ═══ HERO ═══ */}
      <section className="hero-gradient-klanten noise-bg relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80"
            alt="Rijden met Vlottr"
            className="w-full h-full object-cover opacity-20"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/80 to-neutral-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Voor huurders</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none mb-6 tracking-tight">
              Gewoon een auto.
              <br />
              Zonder gedoe.
              <br />
              <span className="text-green-400 price-glow">Betaalbaar.</span>
            </h1>

            <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
              Geen BKR-toets, geen hoge aanbetaling, geen lange wachttijd. Vlottr biedt betrouwbaar vervoer voor mensen die <span className="text-white font-semibold">gewoon een auto nodig hebben</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                to="/registreren"
                className="cta-pulse bg-green-500 text-neutral-950 px-8 py-4 rounded-xl text-lg font-bold hover:bg-green-400 transition-all inline-flex items-center justify-center gap-2 hover:gap-3"
              >
                Ik wil rijden <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#hoe-werkt-het"
                className="border border-neutral-700 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/5 transition-all inline-flex items-center justify-center gap-2"
              >
                Hoe werkt het?
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-lg">
              {[
                { value: '€105', label: 'per week' },
                { value: '€0', label: 'BKR-toets' },
                { value: '4 wk', label: 'minimaal' },
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

      {/* ═══ CONTEXT ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="context" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('context') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Waarom Vlottr</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Niet iedereen kan<br />zomaar een auto kopen</h2>
            <p className="text-neutral-400 text-lg max-w-3xl leading-relaxed mb-6">
              Een eigen auto kopen vraagt om spaargeld, een lening of een sterke krediethistorie. Voor veel mensen is dat geen optie. Toch is een auto geen luxe — het is noodzakelijk vervoer voor werk, school en dagelijks leven.
            </p>
            <p className="text-neutral-400 text-lg max-w-3xl leading-relaxed">
              Vlottr overbrugt die kloof. Ons collectief van garages en handelaren stelt auto's beschikbaar die anders stil zouden staan — jij rijdt er betaalbaar in, wekelijks opzegbaar, alles inbegrepen.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ WAT IS INBEGREPEN ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="inbegrepen" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('inbegrepen') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Alles inbegrepen</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Wat is inbegrepen?</h2>
            <p className="text-neutral-400 text-lg mb-16 max-w-xl">Alles wat je nodig hebt. Niets dat je niet wil.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Euro className="w-6 h-6" />, title: 'Vaste wekelijkse prijs', desc: 'Je betaalt per week. Geen verborgen kosten, geen verrassingen achteraf. Wat je ziet is wat je betaalt.' },
              { icon: <Shield className="w-6 h-6" />, title: 'Verzekering inbegrepen', desc: 'Elke auto is volledig WA+ of allrisk verzekerd. Jij rijdt gedekt, zonder extra polis af te sluiten.' },
              { icon: <Zap className="w-6 h-6" />, title: 'Onderhoud & APK', desc: 'Alle auto\'s zijn APK-gekeurd en worden onderhouden door onze garages. Jij rijdt altijd in een goede auto.' },
              { icon: <MapPin className="w-6 h-6" />, title: 'Pechhulp geregeld', desc: 'Pech onderweg? We zorgen dat je niet langs de weg staat. Hulp is geregeld — altijd.' },
              { icon: <FileText className="w-6 h-6" />, title: 'Geen BKR of aanbetaling', desc: 'Geen kredietcheck, geen grote som vooraf. Gewoon aanmelden, goedgekeurd worden en rijden.' },
              { icon: <Clock className="w-6 h-6" />, title: 'Wekelijks opzegbaar', desc: 'Geen lange contracten. Heb je de auto niet meer nodig? Zeg een week van tevoren op. Klaar.' },
            ].map((v, i) => (
              <div
                key={i}
                id={`inb-${i}`}
                data-animate
                className={`fade-up stagger-${(i % 4) + 1} ${isVisible(`inb-${i}`) ? 'visible' : ''} group p-6 rounded-2xl border-glow card-shine hover:border-green-500/20 transition-all duration-500`}
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-5 group-hover:bg-green-500/20 transition-colors">
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOE WERKT HET ═══ */}
      <section className="py-24 sm:py-32 noise-bg relative" id="hoe-werkt-het" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('hoe-werkt-het') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Simpel</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">In 4 stappen rij jij</h2>
            <p className="text-neutral-400 text-lg mb-16 max-w-xl">Geen gedoe met papierwerk of ingewikkelde voorwaarden.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: <Smartphone className="w-6 h-6" />, title: 'Aanmelden', desc: 'Maak een gratis account aan. Geen BKR, geen gedoe. 5 minuten werk.' },
              { step: '02', icon: <FileText className="w-6 h-6" />, title: 'Verificatie', desc: 'We controleren je rijbewijs en identiteit. Snel en discreet — klaar binnen 1 werkdag.' },
              { step: '03', icon: <Car className="w-6 h-6" />, title: 'Kies een auto', desc: 'Bekijk het beschikbare aanbod en kies wat bij jou past op prijs en type.' },
              { step: '04', icon: <Star className="w-6 h-6" />, title: 'Rijd!', desc: 'Contract getekend, sleutels in de hand. Wekelijks betalen, de rest doen wij.' },
            ].map((item, i) => (
              <div
                key={i}
                id={`stap-${i}`}
                data-animate
                className={`fade-up stagger-${i + 1} ${isVisible(`stap-${i}`) ? 'visible' : ''} card-shine border-glow rounded-2xl p-8 relative overflow-hidden group hover:border-green-500/20 transition-all duration-500`}
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

          <div className={`fade-up ${isVisible('hoe-werkt-het') ? 'visible' : ''} mt-10 text-center`}>
            <Link
              to="/hoe-het-werkt"
              className="group inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold transition-colors text-lg"
            >
              Lees de volledige uitleg
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ PRIJZEN ═══ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" id="prijzen" data-animate>
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-green-950/10 to-neutral-950" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('prijzen') ? 'visible' : ''} text-center mb-16`}>
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Prijzen</span>
              <div className="h-px w-12 bg-green-500" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Eerlijk. Scherp. Klaar.</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Wat je ziet is wat je betaalt. Geen boekingskosten, geen servicekosten, geen onzin.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className={`fade-up stagger-1 ${isVisible('prijzen') ? 'visible' : ''} card-shine border-glow rounded-3xl p-8 sm:p-10 relative`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neutral-600 to-transparent rounded-t-3xl" />
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider font-mono-space mb-6">Basis</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-black font-mono-space">€140</span>
                <span className="text-neutral-500 text-lg">/week</span>
              </div>
              <p className="text-neutral-500 mb-8">= €20 per dag, all-in</p>
              <ul className="space-y-4 mb-10">
                {['Minimaal 4 weken huren', 'Per week betalen', 'Eerste week vooruit', '€250 borg (krijg je terug)', 'Verzekering inbegrepen', 'Pechhulp inbegrepen'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/registreren" className="w-full block text-center border border-neutral-700 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-white/5 transition-all">
                Kies basis
              </Link>
            </div>

            <div
              className={`fade-up stagger-2 ${isVisible('prijzen') ? 'visible' : ''} relative rounded-3xl p-8 sm:p-10 overflow-hidden`}
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-t-3xl" />
              <div className="absolute top-6 right-6">
                <span className="bg-green-500 text-neutral-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono-space">Populair</span>
              </div>
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider font-mono-space mb-6">Vooruit Planner</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-black font-mono-space text-green-400">€105</span>
                <span className="text-neutral-500 text-lg">/week</span>
              </div>
              <p className="text-neutral-500 mb-8">= €15 per dag, <span className="text-green-400 font-semibold">GEEN borg!</span></p>
              <ul className="space-y-4 mb-10">
                {['Minimaal 6 maanden huren', 'Per week betalen', 'Eerste week bij aanmelding', 'GEEN borg bij 6 mnd vooruit plannen', 'Verzekering inbegrepen', 'Pechhulp inbegrepen', 'Voorrang bij beschikbaarheid'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/registreren" className="cta-pulse w-full block text-center bg-green-500 text-neutral-950 px-6 py-3.5 rounded-xl font-bold hover:bg-green-400 transition-all">
                Plan vooruit & bespaar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VOOR WIE ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="voor-wie" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('voor-wie') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Voor wie</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Herken jij jezelf?</h2>
            <p className="text-neutral-400 text-lg mb-16 max-w-xl">Vlottr is er voor mensen die tussen wal en schip vallen.</p>
          </div>

          <div className="space-y-4 max-w-3xl">
            {[
              'Je hebt werk gevonden maar nog geen auto — en zonder auto geen werk',
              'Je rijdt nu met een onbetrouwbare auto en wil iets beters zonder grote aankoop',
              'Je eigen auto staat in de garage en je hebt tijdelijk vervoer nodig',
              'Je wil weten hoe het voelt om in een auto te rijden voor je hem koopt',
              'Je inkomen is wisselend en je wil geen vaste financieringslasten',
              'Je hebt een second chance nodig en vindt overal gesloten deuren',
            ].map((item, i) => (
              <div
                key={i}
                id={`wie-${i}`}
                data-animate
                className={`fade-up stagger-${(i % 3) + 1} ${isVisible(`wie-${i}`) ? 'visible' : ''} flex items-center gap-4 card-shine border-glow rounded-xl px-6 py-5 hover:border-green-500/20 transition-all`}
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-neutral-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WAAROM VLOTTR ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="waarom" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('waarom') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Voordelen</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-16 tracking-tight">Waarom Vlottr dé keuze is</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Wallet className="w-6 h-6" />, title: 'Spotgoedkoop', desc: 'Vanaf €15 per dag. Dat is minder dan een dagkaart voor het OV. Serieus.' },
              { icon: <Shield className="w-6 h-6" />, title: 'Alles inbegrepen', desc: 'Verzekering, pechhulp, wegenbelasting — het zit er allemaal bij in. Nul verrassingen.' },
              { icon: <Clock className="w-6 h-6" />, title: 'Per week betalen', desc: 'Geen grote bedragen in één keer. Elke week een vast, laag bedrag. Lekker overzichtelijk.' },
              { icon: <MapPin className="w-6 h-6" />, title: 'Regio Zuid-Limburg', desc: 'Ophalen en terugbrengen in de buurt. Geen gedoe met ver reizen voor je auto.' },
              { icon: <Star className="w-6 h-6" />, title: 'Geen kleine lettertjes', desc: 'Wij doen niet aan verborgen kosten of ingewikkelde contracten. Punt.' },
              { icon: <PhoneCall className="w-6 h-6" />, title: 'Persoonlijk contact', desc: 'Geen callcenter. Gewoon even bellen of appen als er iets is. Wij zijn er voor je.' },
            ].map((item, i) => (
              <div
                key={i}
                id={`wr-${i}`}
                data-animate
                className={`fade-up stagger-${(i % 4) + 1} ${isVisible(`wr-${i}`) ? 'visible' : ''} group p-6 rounded-2xl border-glow card-shine hover:border-green-500/20 transition-all duration-500`}
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-5 group-hover:bg-green-500/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">{item.desc}</p>
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
                  '⭐ "Eindelijk betaalbaar een auto huren!"',
                  '⭐ "Geen gedoe, gewoon rijden"',
                  '⭐ "Beste deal in Limburg"',
                  '⭐ "Super service, eerlijke prijs"',
                  '⭐ "Nooit meer OV voor mij"',
                  '⭐ "Aanrader voor iedereen"',
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
              { q: 'Hoe lang moet ik minimaal huren?', a: 'Minimaal 4 weken. Hoe langer je huurt, hoe voordeliger het wordt. Plan je 6 maanden vooruit? Dan betaal je geen borg!' },
              { q: 'Hoeveel borg betaal ik?', a: 'Bij standaard huur betaal je €250 borg, die je terugkrijgt als je de auto netjes inlevert. Plan je 6 maanden vooruit? Dan is de borg €0.' },
              { q: 'Is er een BKR-toets?', a: 'Nee. Wij doen geen BKR-toets. We controleren wel je identiteit en rijbewijs, maar je financiële verleden speelt geen rol.' },
              { q: 'Zit verzekering erbij?', a: 'Ja! Alle auto\'s zijn volledig verzekerd. Pechhulp zit er ook bij. Je hoeft nergens extra voor te betalen.' },
              { q: 'Kan ik tussentijds opzeggen?', a: 'Ja, mits je een week van tevoren opzegt. Er zijn geen opzegboetes. Heb je de auto niet meer nodig? Dan stop je gewoon.' },
              { q: 'Waar kan ik de auto ophalen?', a: 'In de regio Zuid-Limburg. De exacte locatie krijg je na aanmelding. Makkelijk bereikbaar en vlakbij.' },
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
          <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`fade-up ${isVisible('cta') ? 'visible' : ''}`}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight">
              Stoppen met geen auto hebben.
              <br />
              <span className="text-green-400">Begin met Vlottr.</span>
            </h2>
            <p className="text-neutral-400 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
              Meld je aan, kies je auto, betaal de eerste week en ga rijden. Zo simpel is het.
            </p>
            <Link
              to="/registreren"
              className="cta-pulse inline-flex items-center gap-3 bg-green-500 text-neutral-950 px-10 py-5 rounded-xl text-xl font-bold hover:bg-green-400 transition-all hover:scale-105"
            >
              Nu aanmelden <ArrowRight className="w-6 h-6" />
            </Link>
            <p className="text-neutral-600 text-sm mt-6">Geen verplichtingen. Gratis aanmelden. Direct beschikbaar.</p>
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
              <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
            <div className="text-sm text-neutral-600">© {new Date().getFullYear()} Vlottr · Zuid-Limburg</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VoorKlanten;
