import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Car, ChevronRight, ArrowRight, Zap, CreditCard, Shield, Clock,
  CheckCircle2, UserPlus, FileCheck, Key, MessageSquare, Eye,
  AlertTriangle, Camera, Wallet, LayoutDashboard, FileText,
  Gauge, MapPin, Phone, HelpCircle, XCircle, Hourglass, Lock,
  CalendarCheck
} from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import Logo from '../components/shared/Logo';

const HandleidingKlant: React.FC = () => {
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
      { threshold: 0.12 }
    );
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  const onboardingSteps = [
    {
      stap: '01',
      icon: UserPlus,
      title: 'Account aanmaken',
      desc: 'Je maakt een gratis account aan met je naam, e-mailadres en wachtwoord. Geen BKR-toets, geen verborgen kosten.',
    },
    {
      stap: '02',
      icon: FileCheck,
      title: 'Onboarding voltooien',
      desc: 'Je vult je persoonlijke gegevens aan: adres, telefoonnummer, rijbewijs uploaden en identiteitsbewijs.',
    },
    {
      stap: '03',
      icon: Hourglass,
      title: 'Wachten op verificatie',
      desc: 'Een admin of manager beoordeelt je gegevens en rijbewijs. Je wordt per e-mail of in de app op de hoogte gehouden.',
    },
    {
      stap: '04',
      icon: CheckCircle2,
      title: 'Goedgekeurd & rijden',
      desc: 'Na goedkeuring heb je volledige toegang. Je kunt auto\'s bekijken, boeken, contracten ondertekenen en rijden.',
    },
  ];

  const statusInfo = [
    {
      status: 'In afwachting (Pending)',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      icon: Hourglass,
      canDo: [
        'Auto\'s bekijken en door het aanbod bladeren',
        'Een boeking starten (maar niet voltooien)',
        'Je profiel bekijken',
        'De boekingspagina\'s bezoeken',
      ],
      cantDo: [
        'Boekingen definitief plaatsen',
        'Dashboard openen',
        'Contracten bekijken of ondertekenen',
        'Chat gebruiken',
        'Garage of SOS-pagina openen',
      ],
    },
    {
      status: 'Goedgekeurd (Approved)',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      icon: CheckCircle2,
      canDo: [
        'Alle functies gebruiken — geen beperkingen',
        'Auto\'s boeken, betalingen doen, contracten tekenen',
        'Dashboard, Garage, SOS, Chat en alles ertussenin',
      ],
      cantDo: [],
    },
    {
      status: 'Afgewezen (Rejected)',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      icon: XCircle,
      canDo: [],
      cantDo: [
        'Geen enkele functie is toegankelijk',
        'Volledig geblokkeerd uit het systeem',
        'Neem contact op met support voor meer informatie',
      ],
    },
  ];

  const capabilities = [
    {
      icon: Car,
      title: 'Auto\'s & Boeken',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      items: [
        'Beschikbare auto\'s bekijken en door het aanbod bladeren',
        'Auto\'s filteren op merk, type en weekprijs',
        'Boekingen aanmaken (minimaal 4 weken huurperiode)',
        'Meerdere auto\'s tegelijk boeken als meerdere beschikbaar zijn',
        'Eigen boekingen en huurgeschiedenis inzien',
        'Boekingsstatus volgen (pending, betaald, bevestigd, actief, etc.)',
      ],
    },
    {
      icon: CreditCard,
      title: 'Betalingen',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      items: [
        'Wekelijkse huurbetalingen via Stripe (creditcard/debitcard)',
        'Borgbetaling doen bij aanvang van de huur',
        'Bezorgkosten betalen als de auto wordt bezorgd',
        'Betalingsbevestiging ontvangen na succesvolle betaling',
        'Betalingsstatus van eigen boekingen bekijken',
      ],
    },
    {
      icon: FileText,
      title: 'Contracten',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      items: [
        'Huurcontracten digitaal ondertekenen',
        'Contractdocumenten inzien en downloaden',
        'Contractstatus volgen (pending, ondertekend, afgerond)',
        'Contractvoorwaarden bekijken voor ondertekening',
      ],
    },
    {
      icon: Camera,
      title: 'Inspecties bij Ophalen',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      items: [
        'Inspectieformulier invullen aan klant-zijde bij ophalen',
        'Foto\'s van de auto uploaden bij ophalen',
        'Bestaande schades documenteren ter eigen bescherming',
        'Kilometerstand vastleggen',
      ],
    },
    {
      icon: LayoutDashboard,
      title: 'Dashboard & Profiel',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      items: [
        'Persoonlijk dashboard met overzicht van boekingen',
        'Prestatiecijfers bekijken: dagen gehuurd, kilometers gereden, besparingen',
        'Profiel bekijken en persoonlijke gegevens bijwerken',
        'Meldingen ontvangen over boekingen en verificatie',
      ],
    },
    {
      icon: MessageSquare,
      title: 'Communicatie & Support',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      items: [
        'Live chat met admin of manager via de ingebouwde chat',
        'Vragen stellen over boekingen, betalingen of contracten',
        'SOS-pagina voor noodgevallen en dringende hulp',
        'E-mail updates ontvangen over verificatie en boekingsstatus',
      ],
    },
    {
      icon: Car,
      title: 'Garage',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      items: [
        'Je huidige gehuurde auto bekijken in de Garage',
        'Auto-informatie inzien (merk, model, kenteken)',
        'Snelle toegang tot gerelateerde boekings- en contractinformatie',
      ],
    },
  ];

  const expectations = [
    { icon: CreditCard, text: 'Wekelijkse huurbetalingen op tijd voldoen — vooruit betalen per week' },
    { icon: Car, text: 'De auto netjes en in goede staat houden gedurende de huurperiode' },
    { icon: Camera, text: 'Bij ophalen meewerken aan de inspectie en foto\'s maken van de auto' },
    { icon: FileText, text: 'Het huurcontract zorgvuldig lezen en digitaal ondertekenen' },
    { icon: Shield, text: 'Een geldig rijbewijs en identiteitsbewijs beschikbaar hebben' },
    { icon: Phone, text: 'Bij problemen of vertraging direct contact opnemen via chat of SOS' },
    { icon: Clock, text: 'Minimaal een week van tevoren opzeggen als je wilt stoppen met huren' },
    { icon: MapPin, text: 'De auto ophalen en terugbrengen op de afgesproken locatie' },
  ];

  const faqItems = [
    { q: 'Hoe lang moet ik minimaal huren?', a: 'Minimaal 4 weken. Hoe langer je huurt, hoe voordeliger het wordt.' },
    { q: 'Hoeveel borg betaal ik?', a: 'De borgsom wordt bepaald door de admin en is afhankelijk van de auto en huurperiode. Je krijgt het terug bij netjes inleveren.' },
    { q: 'Is er een BKR-toets?', a: 'Nee. Vlottr doet geen BKR-toets. We controleren wel je identiteit en rijbewijs.' },
    { q: 'Zit verzekering erbij?', a: 'Ja, alle auto\'s zijn volledig verzekerd inclusief pechhulp.' },
    { q: 'Kan ik tussentijds opzeggen?', a: 'Ja, mits je een week van tevoren opzegt. Er zijn geen opzegboetes.' },
    { q: 'Hoe lang duurt de verificatie?', a: 'Verificatie duurt normaal 1-2 werkdagen. Je wordt per e-mail op de hoogte gehouden.' },
    { q: 'Wat als mijn aanvraag is afgewezen?', a: 'Neem contact op met support via chat of e-mail. Zij kunnen je verder helpen.' },
    { q: 'Kan ik meerdere auto\'s tegelijk huren?', a: 'Dat hangt af van beschikbaarheid. Via de boekingspagina kun je meerdere auto\'s selecteren.' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        .font-mono-space { font-family: 'Space Mono', monospace; }
        .hero-gradient-klant { background: linear-gradient(135deg, #0a0a0a 0%, #0a1a0a 40%, #0a200a 70%, #0a0a0a 100%); }
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
      `}</style>

      <PublicHeader />

      {/* ═══ HERO ═══ */}
      <section className="hero-gradient-klant noise-bg relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80"
            alt="Rijden met Vlottr"
            className="w-full h-full object-cover opacity-15"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/80 to-neutral-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Klant Handleiding</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-none mb-6 tracking-tight">
              Jouw auto.
              <br />
              Jouw regels.
              <br />
              <span className="text-green-400 price-glow">Simpel geregeld.</span>
            </h1>

            <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
              Alles wat je moet weten als klant van Vlottr. Van aanmelden tot rijden, van betalingen tot contracten — deze handleiding legt het allemaal uit.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/registreren"
                className="cta-pulse bg-green-500 text-neutral-950 px-8 py-3.5 rounded-xl text-base font-bold hover:bg-green-400 transition-all inline-flex items-center gap-2"
              >
                Nu aanmelden <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/handleiding-admin" className="inline-flex items-center gap-2 border border-white/10 text-white/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-white/20 hover:text-white transition-all">
                Admin Handleiding <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/handleiding-manager" className="inline-flex items-center gap-2 border border-white/10 text-white/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-white/20 hover:text-white transition-all">
                Manager Handleiding <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ONBOARDING FLOW ═══ */}
      <section className="py-20 sm:py-28" id="onboarding" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('onboarding') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <UserPlus className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Aan de slag</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Hoe begin je</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">In 4 stappen van aanmelding naar rijden. Eenvoudig, transparant en snel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {onboardingSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.stap}
                  className={`fade-up stagger-${(i % 4) + 1} ${isVisible('onboarding') ? 'visible' : ''} border-glow rounded-2xl p-6 sm:p-8 card-shine relative overflow-hidden`}
                >
                  <div className="absolute top-4 right-4 text-6xl font-black text-white/[0.03] font-mono-space">{step.stap}</div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                      <Icon className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <span className="text-green-400 font-mono-space text-xs">Stap {step.stap}</span>
                      <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ VERIFICATIE STATUS ═══ */}
      <section className="py-20 sm:py-28 bg-neutral-950/50" id="status" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('status') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Verificatie Status</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Wat kun je wanneer</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Afhankelijk van je verificatiestatus heb je toegang tot verschillende functies.</p>
          </div>

          <div className="space-y-6">
            {statusInfo.map((info, i) => {
              const Icon = info.icon;
              return (
                <div
                  key={info.status}
                  className={`fade-up stagger-${(i % 4) + 1} ${isVisible('status') ? 'visible' : ''} ${info.borderColor} border rounded-2xl p-6 sm:p-8 card-shine`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`${info.bgColor} ${info.borderColor} border rounded-xl p-3`}>
                      <Icon className={`w-6 h-6 ${info.color}`} />
                    </div>
                    <h3 className={`text-xl font-bold ${info.color}`}>{info.status}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {info.canDo.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Wat je kunt
                        </h4>
                        <ul className="space-y-2">
                          {info.canDo.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-neutral-300 text-sm">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {info.cantDo.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> Wat je niet kunt
                        </h4>
                        <ul className="space-y-2">
                          {info.cantDo.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-neutral-400 text-sm">
                              <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ NAVIGATIE OVERZICHT ═══ */}
      <section className="py-20 sm:py-28" id="navigatie" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('navigatie') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Navigatie</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Jouw Menu</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Na goedkeuring zie je deze pagina's in je sidebar. Snel en overzichtelijk.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: LayoutDashboard, label: 'Dashboard', desc: 'Overzicht en statistieken' },
              { icon: Car, label: 'Auto\'s', desc: 'Beschikbaar aanbod' },
              { icon: CalendarCheck, label: 'Mijn Boekingen', desc: 'Huurgeschiedenis' },
              { icon: FileText, label: 'Contracten', desc: 'Ondertekenen & inzien' },
              { icon: Eye, label: 'Profiel', desc: 'Persoonlijke gegevens' },
            ].map((nav, i) => {
              const Icon = nav.icon;
              return (
                <div
                  key={nav.label}
                  className={`fade-up stagger-${(i % 4) + 1} ${isVisible('navigatie') ? 'visible' : ''} border-glow rounded-xl p-5 card-shine text-center`}
                >
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 inline-block mb-3">
                    <Icon className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{nav.label}</h3>
                  <p className="text-neutral-500 text-xs">{nav.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ RECHTEN & MOGELIJKHEDEN ═══ */}
      <section className="py-20 sm:py-28 bg-neutral-950/50" id="rechten" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('rechten') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <Key className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Rechten & Mogelijkheden</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Alles wat je kunt</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Een volledig overzicht van alle functies die beschikbaar zijn na goedkeuring van je account.</p>
          </div>

          <div className="space-y-8">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.title}
                  id={`cap-${i}`}
                  data-animate
                  className={`fade-up ${isVisible(`cap-${i}`) ? 'visible' : ''} border-glow rounded-2xl p-6 sm:p-8 card-shine`}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`${cap.bgColor} ${cap.borderColor} border rounded-xl p-3`}>
                      <Icon className={`w-6 h-6 ${cap.color}`} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">{cap.title}</h3>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cap.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-neutral-300 text-sm leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ VERWACHTINGEN ═══ */}
      <section className="py-20 sm:py-28" id="verwachtingen" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('verwachtingen') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Verwachtingen</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Wat verwachten wij</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Eerlijk en helder. Dit zijn de basisregels en verwachtingen als je een auto huurt via Vlottr.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {expectations.map((exp, i) => {
              const Icon = exp.icon;
              return (
                <div
                  key={i}
                  className={`fade-up stagger-${(i % 4) + 1} ${isVisible('verwachtingen') ? 'visible' : ''} border-glow rounded-xl p-5 card-shine flex items-start gap-4`}
                >
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex-shrink-0">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-neutral-300 text-sm leading-relaxed">{exp.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 sm:py-28 bg-neutral-950/50" id="faq" data-animate>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('faq') ? 'visible' : ''} text-center mb-12`}>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <HelpCircle className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">FAQ</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Veelgestelde vragen</h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
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

      {/* ═══ CTA ═══ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" id="cta" data-animate>
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/20 via-neutral-950 to-neutral-950" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`fade-up ${isVisible('cta') ? 'visible' : ''}`}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight">
              Klaar om te rijden?
              <br />
              <span className="text-green-400">Begin met Vlottr.</span>
            </h2>
            <p className="text-neutral-400 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
              Meld je aan, doorloop de verificatie en kies je auto. Zo simpel is het.
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
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
              <Link to="/handleiding-admin" className="hover:text-white transition-colors">Admin Handleiding</Link>
              <Link to="/handleiding-manager" className="hover:text-white transition-colors">Manager Handleiding</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Algemene Voorwaarden</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacybeleid</Link>
            </div>
            <div className="text-sm text-neutral-600">&copy; {new Date().getFullYear()} Vlottr</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HandleidingKlant;
