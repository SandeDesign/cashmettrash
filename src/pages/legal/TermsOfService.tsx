import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      {/* Header */}
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
            <FileText className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Algemene Voorwaarden</h1>
          <p className="text-neutral-400">Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>
        </div>

        <div className="vl-card p-8 lg:p-12 space-y-8 text-neutral-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Definities</h2>
            <p className="mb-4">In deze algemene voorwaarden wordt verstaan onder:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Vlottr:</strong> De verhuurder, gevestigd in Nederland</li>
              <li><strong className="text-white">Huurder:</strong> De persoon die een voertuig huurt via Vlottr</li>
              <li><strong className="text-white">Voertuig:</strong> De auto die wordt verhuurd</li>
              <li><strong className="text-white">Huurovereenkomst:</strong> De overeenkomst tussen Vlottr en de huurder</li>
              <li><strong className="text-white">Huurperiode:</strong> De overeengekomen periode waarvoor het voertuig wordt verhuurd (minimaal 1 week)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Toepasselijkheid</h2>
            <p className="mb-4">
              Deze algemene voorwaarden zijn van toepassing op alle huurovereenkomsten tussen Vlottr en de huurder.
              Door het aangaan van een huurovereenkomst verklaart de huurder akkoord te gaan met deze voorwaarden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Huurvoorwaarden</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">3.1 Minimale huurperiode</h3>
                <p>De minimale huurperiode bedraagt 1 week (7 dagen). Kortere periodes zijn niet mogelijk.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">3.2 Leeftijdseis</h3>
                <p>De huurder dient minimaal 18 jaar oud te zijn en in het bezit van een geldig Nederlands rijbewijs (categorie B) dat minimaal 1 jaar geleden is afgegeven.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">3.3 Verificatie</h3>
                <p>Voor aanvang van de huur dient de huurder een geldig rijbewijs en identiteitsbewijs te tonen. Deze documenten worden geverifieerd door Vlottr.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Betaling</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">4.1 Huurprijs</h3>
                <p>De huurprijs wordt berekend op basis van de huurperiode en het gekozen voertuig. Alle prijzen zijn inclusief BTW.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">4.2 Borg</h3>
                <p>Bij het ophalen van het voertuig dient een borg te worden betaald. De hoogte van de borg is afhankelijk van het voertuig en wordt vooraf gecommuniceerd.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">4.3 Betalingsmethoden</h3>
                <p>Betaling kan plaatsvinden via iDEAL, creditcard of bankoverschrijving.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Gebruik van het voertuig</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">5.1 Zorgplicht</h3>
                <p>De huurder dient het voertuig als een goed huisvader te gebruiken en te behandelen.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">5.2 Verboden gebruik</h3>
                <p className="mb-2">Het is de huurder verboden om:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Het voertuig te gebruiken voor commerciële doeleinden zonder toestemming</li>
                  <li>Het voertuig onder invloed van alcohol of drugs te besturen</li>
                  <li>Het voertuig aan derden ter beschikking te stellen</li>
                  <li>Deel te nemen aan races of wedstrijden</li>
                  <li>Het voertuig buiten Nederland te gebruiken zonder voorafgaande toestemming</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Schade en ongevallen</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">6.1 Meldplicht</h3>
                <p>Bij schade of een ongeval dient de huurder dit onmiddellijk te melden aan Vlottr en de politie (indien van toepassing).</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">6.2 Aansprakelijkheid</h3>
                <p>De huurder is aansprakelijk voor alle schade aan het voertuig tijdens de huurperiode, tenzij deze schade niet aan de huurder is toe te rekenen.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Annulering</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">7.1 Door de huurder</h3>
                <p className="mb-2">Bij annulering gelden de volgende voorwaarden:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Meer dan 14 dagen voor aanvang: 100% restitutie</li>
                  <li>7-14 dagen voor aanvang: 50% restitutie</li>
                  <li>Minder dan 7 dagen voor aanvang: geen restitutie</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">7.2 Door Vlottr</h3>
                <p>Vlottr behoudt zich het recht voor een reservering te annuleren bij overmacht. In dat geval ontvangt de huurder volledige restitutie.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Geschillen</h2>
            <p className="mb-4">
              Op alle overeenkomsten tussen Vlottr en de huurder is Nederlands recht van toepassing.
              Geschillen zullen worden voorgelegd aan de bevoegde rechter in Nederland.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Contact</h2>
            <p>
              Voor vragen over deze algemene voorwaarden kunt u contact opnemen via:
              <br />
              <strong className="text-white">Email:</strong> info@vlottr.eu
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

export default TermsOfService;
