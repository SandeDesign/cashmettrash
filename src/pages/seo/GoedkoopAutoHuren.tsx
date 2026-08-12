import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Euro, TrendingDown, Calendar, CheckCircle, ArrowRight, Zap } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import Logo from '../../components/shared/Logo';

const GoedkoopAutoHuren: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <SEO
        title="Goedkoop Auto Huren | Vanaf €249/week | Vlottr Zuid-Limburg"
        description="Goedkoop auto huren in Zuid-Limburg? Weekhuur vanaf €249! Premium auto's voor de beste prijs. Transparant, betrouwbaar en flexibel. Huur nu!"
        keywords="goedkoop auto huren, goedkope autoverhuur, betaalbare auto huren, weekhuur goedkoop, auto huren limburg goedkoop, voordeelig auto huren"
        url="https://vlottr.eu/goedkoop-auto-huren"
      />

      <header className="vl-card border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/">
              <Logo variant="strong-glow" size="md" />
            </Link>
            <Link to="/registreren" className="vl-btn-primary">
              Nu Huren
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <TrendingDown className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">Scherpe Weekprijzen</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            <span className="text-green-400">Goedkoop</span> Auto Huren
          </h1>

          <p className="text-xl text-neutral-400 max-w-3xl mx-auto mb-8">
            Premium auto's huren voor de beste prijs! Vanaf €249 per week in Zuid-Limburg.
            Transparant, zonder verborgen kosten.
          </p>

          <Link to="/registreren" className="vl-btn-primary text-lg px-8 py-4 inline-flex">
            <Car className="w-5 h-5" />
            Direct Huren vanaf €249
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Prijzen */}
        <div className="vl-card p-8 lg:p-12 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Transparante Weekprijzen
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Compact',
                price: '€249',
                description: 'VW Golf, Ford Focus, Toyota Corolla',
                features: ['Zuinig', 'Stadsgebruik', 'Handgeschakeld']
              },
              {
                title: 'Comfort',
                price: '€299',
                description: 'BMW 3-serie, Audi A4, Mercedes C-Klasse',
                features: ['Automaat', 'Business', 'Extra comfort'],
                popular: true
              },
              {
                title: 'Premium',
                price: '€349',
                description: 'BMW 5-serie, Mercedes E-Klasse, Audi A6',
                features: ['Luxe', 'Volledig uitgerust', 'Top comfort']
              }
            ].map((tier) => (
              <div
                key={tier.title}
                className={`p-6 rounded-xl border ${
                  tier.popular
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-white/[0.06]'
                } relative`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-green-500 text-neutral-950 text-xs font-bold rounded-full">
                    POPULAIR
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">{tier.title}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-green-400">{tier.price}</span>
                  <span className="text-neutral-500">/week</span>
                </div>
                <p className="text-sm text-neutral-400 mb-4">{tier.description}</p>
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-neutral-300">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-xl bg-green-500/5 border border-green-500/20 text-center">
            <p className="text-green-400 font-semibold mb-2">💰 Langere huur = meer voordeel!</p>
            <p className="text-neutral-400">
              Huur 4+ weken en krijg extra korting. Neem contact op voor een persoonlijk aanbod!
            </p>
          </div>
        </div>

        {/* Waarom Goedkoop bij Vlottr */}
        <div className="vl-card p-8 lg:p-12 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8">
            Waarom is Vlottr Zo Goedkoop?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Zap className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Geen Tussenpersonen</h3>
                <p className="text-neutral-400">
                  Direct huren zonder dure tussenpersonen. Dat scheelt in de kosten!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Euro className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">All-in Prijzen</h3>
                <p className="text-neutral-400">
                  Verzekering en onderhoud inbegrepen. Geen verborgen kosten achteraf.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Calendar className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Weekhuur</h3>
                <p className="text-neutral-400">
                  Gespecialiseerd in weekhuur. Dat maakt ons efficiënter en goedkoper!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Car className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Premium Kwaliteit</h3>
                <p className="text-neutral-400">
                  Goedkoop betekent niet slecht! Alle auto's zijn goed onderhouden en recent.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="vl-card p-8 lg:p-12 text-center bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Klaar voor de Beste Deal?
          </h2>
          <p className="text-neutral-400 mb-8 max-w-2xl mx-auto">
            Huur nu een premium auto voor de beste prijs in Zuid-Limburg!
          </p>
          <Link to="/registreren" className="vl-btn-primary text-lg px-8 py-4 inline-flex">
            Start Nu vanaf €249
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo variant="glow" size="sm" />
            <div className="flex gap-6 text-sm text-neutral-500">
              <Link to="/auto-huren-limburg" className="hover:text-white transition-colors">Auto Huren Limburg</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Voorwaarden</Link>
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GoedkoopAutoHuren;
