import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus, FileCheck, Car, Key, CreditCard, Wrench, Phone,
  CheckCircle, AlertCircle, ArrowRight, Shield, Clock, Euro,
  HeartHandshake, MessageCircle, RotateCcw, Zap, ChevronRight
} from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import Logo from '../components/shared/Logo';

const HoeHetWerkt: React.FC = () => {
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

  const stappen = [
    { stap: '01', icon: UserPlus, title: 'Aanmelden & account aanmaken', desc: 'Je maakt een gratis account aan met je naam, e-mailadres en wachtwoord. Geen BKR-toets, geen aanbetaling, geen kleine lettertjes.', detail: 'Na aanmelden ontvang je een bevestigingsmail. Daarna start de verificatie.' },
    { stap: '02', icon: FileCheck, title: 'Identiteitsverificatie', desc: 'We controleren je rijbewijs en identiteitsbewijs. Dit doen we om te zorgen dat we weten met wie we te maken hebben — en om jou te beschermen.', detail: 'Verificatie duurt normaal 1 werkdag. Je wordt per e-mail of via de app op de hoogte gehouden.' },
    { stap: '03', icon: Car, title: 'Kies een auto', desc: 'Na verificatie zie je het beschikbare aanbod. Je kiest een auto die bij jou past — op merk, type of weekprijs.', detail: 'Alle auto\'s zijn APK-gekeurd, verzekerd en klaar voor gebruik. Wat je ziet is wat je krijgt.' },
    { stap: '04', icon: FileCheck, title: 'Contract ondertekenen', desc: 'Je ondertekent digitaal een huurcontract. Hierin staat precies wat je huurt, voor welke prijs en onder welke voorwaarden.', detail: 'Het contract is wekelijks opzegbaar. Lees het door — er zijn geen verborgen clausules.' },
    { stap: '05', icon: Key, title: 'Ophalen & rijden', desc: 'Je haalt de auto op bij de afgesproken locatie. De garage checkt de auto samen met jou in — je tekent voor de staat van de auto.', detail: 'We lopen samen door de auto. Bestaande schades worden genoteerd zodat jij nergens voor opdraait.' },
    { stap: '06', icon: CreditCard, title: 'Wekelijks betalen', desc: 'Je betaalt per week, vooruit. Automatisch via de app of handmatig — dat spreken we vooraf af.', detail: 'Betaalproblemen? Neem altijd direct contact op. We denken mee, maar kunnen niet wachten.' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        .font-mono-space { font-family: 'Space Mono', monospace; }
        .hero-gradient-hhw { background: linear-gradient(135deg, #0a0a0a 0%, #0d1f0d 40%, #0a1a0a 70%, #0a0a0a 100%); }
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
      `}</style>

      <PublicHeader />

      {/* ═══ HERO ═══ */}
      <section className="hero-gradient-hhw noise-bg relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80"
            alt="Hoe het werkt"
            className="w-full h-full object-cover opacity-15"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/80 to-neutral-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono-space">Transparantie voorop</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-none mb-6 tracking-tight">
              Hoe het werkt
              <br />
              <span className="text-green-400 price-glow">bij Vlottr.</span>
            </h1>

            <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl leading-relaxed">
              Van aanmelden tot rijden. En wat je van ons mag verwachten — en wij van jou.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ DE STAPPEN ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="stappen" data-animate>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('stappen') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Stap voor stap</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Van aanmelding tot sleutels</h2>
            <p className="text-neutral-400 text-lg mb-16 max-w-xl">Zes stappen, volledig transparant.</p>
          </div>

          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-[31px] top-8 bottom-8 w-px bg-gradient-to-b from-green-500/50 via-green-500/20 to-transparent hidden md:block" />

            <div className="space-y-6">
              {stappen.map((s, i) => (
                <div
                  key={i}
                  id={`stap-${i}`}
                  data-animate
                  className={`fade-up stagger-${(i % 3) + 1} ${isVisible(`stap-${i}`) ? 'visible' : ''} relative flex gap-6`}
                >
                  {/* Icon bubble */}
                  <div className="flex-shrink-0 relative z-10 hidden md:flex">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                      <s.icon className="w-8 h-8 text-neutral-950" />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 card-shine border-glow rounded-2xl p-6 hover:border-green-500/20 transition-all duration-500 group relative overflow-hidden">
                    <span className="absolute top-4 right-6 text-6xl font-black text-white/[0.03] font-mono-space">{s.stap}</span>
                    {/* Mobile icon */}
                    <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400 mb-4 group-hover:bg-green-500/20 transition-colors md:hidden">
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-green-400 font-semibold font-mono-space uppercase tracking-wider">Stap {s.stap}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                    <p className="text-neutral-300 mb-4 leading-relaxed">{s.desc}</p>
                    <p className="text-sm text-neutral-500 leading-relaxed border-t border-white/[0.05] pt-4">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WAT JIJ VAN ONS MAG VERWACHTEN ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="beloftes" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('beloftes') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Onze beloftes</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Wat mag jij van ons verwachten?</h2>
            <p className="text-neutral-400 text-lg mb-16 max-w-xl">Dit beloven we — en we menen het.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Een eerlijk contract', desc: 'Geen verborgen kosten, geen kleine lettertjes. Je weet precies waarvoor je tekent en wat het kost.' },
              { icon: Car, title: 'Een betrouwbare auto', desc: 'APK-gekeurd, verzekerd, onderhouden door onze partnergarages. We geven je geen auto mee waarvan we niet zeker zijn.' },
              { icon: Wrench, title: 'Onderhoud geregeld', desc: 'Als een service nodig is, regelen wij dat. Jij hoeft niets te zoeken of voor te schieten.' },
              { icon: Phone, title: 'We zijn bereikbaar', desc: 'Pech? Vraag? Probleem? Via de app, telefoon of chat. Geen callcenter, gewoon mensen.' },
              { icon: RotateCcw, title: 'Flexibel opzeggen', desc: 'Wekelijks opzegbaar. Geen boetes, geen moeilijkheden. Een week van tevoren opzeggen, en je bent vrij.' },
              { icon: HeartHandshake, title: 'Respect en eerlijkheid', desc: 'We oordelen niet. Jouw achtergrond of financieel verleden speelt geen rol. Jij hebt een auto nodig — dat regelen we.' },
            ].map((v, i) => (
              <div
                key={i}
                id={`belofte-${i}`}
                data-animate
                className={`fade-up stagger-${(i % 3) + 1} ${isVisible(`belofte-${i}`) ? 'visible' : ''} group p-6 rounded-2xl border-glow card-shine hover:border-green-500/20 transition-all duration-500`}
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-5 group-hover:bg-green-500/20 transition-colors">
                  <v.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WAT WIJ VAN JOU VERWACHTEN ═══ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" id="verwachtingen" data-animate>
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-green-950/5 to-neutral-950" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('verwachtingen') ? 'visible' : ''} text-center mb-16`}>
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Eerlijkheid werkt twee kanten op</span>
              <div className="h-px w-12 bg-green-500" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Wat verwachten wij van jou?</h2>
          </div>

          <div className="space-y-4">
            {[
              { icon: CheckCircle, kleur: 'text-green-400', title: 'Zorg voor de auto', desc: 'Rij veilig, houd de auto schoon en meld schades direct. De auto is van ons, maar jij hebt de verantwoordelijkheid tijdens de huur.' },
              { icon: CheckCircle, kleur: 'text-green-400', title: 'Betaal op tijd', desc: 'Je betaalt wekelijks vooruit. Kom je in de problemen? Neem dan direct contact op — we denken mee, maar wachten is geen optie.' },
              { icon: CheckCircle, kleur: 'text-green-400', title: 'Rij legaal en verzekerd', desc: 'Je rijdt met een geldig rijbewijs, op jouw naam. De auto mag alleen door jou of een door ons goedgekeurde bestuurder gereden worden.' },
              { icon: CheckCircle, kleur: 'text-green-400', title: 'Meld problemen direct', desc: 'Pech, schade of een storing? Bel ons meteen. Verberg niets — het wordt altijd erger als je het niet meldt.' },
              { icon: AlertCircle, kleur: 'text-yellow-400', title: 'Geen misbruik van de auto', desc: 'De auto is voor dagelijks gebruik, niet voor commercieel vervoer, races of grensoverschrijdende ritten zonder toestemming.' },
            ].map((v, i) => (
              <div
                key={i}
                id={`verw-${i}`}
                data-animate
                className={`fade-up stagger-${(i % 3) + 1} ${isVisible(`verw-${i}`) ? 'visible' : ''} flex items-start gap-5 card-shine border-glow rounded-xl px-6 py-5 hover:border-green-500/20 transition-all`}
              >
                <v.icon className={`w-6 h-6 ${v.kleur} flex-shrink-0 mt-0.5`} />
                <div>
                  <h3 className="font-bold text-white mb-1">{v.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TIJDENS DE HUURPERIODE ═══ */}
      <section className="py-24 sm:py-32 noise-bg" id="huurperiode" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('huurperiode') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono-space">Lopende huur</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Tijdens de huurperiode</h2>
            <p className="text-neutral-400 text-lg mb-16 max-w-xl">Wat er allemaal voor je geregeld is.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Euro, title: 'Wekelijkse betaling', desc: 'Elke week betaal je je huurbedrag. Dit staat vast in je contract en verandert niet tussentijds.' },
              { icon: Wrench, title: 'Servicebeurt & onderhoud', desc: 'Wij plannen de onderhoudsafspraken en brengen de auto naar de garage. Jij hoeft hier niets voor te doen of te betalen.' },
              { icon: MessageCircle, title: 'Contact via de app', desc: 'Heb je vragen of wil je iets melden? Dat doe je via de Vlottr app. Direct bereikbaar, snel gereageerd.' },
              { icon: Shield, title: 'Schadeafhandeling', desc: 'Bij een ongeluk of schade neem je direct contact op. Wij regelen de verzekering en het herstel.' },
              { icon: Clock, title: 'Opzeggen', desc: 'Zeg minstens een week van tevoren op. Breng de auto terug naar de afgesproken locatie, incheck samen met ons — en je bent vrij.' },
              { icon: RotateCcw, title: 'Verlengen of wisselen', desc: 'Wil je een andere auto of wil je verlengen? Dat regel je via de app. We kijken samen wat mogelijk is.' },
            ].map((v, i) => (
              <div
                key={i}
                id={`lp-${i}`}
                data-animate
                className={`fade-up stagger-${(i % 3) + 1} ${isVisible(`lp-${i}`) ? 'visible' : ''} group p-6 rounded-2xl border-glow card-shine hover:border-green-500/20 transition-all duration-500`}
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-5 group-hover:bg-green-500/20 transition-colors">
                  <v.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">{v.desc}</p>
              </div>
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
              Helder genoeg?
              <br />
              <span className="text-green-400">Dan rijden we.</span>
            </h2>
            <p className="text-neutral-400 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
              Maak een account aan en kijk wat er voor jou beschikbaar is.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/registreren"
                className="cta-pulse inline-flex items-center gap-3 bg-green-500 text-neutral-950 px-10 py-5 rounded-xl text-xl font-bold hover:bg-green-400 transition-all hover:scale-105"
              >
                Account aanmaken <ArrowRight className="w-6 h-6" />
              </Link>
              <Link
                to="/voor-klanten"
                className="inline-flex items-center justify-center gap-2 border border-neutral-700 text-white px-8 py-5 rounded-xl text-lg font-medium hover:bg-white/5 transition-all"
              >
                Voordelen voor klanten
              </Link>
            </div>
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

export default HoeHetWerkt;
