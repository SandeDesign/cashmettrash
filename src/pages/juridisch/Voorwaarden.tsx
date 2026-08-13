// src/pages/juridisch/Voorwaarden.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import JuridischeLayout from '../../components/layout/JuridischeLayout';
import { BEDRIJF } from '../../utils/bedrijf';
import { formatCenten, GLAS_PRIJS_CENTEN, STATIEGELD_SERVICE_CENTEN } from '../../utils/constants';

const Voorwaarden: React.FC = () => (
  <JuridischeLayout
    titel="Algemene voorwaarden"
    inleiding="Wat je van ons mag verwachten en wat wij van jou verwachten."
  >
    <h2>1. Wie zijn wij?</h2>
    <p>
      {BEDRIJF.handelsnaam} is een dienst van {BEDRIJF.rechtspersoon}. Wij halen glas en
      statiegeld op bij mensen thuis. Het ophalen wordt uitgevoerd door Jayce, die daarvoor
      met de skelter langskomt.
    </p>

    <h2>2. Werkgebied</h2>
    <p>
      Wij halen op in {BEDRIJF.werkgebied}. Ligt je adres daarbuiten, dan kunnen we je
      aanvraag niet uitvoeren. Is er al betaald, dan krijg je het volledige bedrag terug.
    </p>

    <h2>3. Glas laten ophalen</h2>
    <ul>
      <li>
        Een ophaalbeurt kost <strong>{formatCenten(GLAS_PRIJS_CENTEN)}</strong>. Dat is per
        keer, niet per fles. Of je nu vijf of vijftig flessen klaarzet, de prijs blijft
        gelijk.
      </li>
      <li>Je betaalt vooraf in de app. Pas daarna staat de aanvraag klaar voor Jayce.</li>
      <li>
        Deze dienst is voor glas <strong>zonder</strong> statiegeldlogo, zoals wijnflessen,
        jampotten en sauspotten. Daar zit geen statiegeld op, dus je betaalt voor het ophalen
        en wegbrengen en krijgt voor het glas zelf niets terug.
      </li>
      <li>
        Glazen flessen waar wél statiegeld op zit, zoals bierflesjes uit een krat, nemen we
        niet mee. Die kun je bij de supermarkt inleveren en daar krijg je het statiegeld voor
        terug. Zet je ze toch bij het glas, dan laat Jayce ze staan.
      </li>
      <li>
        Zet het glas op een plek die vanaf de straat te bereiken is en geef in de opmerking
        door waar het staat. Wij komen niet binnen.
      </li>
      <li>Losse scherven en gebroken glas nemen we niet mee.</li>
    </ul>

    <h2>4. Statiegeld laten ophalen</h2>
    <ul>
      <li>Aanmelden is gratis.</li>
      <li>
        Je geeft zelf een schatting op van het aantal flessen en blikjes. Jayce telt bij het
        ophalen na. <strong>Zijn telling is bepalend</strong>, want die gaat mee naar de
        inleverautomaat.
      </li>
      <li>
        Het statiegeld gaat <strong>volledig en onaangeroerd naar jou</strong>. Het bedrag
        komt rechtstreeks uit de inleverautomaat via Viatim en kan door ons niet worden
        aangepast. Wij houden er niets van in.
      </li>
      <li>
        Je ontvangt het bedrag via een Tikkie, die wij in de chat in de app met je delen.
      </li>
      <li>
        Voor het ophalen brengen wij <strong>{formatCenten(STATIEGELD_SERVICE_CENTEN)}</strong>{' '}
        in rekening. Die betaal je achteraf, tegelijk met het delen van de Tikkie, en dus
        pas nadat er echt is opgehaald.
      </li>
      <li>
        Wij nemen alleen verpakkingen mee waar statiegeld op zit. Lege of beschadigde
        verpakkingen die de automaat weigert, leveren niets op.
      </li>
    </ul>

    <h2>5. Wanneer komen we langs?</h2>
    <p>
      Jayce plant zijn eigen ronde. Wij streven ernaar binnen enkele dagen langs te komen,
      maar geven daar geen garantie op. Je hoeft niet thuis te zijn. Je ziet in de app
      wanneer je aanvraag is afgevinkt.
    </p>

    <h2>6. Betalen</h2>
    <p>
      Betalingen lopen via Stripe. Je betaalgegevens vul je op de beveiligde pagina van
      Stripe in; wij zien of ontvangen ze nooit. Blijft een betaling uit, dan blijft de
      aanvraag openstaan en voeren wij hem niet uit.
    </p>

    <h2>7. Annuleren</h2>
    <ul>
      <li>
        Zolang een aanvraag nog niet is opgehaald, kun je hem laten annuleren via de chat.
        Betaalde ophaalkosten krijg je dan terug.
      </li>
      <li>
        Is de ophaalbeurt al uitgevoerd, dan is de dienst geleverd en vindt geen
        terugbetaling plaats.
      </li>
      <li>
        Zie ook je <Link to="/herroeping">herroepingsrecht</Link>.
      </li>
    </ul>

    <h2>8. Wat als er iets misgaat?</h2>
    <ul>
      <li>
        Zijn we er niet langs geweest terwijl je wel betaald hebt, laat het weten via de
        chat. Dan halen we het alsnog op of je krijgt je geld terug.
      </li>
      <li>
        Klopt het getelde aantal volgens jou niet, meld het dan binnen zeven dagen. We
        kijken er dan opnieuw naar.
      </li>
      <li>
        Wij zijn niet aansprakelijk voor schade die ontstaat doordat spullen buiten
        klaarstaan, bijvoorbeeld door weer, dieren of derden.
      </li>
      <li>
        Onze aansprakelijkheid is in alle gevallen beperkt tot het bedrag dat je voor de
        betreffende ophaalbeurt hebt betaald.
      </li>
    </ul>

    <h2>9. Je account</h2>
    <p>
      Houd je wachtwoord voor jezelf. Zorg dat je adres in de app klopt, want daar komen we
      langs. Bij misbruik van de dienst kunnen wij een account sluiten.
    </p>

    <h2>10. Wijzigingen</h2>
    <p>
      Wij kunnen deze voorwaarden aanpassen, bijvoorbeeld als de prijs verandert. De versie
      die geldt is de versie die op het moment van je aanvraag op deze pagina staat.
    </p>

    <h2>11. Toepasselijk recht</h2>
    <p>
      Op deze voorwaarden is Nederlands recht van toepassing. Komen we er samen niet uit,
      dan leggen we het geschil voor aan de bevoegde rechter in Nederland.
    </p>
  </JuridischeLayout>
);

export default Voorwaarden;
