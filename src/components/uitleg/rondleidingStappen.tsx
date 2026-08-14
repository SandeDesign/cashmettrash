// src/components/uitleg/rondleidingStappen.tsx
//
// De inhoud van de rondleiding, per rol. Bewust hier apart van het venster, want
// dit is tekst die vaak bijgewerkt wordt en de rest niet.
//
// De pagina's van Jayce zijn voor een tienjarige geschreven, en zijn rondleiding
// dus ook: korte zinnen, "je" en "jij", en geen woorden als melding of status.

import React from 'react';
import {
  Bell,
  CalendarClock,
  Check,
  Coins,
  Hand,
  Heart,
  Lightbulb,
  ListChecks,
  MapPin,
  MessageSquare,
  Recycle,
  ScanLine,
  Search,
  ShieldAlert,
  Smartphone,
  Star,
  Wallet,
  Wine,
} from 'lucide-react';
import { formatCenten, GLAS_PRIJS_CENTEN, STATIEGELD_SERVICE_CENTEN } from '../../utils/constants';
import type { Rol } from '../../types';

export interface RondleidingStap {
  /** Icoon boven de titel. */
  icon: React.ReactNode;
  titel: string;
  /** Eén of meer alinea's. */
  tekst: React.ReactNode;
  /** Welke geldstroom de kleuren volgen. */
  flow?: 'glas' | 'stat';
  /** Knop die naar de bijbehorende pagina springt en de rondleiding sluit. */
  naar?: string;
  knop?: string;
}

const klantStappen: RondleidingStap[] = [
  {
    icon: <Hand className="w-7 h-7" />,
    titel: 'Welkom bij CashMetTrash',
    tekst: (
      <>
        <p>
          Jayce is een jongen uit Tilburg die bij mensen in de buurt lege flessen ophaalt. Hij
          rijdt zijn rondje op een skelter.
        </p>
        <p>
          In deze uitleg laten we in een paar stapjes zien hoe het werkt. Je kunt hem later
          altijd opnieuw openen met het vraagteken bovenaan.
        </p>
      </>
    ),
  },
  {
    icon: <Wine className="w-7 h-7" />,
    titel: 'Glas: jij betaalt',
    flow: 'glas',
    tekst: (
      <>
        <p>
          Wijnflessen, jampotten en sauspotten: alles van glas <strong>zonder</strong>{' '}
          statiegeldlogo. Daar zit geen statiegeld op, dus het levert niets op. Je betaalt Jayce
          voor het ophalen en wegbrengen.
        </p>
        <p>
          Dat kost <strong>{formatCenten(GLAS_PRIJS_CENTEN)} per keer</strong>, en niet per fles.
          Vijf flessen of vijftig, de prijs blijft hetzelfde. Je rekent meteen af in de app, of je
          geeft het contant mee aan Jayce als hij langskomt.
        </p>
      </>
    ),
    naar: '/glas',
    knop: 'Laat de glas-pagina zien',
  },
  {
    icon: <Recycle className="w-7 h-7" />,
    titel: 'Statiegeld: jij krijgt',
    flow: 'stat',
    tekst: (
      <>
        <p>
          <strong>Plastic</strong> flessen en blikjes mét het statiegeldlogo. Dat geld is van jou
          en blijft van jou. Aanmelden is gratis.
        </p>
        <p>
          Geef ongeveer aan wat er staat, precies hoeft niet. Jayce telt bij het ophalen zelf na,
          en dat aantal telt.
        </p>
      </>
    ),
    naar: '/statiegeld',
    knop: 'Laat de statiegeld-pagina zien',
  },
  {
    icon: <Search className="w-7 h-7" />,
    titel: 'Glas of statiegeld?',
    tekst: (
      <>
        <p>
          Kijk naar het <strong>statiegeldlogo</strong> en niet naar het soort fles. Logo erop is
          statiegeld, geen logo is glas.
        </p>
        <p>
          Pas op met bierflesjes: die zijn van glas, maar op de flesjes uit een krat zit wél
          statiegeld. Die horen dus bij geen van beide. Breng die zelf naar de supermarkt, daar
          krijg je je geld voor terug.
        </p>
      </>
    ),
  },
  {
    icon: <CalendarClock className="w-7 h-7" />,
    titel: 'Wanneer komt hij langs?',
    tekst: (
      <>
        <p>
          Bij het aanmelden kies je een van de ophaaltijden. Dat is verplicht, want er moet
          iemand thuis zijn als Jayce aanbelt.
        </p>
        <p>
          Jayce plant zijn ronde zelf, dus je keuze is een voorkeur en geen harde afspraak.
          Zodra hij bevestigt krijg je een seintje en zie je in je overzicht wanneer hij echt
          komt. <strong>Zorg dat je dan thuis bent.</strong>
        </p>
      </>
    ),
  },
  {
    icon: <Wallet className="w-7 h-7" />,
    titel: 'Je geld terug',
    flow: 'stat',
    tekst: (
      <>
        <p>
          Jayce brengt alles naar de inleverautomaat. Wat daar uitkomt krijg je{' '}
          <strong>helemaal</strong> terug via een Tikkie. We kunnen dat bedrag niet aanpassen.
        </p>
        <p>
          De Tikkie komt bij je berichten te staan. Betaal daar eerst de{' '}
          {formatCenten(STATIEGELD_SERVICE_CENTEN)} ophaalkosten, dan verschijnt de knop om je
          Tikkie te openen. Je betaalt dus pas iets nadat hij echt is langs geweest.
        </p>
        <p>
          Wil je dat sneller? Kies bij het aanmelden voor contant en geef Jayce{' '}
          {formatCenten(STATIEGELD_SERVICE_CENTEN)} mee. Zodra zijn moeder bevestigt dat hij het
          geld heeft, staat je Tikkie meteen open.
        </p>
      </>
    ),
    naar: '/chat',
    knop: 'Laat mijn berichten zien',
  },
  {
    icon: <MessageSquare className="w-7 h-7" />,
    titel: 'Iets vragen?',
    tekst: (
      <p>
        Bij Berichten stel je gewoon je vraag. Daar antwoordt de beheerder, niet Jayce: geldzaken
        houden we bij hem weg.
      </p>
    ),
  },
  {
    icon: <Bell className="w-7 h-7" />,
    titel: 'Blijf op de hoogte',
    tekst: (
      <>
        <p>
          Zet meldingen aan op je overzicht, dan hoor je het meteen als Jayce langskomt of als je
          Tikkie klaarstaat.
        </p>
        <p>
          Je kunt de app ook op je telefoon zetten alsof het een gewone app is. Kijk daarvoor
          in het menu bij <strong>Op je telefoon</strong>.
        </p>
      </>
    ),
    naar: '/mijn',
    knop: 'Naar mijn overzicht',
  },
];

