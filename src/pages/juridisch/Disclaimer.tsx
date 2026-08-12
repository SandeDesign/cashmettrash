// src/pages/juridisch/Disclaimer.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import JuridischeLayout from '../../components/layout/JuridischeLayout';
import { BEDRIJF } from '../../utils/bedrijf';

const Disclaimer: React.FC = () => (
  <JuridischeLayout
    titel="Disclaimer"
    inleiding="De grenzen van wat deze dienst is en wat hij niet is."
  >
    <h2>Wat deze dienst wel is</h2>
    <p>
      {BEDRIJF.handelsnaam} is een kleinschalige buurtdienst in {BEDRIJF.werkgebied}. Wij
      halen glas en statiegeld op bij mensen thuis en brengen het weg.
    </p>

    <h2>Geen garantie op ophaaltijden</h2>
    <p>
      De ronde wordt met de skelter gereden en de planning hangt af van het weer, school en
      de hoeveelheid aanvragen. Wij doen ons best om snel langs te komen, maar geven geen
      garantie op een datum of tijdstip. Aan de statussen in de app kun je geen rechten
      ontlenen over wanneer er wordt opgehaald.
    </p>

    <h2>Wij zijn geen betaaldienst</h2>
    <p>
      Wij verwerken zelf geen betalingen en beheren geen geld voor jou. Betalingen aan ons
      lopen via Stripe. Het statiegeld dat jij terugkrijgt loopt via Tikkie, een dienst van
      ABN AMRO. Voor die betalingen gelden de voorwaarden van die partijen.
    </p>

    <h2>Het statiegeldbedrag ligt niet bij ons</h2>
    <p>
      Het bedrag dat je terugkrijgt komt rechtstreeks uit de inleverautomaat, via Viatim.
      Dat bedrag kunnen wij niet aanpassen, ook niet als je het er niet mee eens bent.
      Weigert de automaat een fles of een blikje, bijvoorbeeld omdat de streepjescode
      onleesbaar is of de verpakking beschadigd, dan levert die verpakking niets op.
    </p>

    <h2>Informatie op deze site</h2>
    <p>
      Wij stellen de teksten op deze site met zorg samen, maar kunnen niet garanderen dat
      alles altijd volledig en actueel is. Aan kennelijke fouten en verschrijvingen kunnen
      geen rechten worden ontleend. Prijzen kunnen wijzigen; leidend is wat er in de app
      staat op het moment dat je een aanvraag plaatst.
    </p>

    <h2>Links naar andere sites</h2>
    <p>
      In de app staan soms links naar andere partijen, zoals Tikkie of Google Maps. Wij
      hebben geen invloed op die sites en zijn niet verantwoordelijk voor hun inhoud of hun
      omgang met je gegevens.
    </p>

    <h2>Beschikbaarheid</h2>
    <p>
      Wij kunnen niet garanderen dat de app altijd bereikbaar is. Onderhoud, storingen bij
      onze leveranciers of problemen met je eigen internetverbinding kunnen de app tijdelijk
      onbruikbaar maken. Daarvoor zijn wij niet aansprakelijk.
    </p>

    <h2>Vragen</h2>
    <p>
      Zie de <Link to="/voorwaarden">algemene voorwaarden</Link> voor je rechten en de{' '}
      <Link to="/privacy">privacyverklaring</Link> voor het gebruik van je gegevens.
    </p>
  </JuridischeLayout>
);

export default Disclaimer;
