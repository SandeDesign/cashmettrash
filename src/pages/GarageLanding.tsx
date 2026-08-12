import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Users, TrendingUp, Shield, CheckCircle, ArrowRight, Clock, Euro, BarChart3, Zap, Package, Calendar } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';

const GarageLanding: React.FC = () => {
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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        .fade-up {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
      `}</style>

      <PublicHeader />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 70%, #0a0a0a 100%)' }}>
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80"
            alt="Garage werkplaats"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-950/50 to-neutral-950"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
              <Wrench className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Voor Autogarages</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              Vergroot je <span className="text-green-400">omzet</span><br />
              met VLOTTR
            </h1>

            <p className="text-xl md:text-2xl text-neutral-300 mb-8 leading-relaxed">
              Sluit je aan bij ons collectief en bied vervangend vervoer aan je klanten.
              Verdien extra inkomsten terwijl hun auto bij jou in de garage staat.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/registreren"
                className="inline-flex items-center justify-center gap-2 bg-green-500 text-neutral-950 px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-400 transition-all hover:scale-105"
              >
                Word Partner
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#voordelen"
                className="inline-flex items-center justify-center gap-2 bg-neutral-800 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-neutral-700 transition-all"
              >
                Meer Informatie
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Voordelen Section */}
      <section id="voordelen" className="py-24 bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Waarom kiezen voor VLOTTR?</h2>
            <p className="text-xl text-neutral-400">Groei je garage met ons platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Euro,
                title: 'Extra Inkomstenbron',
                description: 'Verdien bij aan elke vervangend vervoer boeking voor je klanten'
              },
              {
                icon: Users,
                title: 'Klantenbinding',
                description: 'Verhoog klanttevredenheid door complete service aan te bieden'
              },
              {
                icon: TrendingUp,
                title: 'Meer Opdrachten',
                description: 'Trek nieuwe klanten aan met unieke service'
              },
              {
                icon: Shield,
                title: 'Verzekerd & Veilig',
                description: 'Alle auto\'s volledig verzekerd en APK gekeurd'
              },
              {
                icon: Clock,
                title: 'Tijdbesparend',
                description: 'Wij regelen alles, van boeking tot afhandeling'
              },
              {
                icon: BarChart3,
                title: 'Transparant Dashboard',
                description: 'Inzicht in al je boekingen en verdiensten'
              }
            ].map((benefit, index) => (
              <div
                key={index}
                id={`benefit-${index}`}
                data-animate
                className={`fade-up ${isVisible(`benefit-${index}`) ? 'visible' : ''} stagger-${(index % 3) + 1} bg-neutral-800 border border-neutral-700 rounded-xl p-8 hover:border-green-500/50 transition-all hover:scale-105`}
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-neutral-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hoe Werkt Het Section */}
      <section className="py-24 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Hoe werkt het?</h2>
            <p className="text-xl text-neutral-400">Simpel en snel aan de slag</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                icon: Package,
                title: 'Registreer',
                description: 'Meld je aan als garage partner'
              },
              {
                step: '2',
                icon: CheckCircle,
                title: 'Verificatie',
                description: 'Wij verifiëren je bedrijfsgegevens'
              },
              {
                step: '3',
                icon: Calendar,
                title: 'Boekingen',
                description: 'Ontvang boekingen van klanten'
              },
              {
                step: '4',
                icon: Zap,
                title: 'Verdienen',
                description: 'Automatische uitbetaling'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <step.icon className="w-10 h-10 text-neutral-950" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-neutral-800 border-2 border-green-500 rounded-full flex items-center justify-center font-bold text-green-400">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-neutral-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-green-900 to-green-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Klaar om te groeien?</h2>
          <p className="text-xl text-neutral-200 mb-8">
            Sluit je vandaag nog aan bij VLOTTR en vergroot je omzet
          </p>
          <Link
            to="/registreren"
            className="inline-flex items-center gap-2 bg-white text-neutral-950 px-10 py-5 rounded-lg text-lg font-bold hover:bg-neutral-100 transition-all hover:scale-105"
          >
            <Wrench className="w-5 h-5" />
            Word Partner Garage
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-neutral-500">
          <p>&copy; 2024 VLOTTR. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
};

export default GarageLanding;
