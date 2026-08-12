import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';

const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <header className="vl-card border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          <Link to="/" className="vl-btn-ghost inline-flex">
            <ArrowLeft className="w-4 h-4" />
            Terug naar Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Cookie className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Cookiebeleid</h1>
          <p className="text-neutral-400">Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>
        </div>

        <div className="vl-card p-8 lg:p-12 space-y-8 text-neutral-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Wat zijn cookies?</h2>
            <p>
              Cookies zijn kleine tekstbestanden die op uw computer of mobiele apparaat worden geplaatst wanneer u onze website bezoekt.
              Cookies helpen websites om uw voorkeuren te onthouden en de gebruikerservaring te verbeteren.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Welke cookies gebruiken wij?</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">2.1 Noodzakelijke cookies</h3>
                <p className="mb-2">Deze cookies zijn essentieel voor het functioneren van de website:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong className="text-white">Sessie cookies:</strong> Voor het bijhouden van uw login sessie</li>
                  <li><strong className="text-white">Authenticatie cookies:</strong> Voor het verifiëren van uw identiteit</li>
                  <li><strong className="text-white">Beveiligingscookies:</strong> Voor het beschermen tegen misbruik</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">2.2 Functionele cookies</h3>
                <p className="mb-2">Deze cookies verbeteren de functionaliteit van de website:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong className="text-white">Voorkeurscookies:</strong> Voor het onthouden van uw voorkeuren (bijv. taal)</li>
                  <li><strong className="text-white">Interface cookies:</strong> Voor het onthouden van UI-instellingen</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-3">2.3 Analytische cookies</h3>
                <p className="mb-2">Deze cookies helpen ons de website te verbeteren:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong className="text-white">Google Analytics:</strong> Voor het analyseren van websitegebruik (geanonimiseerd)</li>
                  <li><strong className="text-white">Prestatiemetingen:</strong> Voor het meten van laadtijden en prestaties</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Cookies van derden</h2>
            <p className="mb-4">Wij maken gebruik van cookies van derden voor:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Firebase:</strong> Voor authenticatie en database services</li>
              <li><strong className="text-white">Betalingsproviders:</strong> Voor het verwerken van betalingen</li>
              <li><strong className="text-white">Google Analytics:</strong> Voor websitestatistieken (geanonimiseerd)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Cookies beheren</h2>
            <p className="mb-4">
              U kunt cookies beheren via uw browserinstellingen. Let op: het uitschakelen van bepaalde cookies
              kan de functionaliteit van de website beperken.
            </p>
            <div className="space-y-2">
              <p><strong className="text-white">Chrome:</strong> Instellingen → Privacy en beveiliging → Cookies</p>
              <p><strong className="text-white">Firefox:</strong> Opties → Privacy & Beveiliging → Cookies</p>
              <p><strong className="text-white">Safari:</strong> Voorkeuren → Privacy → Cookies</p>
              <p><strong className="text-white">Edge:</strong> Instellingen → Cookies en sitegegevens</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Bewaartermijn</h2>
            <p className="mb-4">De bewaartermijn van cookies verschilt:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-white">Sessiecookies:</strong> Worden verwijderd na het sluiten van de browser</li>
              <li><strong className="text-white">Permanente cookies:</strong> Blijven maximaal 1 jaar bewaard</li>
              <li><strong className="text-white">Authenticatiecookies:</strong> 30 dagen (of tot uitloggen)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Wijzigingen</h2>
            <p>
              Wij kunnen dit cookiebeleid van tijd tot tijd aanpassen. De meest recente versie is altijd
              te vinden op deze pagina.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Contact</h2>
            <p>
              Voor vragen over ons cookiebeleid kunt u contact opnemen via:
              <br /><br />
              <strong className="text-white">Email:</strong> privacy@vlottr.eu
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="vl-btn-secondary inline-flex">
            <ArrowLeft className="w-4 h-4" />
            Terug naar Home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CookiePolicy;
