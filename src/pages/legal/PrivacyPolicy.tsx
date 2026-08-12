import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Privacybeleid</h1>
          <p className="text-neutral-400">Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}</p>
        </div>

        <div className="vl-card p-8 lg:p-12 space-y-8 text-neutral-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Inleiding</h2>
            <p>
              Vlottr hecht veel waarde aan de bescherming van uw persoonsgegevens. In dit privacybeleid leggen wij uit
              welke persoonsgegevens wij verzamelen, waarom we deze verzamelen en hoe we deze gebruiken.
              Dit privacybeleid is opgesteld in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Verantwoordelijke</h2>
            <p>
              Vlottr is de verantwoordelijke voor de verwerking van uw persoonsgegevens.
              <br /><br />
              <strong className="text-white">Contactgegevens:</strong><br />
              Email: privacy@vlottr.eu
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Welke gegevens verzamelen wij?</h2>
            <p className="mb-4">Wij verzamelen de volgende categorieën persoonsgegevens:</p>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">3.1 Accountgegevens</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Naam en voornaam</li>
                  <li>E-mailadres</li>
                  <li>Telefoonnummer</li>
                  <li>Adresgegevens</li>
                  <li>Geboortedatum</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">3.2 Rijbewijsgegevens</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Rijbewijsnummer</li>
                  <li>Afgiftedatum en vervaldatum</li>
                  <li>Foto's van het rijbewijs (voor- en achterkant)</li>
                  <li>Naam zoals vermeld op het rijbewijs</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">3.3 Boekingsgegevens</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Huurperiode</li>
                  <li>Gekozen voertuig</li>
                  <li>Betalingsgegevens</li>
                  <li>Contractinformatie</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white mb-2">3.4 Technische gegevens</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>IP-adres</li>
                  <li>Browser type en versie</li>
                  <li>Apparaatinformatie</li>
                  <li>Gebruiksgegevens van de website/app</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Waarom verwerken wij uw gegevens?</h2>
            <p className="mb-4">Wij verwerken uw persoonsgegevens voor de volgende doeleinden:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Uitvoering van de huurovereenkomst:</strong> Voor het verwerken van uw boeking en het beheren van uw account</li>
              <li><strong className="text-white">Verificatie:</strong> Voor het controleren van uw identiteit en rijbewijs ter beveiliging</li>
              <li><strong className="text-white">Betalingsverwerking:</strong> Voor het verwerken van betalingen en borgstortingen</li>
              <li><strong className="text-white">Klantenservice:</strong> Voor het beantwoorden van vragen en het verlenen van support</li>
              <li><strong className="text-white">Verbetering van diensten:</strong> Voor het analyseren en verbeteren van onze dienstverlening</li>
              <li><strong className="text-white">Wettelijke verplichtingen:</strong> Voor het voldoen aan wettelijke verplichtingen zoals belastingwetgeving</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Rechtsgrondslag</h2>
            <p className="mb-4">Wij verwerken uw persoonsgegevens op basis van:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Uitvoering overeenkomst:</strong> De verwerking is noodzakelijk voor de uitvoering van de huurovereenkomst</li>
              <li><strong className="text-white">Wettelijke verplichting:</strong> De verwerking is noodzakelijk om te voldoen aan wettelijke verplichtingen</li>
              <li><strong className="text-white">Gerechtvaardigd belang:</strong> De verwerking is noodzakelijk voor ons gerechtvaardigd belang (bijv. fraudepreventie)</li>
              <li><strong className="text-white">Toestemming:</strong> Voor marketing en nieuwsbrieven (alleen met uw expliciete toestemming)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Bewaartermijn</h2>
            <p className="mb-4">Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Accountgegevens:</strong> Tot 2 jaar na uw laatste activiteit, tenzij u eerder verwijdering aanvraagt</li>
              <li><strong className="text-white">Boekingsgegevens:</strong> 7 jaar (conform fiscale wetgeving)</li>
              <li><strong className="text-white">Rijbewijsgegevens:</strong> Tot verificatie is voltooid + 1 jaar</li>
              <li><strong className="text-white">Technische gegevens:</strong> Maximaal 1 jaar</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Delen van gegevens</h2>
            <p className="mb-4">
              Wij verkopen uw gegevens nooit aan derden. Wij delen alleen gegevens met:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Betalingsproviders:</strong> Voor het verwerken van betalingen (bijv. Stripe, Mollie)</li>
              <li><strong className="text-white">Hostingproviders:</strong> Voor het hosten van onze website en databases (bijv. Firebase)</li>
              <li><strong className="text-white">Email providers:</strong> Voor het verzenden van transactionele emails</li>
              <li><strong className="text-white">Wettelijke autoriteiten:</strong> Indien wettelijk verplicht</li>
            </ul>
            <p className="mt-4">
              Al deze partijen handelen als verwerker en mogen uw gegevens niet voor eigen doeleinden gebruiken.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Beveiliging</h2>
            <p>
              Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen tegen
              verlies, misbruik of ongeautoriseerde toegang, waaronder:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-4">
              <li>SSL/TLS encryptie voor alle datatransmissie</li>
              <li>Versleutelde opslag van gevoelige gegevens</li>
              <li>Toegangscontroles en authenticatie</li>
              <li>Regelmatige beveiligingsupdates</li>
              <li>Logging en monitoring van toegang</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Uw rechten</h2>
            <p className="mb-4">Op grond van de AVG heeft u de volgende rechten:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Recht op inzage:</strong> U kunt opvragen welke gegevens wij van u verwerken</li>
              <li><strong className="text-white">Recht op correctie:</strong> U kunt onjuiste gegevens laten corrigeren</li>
              <li><strong className="text-white">Recht op verwijdering:</strong> U kunt verzoeken uw gegevens te verwijderen</li>
              <li><strong className="text-white">Recht op beperking:</strong> U kunt verzoeken de verwerking te beperken</li>
              <li><strong className="text-white">Recht op dataportabiliteit:</strong> U kunt uw gegevens in een gestructureerd formaat opvragen</li>
              <li><strong className="text-white">Recht van bezwaar:</strong> U kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang</li>
            </ul>
            <p className="mt-4">
              Om gebruik te maken van deze rechten, kunt u contact opnemen via privacy@vlottr.eu
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Cookies</h2>
            <p>
              Wij gebruiken functionele en analytische cookies om de website te laten functioneren en om
              gebruikersstatistieken bij te houden. Voor meer informatie, zie ons{' '}
              <Link to="/cookie-policy" className="text-green-400 hover:text-green-300 underline">
                Cookiebeleid
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Klachten</h2>
            <p>
              Als u een klacht heeft over de verwerking van uw persoonsgegevens, dan horen wij dat graag.
              U kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Wijzigingen</h2>
            <p>
              Wij kunnen dit privacybeleid van tijd tot tijd aanpassen. De meest recente versie is altijd
              te vinden op deze pagina. Bij belangrijke wijzigingen zullen wij u hiervan op de hoogte stellen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact</h2>
            <p>
              Voor vragen over dit privacybeleid of over de verwerking van uw persoonsgegevens kunt u contact opnemen:
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

export default PrivacyPolicy;
