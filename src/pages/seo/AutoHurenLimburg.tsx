import React from 'react';
import { Link } from 'react-router-dom';
import { Car, MapPin, Euro, Calendar, CheckCircle, ArrowRight, Phone, Mail } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import StructuredData from '../../components/seo/StructuredData';
import Logo from '../../components/shared/Logo';

const AutoHurenLimburg: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <SEO
        title="Auto Huren Limburg | Premium Weekhuur vanaf €249 | Vlottr"
        description="Auto huren in Limburg? Bij Vlottr huur je premium auto's per week. Beschikbaar in heel Limburg: Maastricht, Heerlen, Sittard-Geleen. Vanaf €249/week!"
        keywords="auto huren limburg, autoverhuur limburg, auto huren maastricht, auto huren heerlen, weekhuur auto limburg, goedkoop auto huren limburg, autoverhuur zuid-limburg"
        url="https://vlottr.eu/auto-huren-limburg"
      />

      <StructuredData
        type="LocalBusiness"
        data={{
          name: 'Vlottr - Auto Huren Limburg',
          description: 'Premium auto verhuur in Limburg. Weekhuur vanaf €249.',
          areaServed: {
            '@type': 'State',
            name: 'Limburg'
          },
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Auto Verhuur Services',
            itemListElement: [
              {
                '@type': 'Offer',
                itemOffered: {
                  '@type': 'Product',
                  name: 'Weekhuur Auto',
                  description: 'Premium auto huren per week in Limburg'
                }
              }
            ]
          }
        }}
      />

      {/* Header */}
      <header className="vl-card border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/">
              <Logo variant="strong-glow" size="md" />
            </Link>
            <div className="flex gap-4">
              <Link to="/login" className="vl-btn-ghost hidden md:inline-flex">
                Inloggen
              </Link>
              <Link to="/registreren" className="vl-btn-primary">
                Nu Huren
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <MapPin className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400">Actief in heel Limburg</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Auto Huren in <span className="text-green-400">Limburg</span>
          </h1>

          <p className="text-xl text-neutral-400 max-w-3xl mx-auto mb-8">
            Premium auto's huren per week in Zuid-Limburg. Beschikbaar in Maastricht, Heerlen, Sittard-Geleen en omgeving.
            Vanaf €249 per week!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/registreren" className="vl-btn-primary text-lg px-8 py-4">
              <Car className="w-5 h-5" />
              Direct Auto Huren
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/pwa-install" className="vl-btn-secondary text-lg px-8 py-4">
              Bekijk Beschikbaarheid
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Minimaal 1 week huren
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Vanaf 18 jaar
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              All-in prijzen
            </div>
          </div>
        </div>

        {/* Waarom Auto Huren in Limburg */}
        <div className="vl-card p-8 lg:p-12 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">
            Waarom Auto Huren in Limburg bij Vlottr?
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Heel Limburg Bereikbaar</h3>
                <p className="text-neutral-400">
                  Of je nu in Maastricht, Heerlen, Sittard-Geleen, Roermond of Venlo bent -
                  wij zijn beschikbaar door heel Limburg. Makkelijk ophalen en inleveren.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Euro className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Scherpe Weekprijzen</h3>
                <p className="text-neutral-400">
                  Vanaf €249 per week. Hoe langer je huurt, hoe voordeliger!
                  All-in prijzen zonder verborgen kosten. Transparant en eerlijk.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Premium Auto's</h3>
                <p className="text-neutral-400">
                  Van compacte stadsauto's tot ruime sedans. Alle auto's zijn goed onderhouden,
                  verzekerd en recent. BMW, Mercedes, Volkswagen en meer.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Flexibele Verhuurperiodes</h3>
                <p className="text-neutral-400">
                  Minimaal 1 week, maar je kunt verlengen zo lang als je wilt.
                  Perfect voor tijdelijk vervoer, projecten of overbrugging.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Locaties in Limburg */}
        <div className="vl-card p-8 lg:p-12 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">
            Auto Huren in Zuid-Limburg
          </h2>

          <p className="text-neutral-400 mb-8">
            Vlottr is actief in heel Zuid-Limburg. Hieronder vind je een overzicht van de belangrijkste steden
            waar we auto's verhuren:
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { stad: 'Maastricht', provincie: 'Zuid-Limburg' },
              { stad: 'Heerlen', provincie: 'Zuid-Limburg' },
              { stad: 'Sittard-Geleen', provincie: 'Zuid-Limburg' },
              { stad: 'Roermond', provincie: 'Midden-Limburg' },
              { stad: 'Venlo', provincie: 'Noord-Limburg' },
              { stad: 'Kerkrade', provincie: 'Zuid-Limburg' },
              { stad: 'Brunssum', provincie: 'Zuid-Limburg' },
              { stad: 'Landgraaf', provincie: 'Zuid-Limburg' },
              { stad: 'Weert', provincie: 'Midden-Limburg' }
            ].map((locatie) => (
              <div
                key={locatie.stad}
                className="p-4 rounded-lg border border-white/[0.06] hover:border-green-500/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <h3 className="font-bold text-white">{locatie.stad}</h3>
                </div>
                <p className="text-sm text-neutral-500">{locatie.provincie}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="vl-card p-8 lg:p-12 mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">
            Veelgestelde Vragen over Auto Huren in Limburg
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'Wat kost auto huren in Limburg?',
                a: 'Bij Vlottr betaal je vanaf €249 per week voor een premium auto. De prijs hangt af van het type auto en de huurperiode. Hoe langer je huurt, hoe voordeliger de weekprijs wordt.'
              },
              {
                q: 'Waar kan ik de auto ophalen in Limburg?',
                a: 'We zijn actief in heel Limburg, inclusief Maastricht, Heerlen, Sittard-Geleen, Roermond en Venlo. Bij boeking bepalen we samen een handige ophaallocatie.'
              },
              {
                q: 'Wat heb ik nodig om een auto te huren?',
                a: 'Je moet minimaal 18 jaar zijn en in het bezit van een geldig Nederlands rijbewijs (categorie B) dat minimaal 1 jaar geleden is afgegeven. Verder heb je een geldig identiteitsbewijs nodig.'
              },
              {
                q: 'Kan ik de huurperiode verlengen?',
                a: 'Ja, absoluut! Je kunt de huurperiode verlengen zolang de auto beschikbaar is. Neem gewoon contact op en we regelen het direct.'
              },
              {
                q: 'Zijn de auto\'s verzekerd?',
                a: 'Ja, alle auto\'s zijn volledig verzekerd. De verzekering is inbegrepen in de huurprijs, geen extra kosten.'
              },
              {
                q: 'Kan ik ook buiten Limburg rijden?',
                a: 'Ja, je mag door heel Nederland rijden. Voor ritten buiten Nederland vragen we je om vooraf toestemming.'
              }
            ].map((faq, i) => (
              <div key={i} className="border-b border-white/[0.06] pb-6 last:border-0">
                <h3 className="text-xl font-bold text-white mb-3">{faq.q}</h3>
                <p className="text-neutral-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="vl-card p-8 lg:p-12 text-center bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Klaar om te Huren in Limburg?
          </h2>
          <p className="text-neutral-400 mb-8 max-w-2xl mx-auto">
            Registreer je nu en huur direct een premium auto in Zuid-Limburg.
            Vanaf €249 per week, all-in en zonder verrassingen!
          </p>
          <Link to="/registreren" className="vl-btn-primary text-lg px-8 py-4 inline-flex">
            <Car className="w-5 h-5" />
            Start Nu
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-neutral-500 mb-4">Vragen? Neem contact op!</p>
          <div className="flex justify-center gap-6">
            <a href="mailto:info@vlottr.eu" className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors">
              <Mail className="w-4 h-4" />
              info@vlottr.eu
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo variant="glow" size="sm" />
            <div className="flex gap-6 text-sm text-neutral-500">
              <Link to="/terms" className="hover:text-white transition-colors">Voorwaarden</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AutoHurenLimburg;
