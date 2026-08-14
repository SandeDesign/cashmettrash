// src/pages/Landing.tsx
//
// Publieke landingspagina. Legt vooral de twee gescheiden geldstromen uit:
// bij glas betaal je voor het ophalen, bij statiegeld krijg je juist geld terug
// en betaal je alleen de ophaalkosten. Dat onderscheid is voor nieuwe bezoekers
// het makkelijkst te verwarren, dus het staat hier centraal, met dezelfde
// kleurcodering als in de app.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Heart, MapPin, Recycle, Wine } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import HeroIllustratie from '../components/landing/HeroIllustratie';
import LogoLockup from '../components/shared/LogoLockup';
import CollapsibleSection from '../components/common/CollapsibleSection';
import {
  formatCenten,
  GLAS_PRIJS_CENTEN,
  STATIEGELD_SERVICE_CENTEN,
} from '../utils/constants';

const STAPPEN = [
  {
    titel: 'Zeg waar je woont',
    tekst: 'Maak een account met je adres. Anders weet Jayce niet bij welke deur hij moet zijn.',
  },
  {
    titel: 'Kies je moment',
    tekst: 'Tik aan wat er staat, glas of statiegeld, en kies een ophaaltijd die jou uitkomt. Jayce bevestigt daarna wanneer hij komt.',
  },
  {
    titel: 'Ratel, ratel, weg',
    tekst: 'Daar komt de skelter. Zorg dat je thuis bent, hij laadt alles in en vinkt het af. In de app zie je dat het gelukt is.',
  },
];

const VRAGEN = [
  {
    vraag: 'Waarom kost glas geld en levert statiegeld juist geld op?',
    antwoord:
      'Simpel: op een wijnfles zit geen statiegeld. Die is bij de glasbak niets waard, dus je betaalt Jayce voor het sjouwen. Op plastic flessen en blikjes zit wél statiegeld, en dat is en blijft van jou. Zodra alles in de automaat is geweest krijg je dat hele bedrag terug via een Tikkie.',
  },
  {
    vraag: 'Hoe weet ik of iets glas of statiegeld is?',
    antwoord:
      'Kijk naar het statiegeldlogo, niet naar het soort fles. Zit er een logo op, dan is het statiegeld. Zit er geen logo op, dan is het glas. Let op bij bierflesjes: die zijn van glas, maar op de flesjes uit een krat zit wél statiegeld. Die horen dus bij geen van beide en kun je het beste zelf naar de supermarkt brengen, want daar krijg je je geld voor terug.',
  },
  {
    vraag: 'Wat kost het ophalen van glas?',
    antwoord: `${formatCenten(GLAS_PRIJS_CENTEN)} per keer. Niet per fles. Vijf flessen of vijftig flessen, de skelter rijdt toch, dus de prijs blijft hetzelfde. Je rekent dat meteen af bij het aanvragen.`,
  },
  {
    vraag: 'En het ophalen van statiegeld?',
    antwoord: `Aanmelden kost niets. Pas als het echt is opgehaald en ingeleverd krijg je bericht. Je betaalt dan ${formatCenten(STATIEGELD_SERVICE_CENTEN)} voor de rit, en daarna verschijnt de knop naar je Tikkie. Dat Tikkie-bedrag blijft ongemoeid: de ophaalkosten gaan er niet vanaf.`,
  },
  {
    vraag: 'Wanneer staat hij voor de deur?',
    antwoord:
      'Dat spreken we samen af. Bij het aanvragen kies je een van de ophaaltijden die het beste uitkomt. Jayce plant daarna zijn ronde en bevestigt wanneer hij echt komt; dat zie je in de app en je krijgt er een melding van.',
  },
  {
    vraag: 'Moet ik thuis zijn?',
    antwoord:
      'Ja. Jayce belt aan, dus er moet iemand thuis zijn op het moment dat hij langskomt. Daarom kies je bij het aanvragen ook een tijd die je uitkomt. Lukt het toch niet? Stuur dan even een berichtje in de app.',
  },
  {
    vraag: 'Moet ik alles precies natellen?',
    antwoord:
      'Nee joh, gokken mag. Jayce telt bij het ophalen zelf na, en dat getal is wat meetelt voor je Tikkie.',
  },
  {
    vraag: 'Houdt Jayce mijn statiegeld?',
    antwoord:
      'Nee. Er gaat geen cent statiegeld via Jayce. Wat de inleverautomaat uitspuugt gaat helemaal naar jou, we kunnen dat bedrag niet eens aanpassen. De ophaalkosten betaal je los in de app. Alleen mensen die Jayce goed kennen kunnen ervoor kiezen hun statiegeld aan hem te geven, en dat is altijd hun eigen keuze.',
  },
  {
    vraag: 'Ik woon niet in de buurt. Mag ik ook?',
    antwoord:
      'Nee, dan lukt het niet. Hij rijdt op een skelter en niet op een vrachtwagen, dus we halen alleen op in Tilburg rond de Magriethof. Woon je daarbuiten, dan houdt de app je aanvraag tegen en zie je dat meteen. Twijfel je of je er net binnen valt? Maak een account aan; de app rekent het zelf uit.',
  },
];

