import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, CalendarCheck, FileText, Car, MessageSquare,
  BarChart3, ChevronRight, Zap, Wrench, Mail, Eye, ClipboardCheck,
  CheckCircle2, FileSignature, AlertTriangle, Activity, Bug,
  LayoutDashboard, Truck, Clock, UserCheck, Camera, FileSearch,
  ListChecks, TrendingUp, Bell
} from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import Logo from '../components/shared/Logo';

const HandleidingManager: React.FC = () => {
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

  const navGroups = [
    { group: 'Dashboard', items: ['Overzichtspagina met badges, boekingen en actiepunten'] },
    { group: 'Operaties', items: ['Boekingen', 'Wachtlijst', 'Contracten'] },
    { group: 'Klanten & Communicatie', items: ['Klanten', 'Verificaties', 'Chat', 'Email'] },
    { group: 'Vloot', items: ['Auto Beheer', 'Inspectie'] },
    { group: 'Rapportage', items: ['Statistieken', 'Rapporten'] },
    { group: 'Overig', items: ['Debug'] },
  ];

  const capabilities = [
    {
      icon: CalendarCheck,
      title: 'Operaties & Boekingen',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      items: [
        'Alle boekingen bekijken, doorzoeken en beheren',
        'Boekingsstatus volgen door de hele levenscyclus',
        'Ophaalinspecties verwerken: formulieren aanmaken, foto\'s nemen, ophalen bevestigen',
        'Retour- en bezorginspecties verwerken: formulieren, foto\'s, retour bevestigen',
        'Borgbetalingen bevestigen (borg_confirmed_by)',
        'Bezorgkosten bevestigen (delivery_cost_confirmed_by)',
        'Wachtlijst bekijken, beheren en klanten benaderen',
        'Contracten bekijken en beheren',
      ],
    },
    {
      icon: Users,
      title: 'Klantenbeheer',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      items: [
        'Alle klanten en klantgegevens bekijken',
        'Klantprofielen en persoonlijke informatie inzien',
        'Klanten goedkeuren of afwijzen (verificatieworkflow)',
        'Rijbewijsverificatie uitvoeren en beoordelen',
        'Salarisstroken en persoonlijke documenten beoordelen',
        'Onboarding-status van klanten volgen',
        'Verificatiegeschiedenis bijhouden (verified_by, verified_at)',
      ],
    },
    {
      icon: Car,
      title: 'Vlootbeheer',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      items: [
        'Alle auto\'s bekijken, toevoegen en bewerken',
        'Autostatus wijzigen (beschikbaar, verhuurd, onderhoud)',
        'Onderhoudsrecords aanmaken en -historie beheren',
        'APK-verloopdatum bijhouden en monitoren',
        'Verzekeringsdocumenten beheren',
        'Inspectieformulieren bekijken en beoordelen',
        'Inspectieformulieren goedkeuren of afkeuren',
        'Auto\'s in onderhoud markeren en opvolgen',
      ],
    },
    {
      icon: MessageSquare,
      title: 'Communicatie',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      items: [
        'E-mails versturen via de ingebouwde email tool',
        'Ontvangen e-mails bekijken en opvolgen',
        'Chat management systeem gebruiken',
        'Alle chatgesprekken met klanten bekijken en beantwoorden',
        'Ongelezen berichten monitoren via badges',
        'Direct communiceren met klanten over boekingen en verificatie',
      ],
    },
    {
      icon: BarChart3,
      title: 'Rapportage & Statistieken',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      items: [
        'Uitgebreide statistieken bekijken',
        'Boekingen en omzet volgen en analyseren',
        'Actieve klanten monitoren',
        'Dedicated rapporten genereren en bekijken',
        'Debug-pagina gebruiken voor systeemdiagnose',
      ],
    },
  ];

  const badges = [
    { icon: Mail, text: 'Ongelezen e-mails', color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { icon: Clock, text: 'Boekingen in afwachting van betaling', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { icon: CalendarCheck, text: 'Bevestigde boekingen (wachtend op ophalen)', color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: Shield, text: 'Open borgbetalingen', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: UserCheck, text: 'Klanten die wachten op verificatie', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: MessageSquare, text: 'Ongelezen chatberichten', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { icon: ListChecks, text: 'Nieuwe wachtlijst-aanmeldingen', color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { icon: Wrench, text: 'Auto\'s in onderhoud', color: 'text-red-400', bg: 'bg-red-500/10' },
    { icon: FileText, text: 'Ongetekende contracten', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const expectations = [
    { icon: CalendarCheck, text: 'Dagelijks boekingen en ophaal/retourprocessen monitoren en afhandelen' },
    { icon: UserCheck, text: 'Nieuwe klantaanvragen tijdig beoordelen en verificaties verwerken' },
    { icon: Car, text: 'Vlootstatus bijhouden: onderhoud plannen, APK-data bewaken, auto\'s beschikbaar houden' },
    { icon: Camera, text: 'Inspectieformulieren zorgvuldig invullen met foto\'s en opmerkingen' },
    { icon: MessageSquare, text: 'Klantcommunicatie proactief afhandelen via chat en e-mail' },
    { icon: FileSearch, text: 'Documenten en rijbewijzen nauwkeurig controleren bij verificatie' },
    { icon: TrendingUp, text: 'Rapportages en statistieken gebruiken om operationele verbeteringen te signaleren' },
    { icon: Bell, text: 'Dashboard-badges dagelijks opvolgen — niets mag blijven liggen' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        .font-mono-space { font-family: 'Space Mono', monospace; }
        .hero-gradient-manager { background: linear-gradient(135deg, #0a0a0a 0%, #0a1a2e 40%, #0a152e 70%, #0a0a0a 100%); }
        .price-glow { text-shadow: 0 0 40px rgba(59,130,246,0.4), 0 0 80px rgba(59,130,246,0.15); }
        .card-shine { background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.03) 100%); }
        .border-glow { border: 1px solid rgba(255,255,255,0.08); }
        .fade-up { opacity:0; transform:translateY(40px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
        .fade-up.visible { opacity:1; transform:translateY(0); }
        .stagger-1{transition-delay:0.1s;} .stagger-2{transition-delay:0.2s;} .stagger-3{transition-delay:0.3s;} .stagger-4{transition-delay:0.4s;}
        .noise-bg { position:relative; }
        .noise-bg::before { content:''; position:absolute; inset:0; opacity:0.03; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events:none; }
      `}</style>

      <PublicHeader />

      {/* ═══ HERO ═══ */}
      <section className="hero-gradient-manager noise-bg relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/80 to-neutral-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Manager Handleiding</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-none mb-6 tracking-tight">
              Operationele kracht.
              <br />
              <span className="text-blue-400 price-glow">Dagelijkse sturing.</span>
            </h1>

            <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
              Als manager ben je de spil van de dagelijkse operatie. Je beheert boekingen, verifieert klanten, houdt de vloot bij en zorgt dat alles soepel draait. Van ophalen tot retour — jij houdt het in beweging.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/handleiding-admin" className="inline-flex items-center gap-2 border border-white/10 text-white/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-white/20 hover:text-white transition-all">
                Admin Handleiding <ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/handleiding-klant" className="inline-flex items-center gap-2 border border-white/10 text-white/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-white/20 hover:text-white transition-all">
                Klant Handleiding <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
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
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Manager Navigatie</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Jouw sidebar is opgebouwd uit logische groepen voor snelle toegang tot alle operationele functies.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {navGroups.map((group, i) => (
              <div
                key={group.group}
                className={`fade-up stagger-${(i % 4) + 1} ${isVisible('navigatie') ? 'visible' : ''} border-glow rounded-2xl p-6 card-shine`}
              >
                <h3 className="text-lg font-bold text-white mb-3">{group.group}</h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-neutral-400 text-sm">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DASHBOARD BADGES ═══ */}
      <section className="py-20 sm:py-28 bg-neutral-950/50" id="badges" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('badges') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Real-time Badges</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Dashboard Meldingen</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Je dashboard toont real-time badges voor items die aandacht vereisen. Zo mis je nooit iets.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div
                  key={i}
                  className={`fade-up stagger-${(i % 4) + 1} ${isVisible('badges') ? 'visible' : ''} border-glow rounded-xl p-5 card-shine flex items-center gap-4`}
                >
                  <div className={`${badge.bg} rounded-lg p-2.5 flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${badge.color}`} />
                  </div>
                  <span className="text-neutral-300 text-sm">{badge.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ RECHTEN & MOGELIJKHEDEN ═══ */}
      <section className="py-20 sm:py-28" id="rechten" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('rechten') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Rechten & Mogelijkheden</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Alles wat je kunt</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Een volledig overzicht van alle manager-rechten en mogelijkheden, gegroepeerd per categorie.</p>
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
      <section className="py-20 sm:py-28 bg-neutral-950/50" id="verwachtingen" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('verwachtingen') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Verwachtingen</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Wat wordt er verwacht</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Als manager ben je verantwoordelijk voor de dagelijkse operatie. Dit zijn de kernverwachtingen.</p>
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

      {/* ═══ WAT KAN DE MANAGER NIET ═══ */}
      <section className="py-20 sm:py-28" id="beperkingen" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('beperkingen') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-6">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Beperkingen</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Wat kan je niet</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Deze functies zijn voorbehouden aan de admin. Voor deze zaken moet je contact opnemen met een admin.</p>
          </div>

          <div className="border-glow rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {[
                'Stripe-configuratie wijzigen',
                'Huurtarieven en minimum huurweken instellen',
                'Borgbedragen beheren en aanpassen',
                'Ophaal- en bezorglocaties configureren',
                'Contracttemplates aanmaken en bewerken',
                'E-mailtemplates opslaan',
                'Admin-handtekening voor contracten instellen',
                'Gebruikers aanmaken of verwijderen',
                'Boekingsstatus overschrijven (override)',
                'Betalingsstatus wijzigen',
                'Retourinspecties exclusief afhandelen',
                'Annuleringen bevestigen',
                'Contractinstellingen en templates wijzigen',
                'Activiteitenlog / audit trail inzien',
                'Systeeminstellingen bewerken',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-neutral-400 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/handleiding-admin" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
              Bekijk de Admin Handleiding voor het volledige overzicht <ChevronRight className="w-4 h-4" />
            </Link>
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
              <Link to="/handleiding-klant" className="hover:text-white transition-colors">Klant Handleiding</Link>
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

export default HandleidingManager;