const jayceStappen: RondleidingStap[] = [
  {
    icon: <Hand className="w-7 h-7" />,
    titel: 'Hoi Jayce!',
    tekst: (
      <>
        <p>Dit is jouw app. Hier zie je waar je heen moet en wat je moet ophalen.</p>
        <p>
          We lopen het even samen door. Snap je later iets niet meer? Druk dan op het vraagteken
          bovenaan, dan kun je dit opnieuw lezen.
        </p>
      </>
    ),
  },
  {
    icon: <ListChecks className="w-7 h-7" />,
    titel: 'Je lijstje',
    tekst: (
      <>
        <p>Op je eerste pagina staat wat er voor je klaarstaat. Bij elk kaartje zie je:</p>
        <ul>
          <li>bij wie je moet zijn</li>
          <li>welk adres dat is</li>
          <li>of het flessen van glas zijn, of flesjes en blikjes</li>
        </ul>
      </>
    ),
  },
  {
    icon: <CalendarClock className="w-7 h-7" />,
    titel: 'Zeg wanneer je komt',
    tekst: (
      <>
        <p>
          Druk op <strong>Ik ga het halen</strong>. Dan kies je een dag en een tijd. Die tijden
          zet mama of papa voor je klaar.
        </p>
        <p>
          Soms staat erbij welke dag ze zelf graag willen. Kan dat niet? Kies dan gewoon iets
          anders, dat mag.
        </p>
      </>
    ),
  },
  {
    icon: <MapPin className="w-7 h-7" />,
    titel: 'De weg vinden',
    tekst: (
      <>
        <p>
          Bij elk adres staat een knop <strong>Laat me de weg zien</strong>. Er klapt dan een
          kaartje open in de app zelf, met een zwarte stip voor thuis en een groene voor waar
          je heen moet.
        </p>
        <p>
          Bij Route zie je je rondje per dag. Bovenaan kies je de dag, daaronder staan de adressen
          op volgorde met een nummer erbij. Er staat alleen op wat je zelf hebt ingepland. Staat er
          een waarschuwing bij dat mama mee moet? Ga dan niet alleen.
        </p>
      </>
    ),
    naar: '/jayce/route',
    knop: 'Laat mijn route zien',
  },
  {
    icon: <Recycle className="w-7 h-7" />,
    titel: 'Tellen',
    flow: 'stat',
    tekst: (
      <>
        <p>Bij flesjes en blikjes tel je hoeveel je hebt meegenomen.</p>
        <p>
          Er staat al een getal ingevuld, want ze hebben zelf een gok gedaan. Klopt dat niet? Tik
          dan het goede getal in. Jouw getal is het getal dat telt.
        </p>
      </>
    ),
  },
  {
    icon: <Check className="w-7 h-7" />,
    titel: 'Afvinken',
    tekst: (
      <p>
        Heb je alles in je skelter? Druk dan op <strong>Ik heb het opgehaald</strong>. Het kaartje
        verdwijnt van je lijstje en papa ziet dat je klaar bent.
      </p>
    ),
  },
  {
    icon: <Coins className="w-7 h-7" />,
    titel: 'Soms krijg je geld mee',
    tekst: (
      <>
        <p>
          Bij sommige adressen staat dat je geld meekrijgt, met het bedrag erbij. Neem dat aan en
          stop het goed weg.
        </p>
        <p>
          Thuis geef je het aan mama. Zij vinkt het af in haar app. Dat geld is niet voor jou, het
          hoort bij het ophalen.
        </p>
      </>
    ),
  },
  {
    icon: <Heart className="w-7 h-7" />,
    titel: 'Bekenden',
    tekst: (
      <p>
        Sommige mensen kennen jou goed. Die staan bij Bekenden. Zij mogen hun statiegeld aan jou
        geven in plaats van het zelf te houden. Lief hè?
      </p>
    ),
    naar: '/jayce/bekenden',
    knop: 'Wie zijn dat dan?',
  },
  {
    icon: <Star className="w-7 h-7" />,
    titel: 'Jouw score',
    tekst: (
      <>
        <p>
          Bij Mijn score zie je hoe vaak je op pad bent geweest en hoeveel flesjes je hebt
          opgehaald.
        </p>
        <p>
          Daar staat ook je potje: het geld dat mensen aan jou hebben gegeven. Papa bewaart dat
          voor je.
        </p>
      </>
    ),
    naar: '/jayce/score',
    knop: 'Laat mijn score zien',
  },
  {
    icon: <Bell className="w-7 h-7" />,
    titel: 'Een seintje krijgen',
    tekst: (
      <p>
        Onderaan je lijstje staat een knop om meldingen aan te zetten. Dan piept je telefoon als
        er weer iets voor je klaarstaat. Handig, want dan hoef je niet steeds te kijken.
      </p>
    ),
    naar: '/jayce',
    knop: 'Terug naar mijn lijstje',
  },
];

