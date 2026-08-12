// src/pages/juridisch/Cookies.tsx
//
// Bewust in gewone taal geschreven, want de app wordt ook gebruikt door kinderen
// en door hun ouders. Alles wat hier staat is feitelijk nagelopen: de app heeft
// geen analytics, geen advertentiecookies en geen third-party scripts.

import React from 'react';
import { Link } from 'react-router-dom';
import JuridischeLayout from '../../components/layout/JuridischeLayout';

const Cookies: React.FC = () => (
  <JuridischeLayout
    titel="Cookies, in gewone taal"
    inleiding="Hier staat wat CashMetTrash op jouw telefoon of computer opslaat. Zonder moeilijke woorden."
  >
    <h2>Wat is een cookie eigenlijk?</h2>
    <p>
      Een cookie is een klein briefje dat een website voor zichzelf opschrijft en op jouw
      apparaat bewaart. De volgende keer dat je langskomt, leest de site dat briefje
      terug. Zo weet hij weer wie je bent.
    </p>
    <p>
      Vergelijk het met een stempelkaart bij de bakker. De bakker weet niet waar je verder
      nog boodschappen doet, hij ziet alleen zijn eigen kaartje.
    </p>

    <div className="cmt-kader">
      <strong>Het korte antwoord:</strong> wij slaan alleen op wat nodig is om de app te
      laten werken. We volgen je niet, we tonen geen advertenties, en we verkopen niets
      door. Je hoeft dus niets aan of uit te zetten.
    </div>

    <h2>Wat bewaren we wel?</h2>

    <h3>1. Dat je ingelogd bent</h3>
    <p>
      Als je inlogt onthouden we dat, zodat je niet elke keer opnieuw je e-mailadres en
      wachtwoord hoeft in te typen. Dit blijft staan tot je op <strong>Uitloggen</strong> klikt.
    </p>

    <h3>2. Foutmeldingen</h3>
    <p>
      Gaat er iets mis in de app, dan schrijft hij kort op wát er misging. Dat helpt bij het
      repareren. Dit briefje blijft op jouw eigen apparaat staan en wordt nergens naartoe
      gestuurd. Het bevat geen namen of adressen.
    </p>

    <h3>3. De app zelf</h3>
    <p>
      Het logo, de kleuren en de opmaak worden bewaard zodat de app snel opent, ook als je
      even geen internet hebt. Dat zijn geen persoonlijke gegevens, alleen plaatjes en
      opmaak.
    </p>

    <h2>Wat bewaren we niet?</h2>
    <ul>
      <li>Geen advertentiecookies. Je krijgt hier nooit reclame te zien.</li>
      <li>Geen meetprogramma's zoals Google Analytics. We houden niet bij hoe vaak je klikt.</li>
      <li>Geen knoppen van sociale media die stiekem meekijken.</li>
      <li>We geven je gegevens niet door aan andere bedrijven om er geld mee te verdienen.</li>
    </ul>
    <p>
      Ook het lettertype van deze site staat op onze eigen server. Bij veel websites wordt
      dat bij een ander bedrijf opgehaald, waardoor dat bedrijf ziet dat jij langskomt.
      Dat gebeurt hier niet.
    </p>
    <p>
      Eén ding komt wel van buiten: de <strong>kaart</strong>. Die tekenen we met plaatjes van
      OpenStreetMap, en de route rekent OpenRouteService uit. Dat gebeurt alleen op de
      schermen met een kaart erop, en die zijn er voor Jayce, zijn moeder en de beheerder.
      Als klant kom je er niet, dus voor jou verandert er niets.
    </p>

    <h2>Waarom is er dan toch een melding onderaan?</h2>
    <p>
      Omdat we het gewoon eerlijk willen vertellen. Voor de dingen die we opslaan hoeven we
      volgens de wet geen toestemming te vragen, want zonder die dingen werkt de app niet.
      De melding is dus een mededeling, geen keuze die je moet maken.
    </p>

    <h2>Hoe gooi je alles weg?</h2>
    <p>
      Dat kun je zelf doen, wij hoeven daar niets voor te doen:
    </p>
    <ul>
      <li>
        <strong>Uitloggen</strong> in de app wist meteen je inlogbriefje en de foutmeldingen.
      </li>
      <li>
        In je browser kun je alle opgeslagen gegevens wissen. Zoek in de instellingen naar
        <em> Geschiedenis wissen</em> of <em>Browsergegevens wissen</em>.
      </li>
      <li>
        Heb je de app op je beginscherm gezet? Dan verwijder je hem net als elke andere app.
      </li>
    </ul>
    <p>
      Wis je alles, dan moet je daarna opnieuw inloggen. Je aanvragen en je statiegeld raak
      je niet kwijt: die staan veilig op de server, niet op je telefoon.
    </p>

    <h2>Vragen?</h2>
    <p>
      Stel ze gerust via de chat in de app, of lees verder in onze{' '}
      <Link to="/privacy">privacyverklaring</Link>. Daar staat uitgebreider welke gegevens
      we bewaren en waarom.
    </p>
  </JuridischeLayout>
);

export default Cookies;
