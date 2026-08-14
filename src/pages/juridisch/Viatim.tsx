// src/pages/juridisch/Viatim.tsx
//
// Uitleg over hoe het statiegeld wordt verwerkt. Dit is de vraag die mensen het
// vaakst stellen: waar blijft mijn statiegeld, en hoe weet ik dat ik het hele
// bedrag terugkrijg? Het antwoord is de keten hieronder, en die staat er daarom
// stap voor stap in.

import React from 'react';
import { Link } from 'react-router-dom';
import JuridischeLayout from '../../components/layout/JuridischeLayout';
import { BEDRIJF } from '../../utils/bedrijf';
import { formatCenten, STATIEGELD_SERVICE_CENTEN } from '../../utils/constants';

const Viatim: React.FC = () => (
  <JuridischeLayout
    titel="Hoe je statiegeld wordt verwerkt"
    inleiding="Van jouw voordeur tot het bedrag op je rekening, en wie daar onderweg bij betrokken is."
  >
    <h2>Kort samengevat</h2>
    <p>
      Jayce haalt je flessen en blikjes op. Wij leveren die in bij een inleverpunt van{' '}
      <a href="https://www.viatim.nl" target="_blank" rel="noopener noreferrer">
        Viatim
      </a>
      . Wat de inleverautomaat uitrekent gaat via een Tikkie volledig naar jou. Wij houden daar
      niets van in.
    </p>

    <h2>Wie is Viatim?</h2>
    <p>
      Viatim is een Nederlandse dienst voor het inleveren van statiegeldverpakkingen. In plaats
      van bij elke supermarkt een automaat te zoeken, lever je in bij een aangesloten punt. De
      automaat telt wat je inlevert en rekent het statiegeld uit. Dat bedrag ligt vast: het is
      wettelijk bepaald per verpakking, en niemand in de keten kan er iets aan veranderen.
    </p>
    <p>
      Wij zijn geen onderdeel van Viatim en Viatim is geen onderdeel van ons. Wij gebruiken hun
      inleverpunt om jouw verpakkingen te verwerken, zoals iedereen dat kan doen.
    </p>

    <h2>Wat doet {BEDRIJF.rechtspersoon} hierin?</h2>
    <p>
      {BEDRIJF.rechtspersoon} treedt op als <strong>verzamelpunt</strong>. Jayce rijdt zijn ronde
      op de skelter en verzamelt bij mensen in de buurt. Wat hij ophaalt gaat gebundeld naar het
      inleverpunt, in plaats van dat tien huishoudens ieder apart met een zak op pad moeten.
    </p>
    <p>Concreet doen wij drie dingen:</p>
    <ul>
      <li>
        <strong>Verzamelen.</strong> Jayce haalt op en telt wat er is. Zijn telling is wat meetelt,
        niet de schatting die je bij het aanmelden invulde.
      </li>
      <li>
        <strong>Inscannen.</strong> Wij leveren de verpakkingen in bij het Viatim-punt. De automaat
        bepaalt het bedrag.
      </li>
      <li>
        <strong>Doorbetalen.</strong> Dat bedrag sturen wij als Tikkie naar jou door, via de chat
        in de app.
      </li>
    </ul>

    <h2>Waarom je het hele bedrag terugkrijgt</h2>
    <p>
      Het bedrag komt rechtstreeks uit de inleverautomaat. Wij nemen dat over in de app en sturen
      er een Tikkie bij; er zit geen rekenstap tussen waarin wij iets zouden kunnen aanpassen.
      Precies daarom houden we de twee dingen streng gescheiden:
    </p>
    <ul>
      <li>
        <strong>Het statiegeld</strong> is en blijft van jou. Dat gaat volledig en onaangeroerd
        naar je terug.
      </li>
      <li>
        <strong>De ophaalkosten</strong> van {formatCenten(STATIEGELD_SERVICE_CENTEN)} betaal je
        apart in de app, en pas nadat er echt is opgehaald. Die worden nooit van je statiegeld
        afgetrokken.
      </li>
    </ul>
    <p>
      In de app zie je die twee dan ook los van elkaar staan. Je betaalt eerst de ophaalkosten, en
      daarna verschijnt de knop naar je Tikkie.
    </p>

    <h2>Waar staat dat in de app?</h2>
    <p>
      Alles loopt via <strong>Berichten</strong>. Zodra jouw statiegeld is ingeleverd zetten wij
      daar een bericht neer met het bedrag dat eruit kwam en de Tikkie erbij. Je krijgt er een
      melding van als je die hebt aangezet. Het staat dus niet in je e-mail en er komt geen
      losse betaalverzoek-app aan te pas.
    </p>

    <h2>Wat er niet mee kan</h2>
    <ul>
      <li>
        Glazen flessen met statiegeld, zoals bierflesjes uit een krat. De inleverautomaat van
        Viatim neemt plastic flessen en blikjes aan. Breng glas met statiegeld zelf naar de
        supermarkt, dan krijg je daar je geld.
      </li>
      <li>
        Beschadigde of platgedrukte verpakkingen. Kan de automaat de streepjescode niet lezen,
        dan levert die verpakking niets op.
      </li>
      <li>
        Verpakkingen zonder statiegeldlogo. Die tellen niet mee, ook al lijken ze erop.
      </li>
    </ul>

    <h2>Nog vragen?</h2>
    <p>
      Stel ze gerust via de chat in de app, of mail naar{' '}
      <a href={`mailto:${BEDRIJF.email}`}>{BEDRIJF.email}</a>. Zie ook de{' '}
      <Link to="/voorwaarden">algemene voorwaarden</Link> voor de afspraken op papier.
    </p>
  </JuridischeLayout>
);

export default Viatim;