const moederStappen: RondleidingStap[] = [
  {
    icon: <Hand className="w-7 h-7" />,
    titel: 'Welkom',
    tekst: (
      <>
        <p>
          Jij kijkt mee met de ronde van Jayce. Je ziet wat hij moet doen, je bepaalt wanneer hij
          mag, en je wijst aan waar hij niet langs mag.
        </p>
        <p>
          Daarnaast scan je het statiegeld in bij Viatim en vink je af als iemand de ophaalkosten
          contant heeft meegegeven.
        </p>
        <p>
          Wat je hier <strong>niet</strong> ziet: de chat met klanten en de administratie. Dat
          hoort bij de beheerder.
        </p>
      </>
    ),
  },
  {
    icon: <ShieldAlert className="w-7 h-7" />,
    titel: 'Waar moet je mee?',
    tekst: (
      <>
        <p>
          Bovenaan je overzicht staat bij welke ritten je mee moet. Dat is niet zomaar een lijstje:
          de app rekent het uit.
        </p>
        <p>
          Je moet mee als het allebei geldt: het adres ligt <strong>buiten de straal</strong> waar
          hij alleen mag, <strong>én</strong> er staat veel klaar. Is het maar één van de twee, dan
          kan hij het zelf.
        </p>
      </>
    ),
    naar: '/mama',
    knop: 'Laat de ronde zien',
  },
  {
    icon: <ScanLine className="w-7 h-7" />,
    titel: 'Inscannen bij Viatim',
    flow: 'stat',
    tekst: (
      <>
        <p>
          Wat Jayce heeft opgehaald scan jij in bij Viatim. Op de pagina Inscannen staat per klant
          wat hij heeft meegenomen. Viatim rekent het bedrag uit en maakt zelf de Tikkie aan; jij
          neemt dat bedrag over en plakt de Tikkie-link uit Viatim erbij.
        </p>
        <p>
          Daarna staat het klaar voor de beheerder; hij stuurt het bericht naar de klant. De
          inloggegevens van Viatim krijg je van hem, die zetten we bewust niet in deze app.
        </p>
      </>
    ),
    naar: '/mama/scannen',
    knop: 'Naar het inscannen',
  },
  {
    icon: <Coins className="w-7 h-7" />,
    titel: 'Contant geld',
    flow: 'stat',
    tekst: (
      <>
        <p>
          Een klant kan het geld meegeven aan Jayce in plaats van in de app te betalen. Dat kan
          bij glas ({formatCenten(GLAS_PRIJS_CENTEN)} voor de ophaalbeurt) en bij statiegeld (
          {formatCenten(STATIEGELD_SERVICE_CENTEN)} ophaalkosten). Jayce geeft dat geld thuis aan
          jou.
        </p>
        <p>
          Vink op de pagina Contant af dat je het hebt gekregen. Pas dan telt het als betaald, en
          bij statiegeld komt daarna ook de Tikkie bij de klant vrij.
        </p>
      </>
    ),
    naar: '/mama/contant',
    knop: 'Naar het contante geld',
  },
  {
    icon: <CalendarClock className="w-7 h-7" />,
    titel: 'Wanneer mag hij',
    tekst: (
      <>
        <p>
          Bij Tijden zet je de momenten klaar waarop hij op pad mag, bijvoorbeeld woensdag van
          16:00 tot 17:30. Dat herhaalt zich elke week.
        </p>
        <p>
          Jayce kan alleen uit jouw tijden kiezen. Staat er niets, dan kan hij niets bevestigen.
          Komt een week niet uit? Zet die tijd dan even op uit in plaats van hem weg te gooien.
        </p>
      </>
    ),
    naar: '/mama/tijden',
    knop: 'Naar de tijden',
  },
  {
    icon: <MapPin className="w-7 h-7" />,
    titel: 'Gevaarlijke plekken',
    tekst: (
      <>
        <p>
          Tik op de kaart waar hij niet langs mag, bijvoorbeeld een druk kruispunt. Kies hoe groot
          de omweg moet zijn.
        </p>
        <p>
          De routeplanner stuurt hem er daarna omheen. Dat werkt automatisch, je hoeft het maar
          één keer aan te wijzen.
        </p>
      </>
    ),
    naar: '/mama/plekken',
    knop: 'Naar de kaart',
  },
  {
    icon: <Lightbulb className="w-7 h-7" />,
    titel: 'Ideeën doorgeven',
    tekst: (
      <p>
        Zie je iets dat beter kan, of zit je ergens mee? Schrijf het op bij Ideeën. De beheerder
        krijgt er meteen een seintje van en vinkt het af als het geregeld is.
      </p>
    ),
    naar: '/mama/ideeen',
    knop: 'Naar de ideeën',
  },
  {
    icon: <Smartphone className="w-7 h-7" />,
    titel: 'Op je telefoon',
    tekst: (
      <p>
        Zet meldingen aan op je overzicht, dan hoor je het als er iets nieuws klaarstaat. Je kunt
        de app ook als echte app op je telefoon zetten; kijk daarvoor in het menu bij
        <strong> Op je telefoon</strong>.
      </p>
    ),
  },
];

/** De rondleiding per rol. De beheerder krijgt er geen, die kent de app zelf. */
export const RONDLEIDINGEN: Partial<Record<Rol, RondleidingStap[]>> = {
  klant: klantStappen,
  jayce: jayceStappen,
  moeder: moederStappen,
};

/** Titel boven het venster, per rol. */
export const RONDLEIDING_TITEL: Partial<Record<Rol, string>> = {
  klant: 'Hoe werkt het?',
  jayce: 'Hoe werkt jouw app?',
  moeder: 'Hoe werkt het?',
};
