import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Settings, Users, CalendarCheck, FileText, Car, MessageSquare,
  BarChart3, ChevronRight, ArrowRight, Zap, CreditCard, Key, Wrench,
  Mail, Eye, Trash2, UserPlus, ClipboardCheck, Lock, CheckCircle2,
  XCircle, FileSignature, PenTool, MapPin, Euro, AlertTriangle,
  Database, Activity, Bug, LayoutDashboard, Truck, Clock, UserCheck
} from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import Logo from '../components/shared/Logo';

const HandleidingAdmin: React.FC = () => {
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
    { group: 'Dashboard', items: ['Overzichtspagina met badges en statistieken'] },
    { group: 'Operaties', items: ['Boekingen', 'Wachtlijst', 'Contracten'] },
    { group: 'Klanten & Toegang', items: ['Gebruikers', 'Chat', 'Email'] },
    { group: 'Vloot', items: ['Auto Beheer', 'Inspectie'] },
    { group: 'Beheer', items: ['Statistieken', 'Contract Instellingen', 'Systeeminstellingen'] },
    { group: 'Overig', items: ['Debug'] },
  ];

  const capabilities = [
    {
      icon: Settings,
      title: 'Systeeminstellingen',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      items: [
        'Stripe-configuratie wijzigen (publishable key, price IDs, proxy URLs)',
        'Huurtarieven en minimum huurweken instellen',
        'Borgbedragen beheren en aanpassen',
        'Ophaal- en bezorglocaties configureren',
        'Contracttemplates aanmaken en bewerken',
        'E-mailtemplates opslaan (ophalen, ontvangen, borg, bezorgkosten)',
        'Admin-handtekening voor contracten instellen en bijwerken',
      ],
    },
    {
      icon: Users,
      title: 'Gebruikersbeheer',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      items: [
        'Alle gebruikers bekijken en doorzoeken',
        'Nieuwe gebruikers aanmaken',
        'Gebruikers verwijderen',
        'Volledige verificatie-workflow beheren',
        'Klanten goedkeuren of afwijzen',
        'Rijbewijsverificatie uitvoeren en beoordelen',
        'Salarisstroken en persoonlijke documenten inzien',
        'Onboarding-status van klanten bekijken',
        'Alle gebruikersdata en profielen inzien',
      ],
    },
    {
      icon: CalendarCheck,
      title: 'Boekingenbeheer',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      items: [
        'Alle boekingen bekijken en doorzoeken',
        'Boekingsstatus overschrijven (override)',
        'Betalingsstatus beheren en wijzigen',
        'Borgbetalingen bevestigen (borg_confirmed_by)',
        'Bezorgkosten bevestigen (delivery_cost_confirmed_by)',
        'Ophaalinspecties verwerken (formulieren, foto\'s, bevestigen)',
        'Retourinspecties exclusief afhandelen (return_by)',
        'Annuleringen bevestigen (cancellation_confirmed_by)',
        'Wachtlijst bekijken en beheren',
      ],
    },
    {
      icon: FileText,
      title: 'Contractbeheer',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      items: [
        'Contracten aanmaken, bekijken en beheren',
        'Contracten beëindigen (terminated_by)',
        'Contract-PDF\'s genereren',
        'Contracthandtekeningen bijhouden',
        'Contracttemplates aanpassen',
        'Contractinstellingen wijzigen via /admin/contract-settings',
        'Contractstatus volgen (pending, signed, completed, terminated)',
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
        'Onderhoudsrecords en -historie beheren',
        'APK-verloopdatum bijhouden',
        'Verzekeringsdocumenten beheren',
        'Inspectieformulieren bekijken en beoordelen',
        'Inspectieformulieren goedkeuren of afkeuren',
      ],
    },
    {
      icon: MessageSquare,
      title: 'Communicatie',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      items: [
        'E-mails versturen via de email tool',
        'Ontvangen e-mails bekijken en beheren',
        'Chat management systeem gebruiken',
        'Alle chatgesprekken bekijken en beantwoorden',
        'Ongelezen berichten monitoren',
        'Systeemberichten versturen naar klanten',
      ],
    },
    {
      icon: BarChart3,
      title: 'Statistieken & Data',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      items: [
        'Uitgebreide statistieken en rapporten bekijken',
        'Boekingen en omzet volgen',
        'Actieve klanten monitoren',
        'Volledige audit trail via activiteitenlogboek',
        'Activiteitenlog met gebruiker, actie, tijdstempel en metadata',
        'Ontvangen e-mails collectie inzien',
        'Debug-pagina voor systeemdiagnose',
      ],
    },
  ];

  const expectations = [
    { icon: Shield, text: 'Systeemintegriteit waarborgen en configuratie up-to-date houden' },
    { icon: UserCheck, text: 'Klantverificaties tijdig en zorgvuldig beoordelen' },
    { icon: Eye, text: 'Toezicht houden op alle boekingen, betalingen en contracten' },
    { icon: Settings, text: 'Stripe-configuratie, tarieven en templates actueel houden' },
    { icon: Activity, text: 'Activiteitenlog en audit trail regelmatig controleren' },
    { icon: MessageSquare, text: 'Klantcommunicatie (chat en e-mail) tijdig afhandelen' },
    { icon: Car, text: 'Vlootstatus monitoren en onderhoud waarborgen' },
    { icon: AlertTriangle, text: 'Escalaties van managers oppakken en oplossen' },
  ];

  const similarities = [
    { icon: CalendarCheck, text: 'Alle boekingen bekijken en beheren' },
    { icon: ClipboardCheck, text: 'Ophaalinspecties verwerken (formulieren, foto\'s, bevestigen)' },
    { icon: Truck, text: 'Retour- en bezorginspecties verwerken' },
    { icon: Clock, text: 'Wachtlijst bekijken en beheren' },
    { icon: FileText, text: 'Contracten bekijken en beheren' },
    { icon: Users, text: 'Alle klanten en klantgegevens bekijken' },
    { icon: UserCheck, text: 'Klanten goedkeuren of afwijzen (verificatie)' },
    { icon: FileSignature, text: 'Rijbewijsverificatie uitvoeren' },
    { icon: Eye, text: 'Salarisstroken en persoonlijke documenten inzien' },
    { icon: Car, text: 'Alle auto\'s bekijken en beheren' },
    { icon: Wrench, text: 'Autostatus wijzigen (beschikbaar/verhuurd/onderhoud)' },
    { icon: Settings, text: 'Onderhoudshistorie beheren' },
    { icon: Shield, text: 'APK-verloopdatum en verzekeringsdocumenten bijhouden' },
    { icon: ClipboardCheck, text: 'Inspectieformulieren bekijken' },
    { icon: Mail, text: 'E-mails versturen en ontvangen via email tool' },
    { icon: MessageSquare, text: 'Chat management systeem gebruiken' },
    { icon: Eye, text: 'Ongelezen berichten en gesprekken bekijken' },
    { icon: BarChart3, text: 'Statistieken en rapporten bekijken' },
    { icon: Euro, text: 'Boekingen en omzet volgen' },
    { icon: Users, text: 'Actieve klanten monitoren' },
    { icon: Bug, text: 'Debug-pagina gebruiken' },
  ];

  const adminOnly = [
    { icon: CreditCard, text: 'Stripe-configuratie wijzigen (publishable key, price IDs, proxy URLs)' },
    { icon: Euro, text: 'Huurtarieven en minimum huurweken instellen' },
    { icon: Euro, text: 'Borgbedragen beheren en aanpassen' },
    { icon: MapPin, text: 'Ophaal- en bezorglocaties configureren' },
    { icon: FileText, text: 'Contracttemplates aanmaken en bewerken' },
    { icon: Mail, text: 'E-mailtemplates opslaan (ophalen, ontvangen, borg, bezorgkosten)' },
    { icon: PenTool, text: 'Admin-handtekening voor contracten instellen' },
    { icon: UserPlus, text: 'Gebruikers aanmaken' },
    { icon: Trash2, text: 'Gebruikers verwijderen' },
    { icon: Key, text: 'Boekingsstatus overschrijven (override)' },
    { icon: CreditCard, text: 'Betalingsstatus beheren en wijzigen' },
    { icon: Truck, text: 'Retourinspecties exclusief afhandelen (return_by veld)' },
    { icon: XCircle, text: 'Annuleringen bevestigen' },
    { icon: FileSignature, text: 'Contractinstellingen en templates wijzigen' },
    { icon: Database, text: 'Volledige audit trail via activiteitenlogboek' },
    { icon: Mail, text: 'Ontvangen e-mails collectie inzien' },
    { icon: Settings, text: 'Systeeminstellingen pagina (/admin/settings)' },
    { icon: FileText, text: 'Contractinstellingen pagina (/admin/contract-settings)' },
    { icon: LayoutDashboard, text: 'Eigen admin dashboard (/admin)' },
  ];

  const managerOnly = [
    { icon: LayoutDashboard, text: 'Eigen manager dashboard (/manager)' },
    { icon: BarChart3, text: 'Dedicated "Rapporten" sectie in navigatie' },
    { icon: Users, text: 'Navigatiegroep "Klanten & Communicatie" (vs Admin\'s "Klanten & Toegang")' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        .font-mono-space { font-family: 'Space Mono', monospace; }
        .hero-gradient-admin { background: linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 40%, #0a0a2e 70%, #0a0a0a 100%); }
        .price-glow { text-shadow: 0 0 40px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.15); }
        .green-glow { text-shadow: 0 0 40px rgba(34,197,94,0.4), 0 0 80px rgba(34,197,94,0.15); }
        .card-shine { background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.03) 100%); }
        .border-glow { border: 1px solid rgba(255,255,255,0.08); }
        .border-glow-green { border: 1px solid rgba(34,197,94,0.15); }
        .border-glow-red { border: 1px solid rgba(239,68,68,0.15); }
        .border-glow-purple { border: 1px solid rgba(168,85,247,0.15); }
        .fade-up { opacity:0; transform:translateY(40px); transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
        .fade-up.visible { opacity:1; transform:translateY(0); }
        .stagger-1{transition-delay:0.1s;} .stagger-2{transition-delay:0.2s;} .stagger-3{transition-delay:0.3s;} .stagger-4{transition-delay:0.4s;}
        .noise-bg { position:relative; }
        .noise-bg::before { content:''; position:absolute; inset:0; opacity:0.03; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events:none; }
      `}</style>

      <PublicHeader />

      {/* ═══ HERO ═══ */}
      <section className="hero-gradient-admin noise-bg relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/80 to-neutral-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-8">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Admin Handleiding</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-none mb-6 tracking-tight">
              Volledige controle.
              <br />
              <span className="text-purple-400 price-glow">Totaal overzicht.</span>
            </h1>

            <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
              Als admin heb je volledige toegang tot alle functies van het Vlottr-platform. Van systeeminstellingen tot gebruikersbeheer, van vlootmanagement tot financieel toezicht — alles ligt in jouw handen.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/handleiding-manager" className="inline-flex items-center gap-2 border border-white/10 text-white/70 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-white/20 hover:text-white transition-all">
                Manager Handleiding <ChevronRight className="w-4 h-4" />
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
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-6">
              <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-purple-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Navigatie</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Admin Navigatie</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Dit is hoe jouw sidebar eruitziet. Elke groep biedt directe toegang tot een set van functionaliteiten.</p>
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
                      <ChevronRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Een volledig overzicht van alle admin-rechten en mogelijkheden, gegroepeerd per categorie.</p>
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
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Wat wordt er verwacht</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Als admin draag je de eindverantwoordelijkheid voor het platform. Dit zijn de kernverwachtingen.</p>
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

      {/* ═══ ADMIN VS MANAGER VERGELIJKING ═══ */}
      <section className="py-20 sm:py-28 bg-neutral-950/50" id="vergelijking" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('vergelijking') ? 'visible' : ''}`}>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <Users className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Vergelijking</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Admin vs Manager</h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-2xl">Een compleet overzicht van alle overeenkomsten en verschillen tussen de Admin en Manager rollen. Niets ontbreekt.</p>
          </div>

          {/* Overeenkomsten */}
          <div id="overeenkomsten" data-animate className={`fade-up ${isVisible('overeenkomsten') ? 'visible' : ''} mb-12`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Overeenkomsten</h3>
                <p className="text-neutral-500 text-sm">Beide rollen kunnen dit</p>
              </div>
              <span className="ml-auto bg-green-500/10 border border-green-500/20 text-green-400 font-mono-space text-xs px-3 py-1 rounded-full">{similarities.length} items</span>
            </div>
            <div className="border-glow-green rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {similarities.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <Icon className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-neutral-300 text-sm">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alleen Admin */}
          <div id="alleen-admin" data-animate className={`fade-up ${isVisible('alleen-admin') ? 'visible' : ''} mb-12`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5">
                <Lock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Alleen Admin</h3>
                <p className="text-neutral-500 text-sm">Exclusieve admin-rechten</p>
              </div>
              <span className="ml-auto bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono-space text-xs px-3 py-1 rounded-full">{adminOnly.length} items</span>
            </div>
            <div className="border-glow-purple rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {adminOnly.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-neutral-300 text-sm">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alleen Manager */}
          <div id="alleen-manager" data-animate className={`fade-up ${isVisible('alleen-manager') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Alleen Manager</h3>
                <p className="text-neutral-500 text-sm">Manager-specifieke kenmerken</p>
              </div>
              <span className="ml-auto bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono-space text-xs px-3 py-1 rounded-full">{managerOnly.length} items</span>
            </div>
            <div className="border-glow rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {managerOnly.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-neutral-300 text-sm">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Samenvatting tabel */}
          <div id="samenvatting" data-animate className={`fade-up ${isVisible('samenvatting') ? 'visible' : ''} mt-12`}>
            <h3 className="text-2xl font-bold text-white mb-6">Samenvatting in cijfers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border-glow-green rounded-xl p-6 text-center card-shine">
                <div className="text-4xl font-black text-green-400 font-mono-space mb-2">{similarities.length}</div>
                <div className="text-neutral-400 text-sm">Gedeelde rechten</div>
              </div>
              <div className="border-glow-purple rounded-xl p-6 text-center card-shine">
                <div className="text-4xl font-black text-purple-400 font-mono-space mb-2">{adminOnly.length}</div>
                <div className="text-neutral-400 text-sm">Exclusief Admin</div>
              </div>
              <div className="border-glow rounded-xl p-6 text-center card-shine">
                <div className="text-4xl font-black text-blue-400 font-mono-space mb-2">{managerOnly.length}</div>
                <div className="text-neutral-400 text-sm">Exclusief Manager</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo variant="glow" size="sm" />
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
              <Link to="/handleiding-manager" className="hover:text-white transition-colors">Manager Handleiding</Link>
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

export default HandleidingAdmin;