const Landing: React.FC = () => (
  <div className="min-h-screen flex flex-col" style={{ background: 'var(--cmt-paper)' }}>
    <PublicHeader />

    {/* ---------------- Hero ---------------- */}
    <section className="cmt-hero">
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-24 sm:pt-16 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          <div className="cmt-animate-in">
            <span className="cmt-eyebrow mb-5">
              <MapPin className="w-4 h-4" /> Tilburg, rond de Magriethof
            </span>

            <h1 className="cmt-display mb-4">
              Zet je{' '}
              <span style={{ color: 'var(--cmt-glas)' }}>flessen</span> buiten.{' '}
              <span style={{ color: 'var(--cmt-stat)' }}>Jayce</span> doet de rest.
            </h1>

            <p className="cmt-lead mb-7 max-w-lg">
              Nooit meer met een rammelende krat naar de supermarkt. Zet het bij de deur,
              tik het aan in de app, en dan hoor je de skelter aankomen.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/registreren" className="cmt-btn-primary cmt-btn-lg">
                Ik doe mee <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#hoe-het-werkt" className="cmt-btn-secondary cmt-btn-lg">
                Hoe gaat dat dan?
              </a>
            </div>

            <p className="mt-4 text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
              Gratis account · nergens aan vast · je betaalt alleen als hij echt langskomt
            </p>
          </div>

          <HeroIllustratie className="w-full max-w-md mx-auto lg:max-w-none cmt-animate-in cmt-delay-2" />
        </div>
      </div>
    </section>

    {/* ---------------- De twee stromen ---------------- */}
    <section className="cmt-section cmt-section-alt">
      <div className="max-w-5xl mx-auto px-4">
        <div className="max-w-2xl mb-10">
          <h2 className="cmt-section-title mb-3">Twee bakken, twee verhalen</h2>
          <p className="cmt-lead">
            Alles gaat mee in dezelfde ronde, maar met het geld gebeurt precies het
            tegenovergestelde. Onthoud alleen dit en je snapt de hele app.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Glas */}
          <article className="cmt-flow-glas cmt-card cmt-card-flow cmt-animate-in">
            <span
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
              style={{ background: 'var(--cmt-glas-bg)', color: 'var(--cmt-glas)' }}
            >
              <Wine className="w-6 h-6" />
            </span>

            <h3 className="text-xl font-bold mb-1">Glas: jij betaalt</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
              Wijnflessen, jampotten, sauspotten. Alles van glas zonder statiegeldlogo.
            </p>

            <p className="cmt-prijs">{formatCenten(GLAS_PRIJS_CENTEN)}</p>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-muted)' }}>
              per keer, hoeveel je ook buiten zet
            </p>

            <ul className="cmt-lijst">
              <li>
                <Check className="w-4 h-4" /> Vooraf afrekenen in de app, netjes via Stripe
              </li>
              <li>
                <Check className="w-4 h-4" /> Geen abonnement, je roept hem wanneer je wilt
              </li>
              <li>
                <Check className="w-4 h-4" /> Hier zit geen statiegeld op, dus dit levert niets op
              </li>
            </ul>
          </article>

          {/* Statiegeld */}
          <article className="cmt-flow-stat cmt-card cmt-card-flow cmt-animate-in cmt-delay-1">
            <span
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
              style={{ background: 'var(--cmt-stat-bg)', color: 'var(--cmt-stat)' }}
            >
              <Recycle className="w-6 h-6" />
            </span>

            <h3 className="text-xl font-bold mb-1">Statiegeld: jij krijgt</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
              Plastic flessen en blikjes met het statiegeldlogo.
            </p>

            <p className="cmt-prijs">{formatCenten(STATIEGELD_SERVICE_CENTEN)}</p>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-muted)' }}>
              voor de rit, en pas als hij echt is langsgeweest
            </p>

            <ul className="cmt-lijst">
              <li>
                <Check className="w-4 h-4" /> Je statiegeld komt tot de laatste cent bij je terug
              </li>
              <li>
                <Check className="w-4 h-4" /> Aanmelden is gratis en een ruwe schatting is prima
              </li>
              <li>
                <Check className="w-4 h-4" /> Bij een volle krat hou je onder de streep gewoon geld over
              </li>
            </ul>
          </article>
        </div>

        <div className="cmt-card cmt-card-tint mt-5 max-w-3xl">
          <p className="font-bold mb-1">Twijfel je? Kijk naar het logo.</p>
          <p className="text-sm" style={{ color: 'var(--cmt-ink-soft)' }}>
            Niet het soort fles bepaalt het, maar het statiegeldlogo. Zit er een logo op, dan is
            het statiegeld. Zit er geen logo op, dan is het glas. Pas op met bierflesjes: die zijn
            van glas, maar op de flesjes uit een krat zit wél statiegeld. Breng die zelf naar de
            supermarkt, want daar krijg je je geld voor terug.
          </p>
        </div>
      </div>
    </section>

    {/* ---------------- Hoe het werkt ---------------- */}
    <section id="hoe-het-werkt" className="cmt-section scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="cmt-section-title mb-10 max-w-xl">Drie stappen en klaar</h2>

        <ol className="grid sm:grid-cols-3 gap-6">
          {STAPPEN.map((stap, i) => (
            <li key={stap.titel} className={`cmt-animate-in cmt-delay-${i + 1}`}>
              <div className="flex items-start gap-4 sm:block">
                <span className="cmt-step-nummer sm:mb-4">{i + 1}</span>
                <div>
                  <h3 className="font-bold mb-1.5">{stap.titel}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--cmt-ink-soft)' }}>
                    {stap.tekst}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>

    {/* ---------------- Over Jayce ---------------- */}
    <section className="cmt-section cmt-section-alt">
      <div className="max-w-5xl mx-auto px-4">
        <div className="cmt-card cmt-card-tint cmt-flow-glas !p-8 sm:!p-10">
          <div className="grid sm:grid-cols-[auto,1fr] gap-6 items-start">
            <span
              className="inline-flex items-center justify-center w-14 h-14 rounded-full"
              style={{ background: 'var(--cmt-glas)', color: '#fff' }}
            >
              <Heart className="w-7 h-7" />
            </span>

            <div>
              <h2 className="cmt-section-title mb-3">En wie is die Jayce dan?</h2>
              <p className="cmt-lead mb-4 max-w-2xl">
                Een jongen uit Tilburg met een skelter en een plan. Hij rijdt zijn rondje
                zelf, tilt zelf, telt zelf en vinkt zelf af. Zo verdient hij zijn eigen
                zakcentje, en jij hoeft nergens heen.
              </p>
              <p className="text-sm max-w-2xl" style={{ color: 'var(--cmt-ink-soft)' }}>
                Jij scheelt hem een lege ronde, hij scheelt jou een ritje naar de glasbak.
                Aan je statiegeld komt hij niet, dat blijft gewoon van jou.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ---------------- Vragen ---------------- */}
    <section className="cmt-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="cmt-section-title mb-8">Dat vraagt iedereen</h2>

        <div className="space-y-3">
          {VRAGEN.map((item, i) => (
            <CollapsibleSection key={item.vraag} title={item.vraag} defaultOpen={i === 0}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--cmt-ink-soft)' }}>
                {item.antwoord}
              </p>
            </CollapsibleSection>
          ))}
        </div>
      </div>
    </section>

    {/* ---------------- Slot-CTA ---------------- */}
    <section className="cmt-section cmt-section-alt">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <LogoLockup className="w-48 sm:w-56 mx-auto mb-6" />

        <h2 className="cmt-section-title mb-3">Van die kratten af?</h2>
        <p className="cmt-lead mb-7 max-w-xl mx-auto">
          Een account maken kost je een minuutje en verder niets. Woon je in Tilburg rond
          de Magriethof, dan staat de skelter binnenkort bij jou voor de deur.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/registreren" className="cmt-btn-primary cmt-btn-lg">
            Ik doe mee <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="cmt-btn-ghost cmt-btn-lg">
            Ik heb er al een
          </Link>
        </div>
      </div>
    </section>

    <PublicFooter />
  </div>
);

export default Landing;
