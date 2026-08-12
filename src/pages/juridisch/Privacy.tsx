// src/pages/juridisch/Privacy.tsx
//
// De opsommingen hier komen overeen met src/types/index.ts en firestore.rules.
// Wijzigt het datamodel, dan moet deze pagina mee.

import React from 'react';
import { Link } from 'react-router-dom';
import JuridischeLayout from '../../components/layout/JuridischeLayout';
import { BEDRIJF } from '../../utils/bedrijf';

const Privacy: React.FC = () => (
  <JuridischeLayout
    titel="Privacyverklaring"
    inleiding="Welke gegevens we van je bewaren, waarom dat nodig is, en wat je rechten zijn."
  >
    <h2>Wie is verantwoordelijk?</h2>
    <p>
      {BEDRIJF.rechtspersoon}, handelend onder de naam {BEDRIJF.handelsnaam}, is
      verantwoordelijk voor de verwerking van je gegevens.
    </p>
    <ul>
      <li>{BEDRIJF.rechtspersoon}</li>
      {BEDRIJF.adres && (
        <li>
          {BEDRIJF.adres}, {BEDRIJF.postcode} {BEDRIJF.plaats}
        </li>
      )}
      {BEDRIJF.kvk && <li>KvK-nummer: {BEDRIJF.kvk}</li>}
      {BEDRIJF.email && <li>E-mail: {BEDRIJF.email}</li>}
    </ul>

    <h2>Welke gegevens bewaren we?</h2>
    <table>
      <thead>
        <tr>
          <th>Gegevens</th>
          <th>Waarom</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Naam en e-mailadres</td>
          <td>Om je account aan te maken en je te kunnen bereiken</td>
        </tr>
        <tr>
          <td>Adres, postcode en woonplaats</td>
          <td>Zodat Jayce weet waar hij langs moet komen</td>
        </tr>
        <tr>
          <td>Telefoonnummer</td>
          <td>Om contact op te nemen als er iets onduidelijk is bij het ophalen</td>
        </tr>
        <tr>
          <td>Je aanvragen en meldingen</td>
          <td>
            Wat je hebt klaargezet, wanneer het is opgehaald en wat er geteld is
          </td>
        </tr>
        <tr>
          <td>Betaalstatus</td>
          <td>
            Of een ophaalbeurt betaald is. Je bank- of kaartgegevens komen nooit in onze
            app; die vul je uitsluitend in bij Stripe
          </td>
        </tr>
        <tr>
          <td>Chatberichten</td>
          <td>Om je vragen te kunnen beantwoorden en je Tikkie te kunnen sturen</td>
        </tr>
      </tbody>
    </table>

    <p>
      Je wachtwoord slaan wij niet op. Dat wordt versleuteld beheerd door Firebase
      Authentication; ook wij kunnen het niet inzien.
    </p>

    <h2>Waarom mogen we dit bewaren?</h2>
    <ul>
      <li>
        <strong>Om de afspraak uit te voeren.</strong> Zonder adres kunnen we niet ophalen,
        zonder betaalstatus weten we niet of een ophaalbeurt betaald is.
      </li>
      <li>
        <strong>Omdat de wet het verplicht.</strong> Betaalgegevens moeten we voor de
        belastingdienst zeven jaar bewaren.
      </li>
    </ul>

    <h2>Hoe lang bewaren we het?</h2>
    <ul>
      <li>Je account en adresgegevens: zolang je een account hebt.</li>
      <li>
        Aanvragen, meldingen en chatberichten: tot twee jaar na de laatste ophaalbeurt.
      </li>
      <li>
        Gegevens die bij een betaling horen: zeven jaar, vanwege de wettelijke
        bewaarplicht.
      </li>
    </ul>
    <p>
      Vraag je om verwijdering, dan wissen we alles wat we niet wettelijk moeten bewaren.
    </p>

    <h2>Wie ziet je gegevens?</h2>
    <p>
      Binnen CashMetTrash is de toegang beperkt, en dat is ook technisch afgedwongen in de
      beveiligingsregels van de database:
    </p>
    <ul>
      <li>
        <strong>Jayce</strong> ziet alleen wat hij nodig heeft om op te halen: je naam, je
        adres en wat er klaarstaat. Hij ziet geen bedragen, geen betaalgegevens en niet de
        chat.
      </li>
      <li>
        <strong>De beheerder</strong> ziet de aanvragen, de betaalstatus en de chat, om de
        administratie te doen en je Tikkie te sturen.
      </li>
      <li>
        <strong>Andere klanten</strong> zien nooit iets van jou.
      </li>
    </ul>

    <h3>Bedrijven die ons helpen</h3>
    <table>
      <thead>
        <tr>
          <th>Partij</th>
          <th>Waarvoor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Google Firebase</td>
          <td>Opslag van de gegevens en het inloggen. Servers in de Europese Unie</td>
        </tr>
        <tr>
          <td>Stripe</td>
          <td>
            Het afhandelen van betalingen. Je betaalgegevens vul je op de pagina van Stripe
            in, niet bij ons
          </td>
        </tr>
        <tr>
          <td>Vercel</td>
          <td>Het hosten van de website. Verwerkt daarbij IP-adressen in serverlogs</td>
        </tr>
        <tr>
          <td>Google Maps</td>
          <td>
            Alleen als Jayce op de navigatieknop drukt, gaat het ophaaladres mee naar Maps
          </td>
        </tr>
        <tr>
          <td>OpenStreetMap</td>
          <td>
            Levert de kaartbeelden. Die worden pas opgehaald op de schermen met een kaart, en
            alleen Jayce, zijn moeder en de beheerder krijgen die te zien
          </td>
        </tr>
        <tr>
          <td>OpenRouteService</td>
          <td>
            Berekent de veiligste fietsroute. Daarvoor gaan de coördinaten van de ophaaladressen
            mee, zonder naam of e-mailadres. Ook je adres wordt hier eenmalig omgezet naar
            coördinaten zodra je het invult of wijzigt
          </td>
        </tr>
      </tbody>
    </table>
    <p>
      Wat wij <strong>niet</strong> doen: we gebruiken geen analyseprogramma's, geen
      advertentienetwerken en geen trackers. Ook het lettertype van deze site staat op onze
      eigen server, zodat er bij het openen van de landingspagina en de juridische pagina's
      niets naar een derde partij gaat. Zie ook ons <Link to="/cookies">cookiebeleid</Link>.
    </p>

    <h2>Kinderen</h2>
    <p>
      De ophaalronde wordt gereden door een minderjarige, maar de dienst wordt aangeboden
      door {BEDRIJF.rechtspersoon}. Een account aanmaken doe je als volwassene, of met
      toestemming van een ouder of verzorger. Wij vragen bewust niet om de leeftijd van
      onze klanten, en verzamelen dus ook geen gegevens over kinderen.
    </p>

    <h2>Je rechten</h2>
    <p>Je mag ons altijd vragen om:</p>
    <ul>
      <li>een overzicht van wat we van je bewaren;</li>
      <li>onjuiste gegevens te corrigeren (je adres kun je zelf aanpassen in de app);</li>
      <li>je gegevens te verwijderen;</li>
      <li>je gegevens in een leesbaar bestand mee te geven;</li>
      <li>te stoppen met een bepaalde verwerking.</li>
    </ul>
    <p>
      Stuur je verzoek naar {BEDRIJF.email || 'het contactadres hierboven'} of stel je vraag
      via de chat in de app. Je krijgt binnen vier weken antwoord. Ben je het niet eens met
      hoe we ermee omgaan, dan kun je een klacht indienen bij de{' '}
      <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">
        Autoriteit Persoonsgegevens
      </a>
      .
    </p>

    <h2>Beveiliging</h2>
    <p>
      Alle verbindingen lopen via https. Wie wat mag zien is vastgelegd in de
      beveiligingsregels van de database en wordt op de server gecontroleerd, niet alleen in
      de app. Ontdek je toch een lek, laat het ons dan weten via de chat of per e-mail.
    </p>
  </JuridischeLayout>
);

export default Privacy;
