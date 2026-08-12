// src/pages/juridisch/Herroeping.tsx
//
// Hoort samen met het verplichte vinkje in src/pages/klant/GlasAanvraag.tsx.
// Zonder die instemming blijft de bedenktijd van veertien dagen gewoon staan.

import React from 'react';
import { Link } from 'react-router-dom';
import JuridischeLayout from '../../components/layout/JuridischeLayout';
import { BEDRIJF } from '../../utils/bedrijf';
import { formatCenten, GLAS_PRIJS_CENTEN } from '../../utils/constants';

const Herroeping: React.FC = () => (
  <JuridischeLayout
    titel="Herroepingsrecht"
    inleiding="Je bedenktijd bij een online bestelling, en wanneer die vervalt."
  >
    <h2>Veertien dagen bedenktijd</h2>
    <p>
      Koop je online een dienst, dan heb je als consument veertien dagen bedenktijd. In die
      periode mag je zonder opgaaf van reden afzien van de bestelling en krijg je je geld
      terug. Dat geldt ook voor een ophaalbeurt bij {BEDRIJF.handelsnaam}.
    </p>

    <h2>Waarom je die bedenktijd bij ons vaak opgeeft</h2>
    <p>
      Een ophaalbeurt wil je meestal snel geregeld hebben, en zeker niet pas over twee
      weken. Daarom vragen we bij het aanvragen van een glas-ophaalbeurt om je uitdrukkelijke
      instemming dat we direct aan de slag gaan.
    </p>

    <div className="cmt-kader">
      Vink je dat aan, dan erken je dat je je herroepingsrecht verliest zodra de
      ophaalbeurt is uitgevoerd. Vink je het niet aan, dan kun je de aanvraag niet plaatsen.
    </div>

    <p>Concreet betekent dat:</p>
    <ul>
      <li>
        <strong>Nog niet opgehaald?</strong> Dan kun je binnen veertien dagen alsnog
        annuleren en krijg je de {formatCenten(GLAS_PRIJS_CENTEN)} volledig terug.
      </li>
      <li>
        <strong>Al opgehaald?</strong> Dan is de dienst geleverd en vervalt de bedenktijd.
        Er volgt geen terugbetaling.
      </li>
    </ul>

    <h2>En bij statiegeld?</h2>
    <p>
      Statiegeld aanmelden is gratis, dus daar valt niets te herroepen. De ophaalkosten
      betaal je pas nadat er is opgehaald. Ook daar geldt: is het eenmaal opgehaald, dan is
      de dienst geleverd.
    </p>

    <h2>Hoe herroep je?</h2>
    <p>
      Een bericht via de chat in de app is genoeg. Vermeld om welke aanvraag het gaat. Je
      hoeft geen formulier in te vullen, maar je mag het{' '}
      <a
        href="https://www.consuwijzer.nl/thema/modelformulier-voor-herroeping"
        target="_blank"
        rel="noopener noreferrer"
      >
        modelformulier voor herroeping
      </a>{' '}
      gebruiken als je dat prettiger vindt.
    </p>
    <p>
      Wij betalen binnen veertien dagen terug, via dezelfde betaalmethode als waarmee je
      hebt betaald. Daar zijn geen kosten aan verbonden.
    </p>

    <h2>Meer weten?</h2>
    <p>
      Lees ook de <Link to="/voorwaarden">algemene voorwaarden</Link>, met name het stuk over
      annuleren.
    </p>
  </JuridischeLayout>
);

export default Herroeping;
