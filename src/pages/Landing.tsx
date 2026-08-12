// src/pages/Landing.tsx
//
// Publieke landingspagina. Legt vooral de twee gescheiden geldstromen uit:
// bij glas betaal je voor het ophalen, bij statiegeld krijg je juist geld terug
// en betaal je alleen de ophaalkosten. Dat onderscheid is voor nieuwe bezoekers
// het makkelijkst te verwarren, dus het staat hier centraal, met dezelfde
// kleurcodering als in de app.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Coins, Heart, MapPin, Recycle, Sparkles, Wine } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import HeroIllustratie from '../components/landing/HeroIllustratie';
import Logo from '../components/shared/Logo';
import CollapsibleSection from '../components/common/CollapsibleSection';
import {
  formatCenten,
  GLAS_PRIJS_CENTEN,
  STATIEGELD_SERVICE_CENTEN,
} from '../utils/constants';

const STAPPEN = [
  {
    titel: 'Meld je aan',
    tekst: 'Maak een account met je adres, zodat Jayce weet waar hij langs moet komen.',
  },
  {
    titel: 'Zet het klaar',
    tekst: 'Geef in de app door wat er klaarstaat: glas, statiegeld, of allebei.',
  },
  {
    titel: 'Jayce komt langs',
    tekst: 'Hij komt met de skelter langs, haalt het op en vinkt het af. Je ziet de status terug in je overzicht.',
  },
];

const VRAGEN = [
  {
    vraag: 'Waarom betaal ik voor glas en krijg ik geld voor statiegeld?',
    antwoord:
      'Op glazen flessen zit geen statiegeld, die leveren niets op. Je betaalt dus voor de moeite van het ophalen en wegbrengen. Op plastic flessen en blikjes zit wél statiegeld, en dat is van jou. Je krijgt het volledige bedrag terug via een Tikkie zodra alles is ingeleverd.',
  },
  {
    vraag: 'Hoeveel kost het ophalen van glas?',
    antwoord: `${formatCenten(GLAS_PRIJS_CENTEN)} per ophaalbeurt, niet per fles. Of je nu vijf of vijftig flessen klaarzet, de prijs blijft hetzelfde.`,
  },
  {
    vraag: 'Wat kost het ophalen van statiegeld?',
    antwoord: `Het aanmelden is gratis. Als je statiegeld is ingeleverd krijg je het volledige bedrag terug via een Tikkie, en betaal je ${formatCenten(STATIEGELD_SERVICE_CENTEN)} ophaalkosten in de app. Je betaalt dus pas iets als het echt is opgehaald.`,
  },
  {
    vraag: 'Wanneer komt Jayce langs?',
    antwoord:
      'Zodra het hem uitkomt, meestal binnen een paar dagen. Hij plant zijn eigen rondje met de skelter. Je hoeft geen tijdslot te kiezen en niet thuis te zijn: zet het klaar op een plek die je in de opmerking doorgeeft.',
  },
  {
    vraag: 'Moet ik precies tellen hoeveel flessen en blikjes ik heb?',
    antwoord:
      'Nee, een schatting is genoeg. Jayce telt bij het ophalen na, en dat aantal is wat telt voor je Tikkie.',
  },
  {
    vraag: 'Krijgt Jayce mijn statiegeld?',
    antwoord:
      'Nee. Het statiegeld is en blijft van jou, en er loopt geen geld via Jayce. Je krijgt het volledige bedrag dat uit de inleverautomaat komt terug via Tikkie. De ophaalkosten betaal je apart in de app.',
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
              Jayce haalt je{' '}
              <span style={{ color: 'var(--cmt-glas)' }}>glas</span> en{' '}
              <span style={{ color: 'var(--cmt-stat)' }}>statiegeld</span> op.
            </h1>

            <p className="cmt-lead mb-7 max-w-lg">
              Geen kratten meer naar de supermarkt sjouwen. Zet het klaar, geef het door
              in de app, en Jayce komt het met de skelter ophalen.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/registreren" className="cmt-btn-primary cmt-btn-lg">
                Meld je aan <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#hoe-het-werkt" className="cmt-btn-secondary cmt-btn-lg">
                Hoe werkt het?
              </a>
            </div>

            <p className="mt-4 text-sm" style={{ color: 'var(--cmt-ink-muted)' }}>
              Gratis account · geen abonnement · je betaalt alleen per ophaalbeurt
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
          <h2 className="cmt-section-title mb-3">Twee soorten, twee verhalen</h2>
          <p className="cmt-lead">
            Glas en statiegeld gaan allebei mee in dezelfde ronde, maar het geld werkt
            precies andersom. Dit is het enige dat je hoeft te onthouden.
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

            <h3 className="text-xl font-bold mb-1">Glas</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
              Wijnflessen, bierflesjes, potten en jampotten.
            </p>

            <p className="cmt-prijs">{formatCenten(GLAS_PRIJS_CENTEN)}</p>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-muted)' }}>
              per ophaalbeurt, ongeacht hoeveel je klaarzet
            </p>

            <ul className="cmt-lijst">
              <li>
                <Check className="w-4 h-4" /> Je betaalt vooraf in de app, veilig via Stripe
              </li>
              <li>
                <Check className="w-4 h-4" /> Geen abonnement, je vraagt het aan wanneer je wilt
              </li>
              <li>
                <Check className="w-4 h-4" /> Op glas zit geen statiegeld, dus dit levert niets op
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

            <h3 className="text-xl font-bold mb-1">Statiegeld</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-soft)' }}>
              Plastic flessen en blikjes met statiegeldlogo.
            </p>

            <p className="cmt-prijs">{formatCenten(STATIEGELD_SERVICE_CENTEN)}</p>
            <p className="text-sm mb-5" style={{ color: 'var(--cmt-ink-muted)' }}>
              ophaalkosten, pas te betalen nadat het is opgehaald
            </p>

            <ul className="cmt-lijst">
              <li>
                <Check className="w-4 h-4" /> Je statiegeld krijg je volledig terug via Tikkie
              </li>
              <li>
                <Check className="w-4 h-4" /> Aanmelden is gratis, een schatting van de aantallen is genoeg
              </li>
              <li>
                <Check className="w-4 h-4" /> Bij de meeste kratten hou je onder de streep geld over
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    {/* ---------------- Hoe het werkt ---------------- */}
    <section id="hoe-het-werkt" className="cmt-section scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="cmt-section-title mb-10 max-w-xl">In drie stappen geregeld</h2>

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
              <h2 className="cmt-section-title mb-3">Wie is Jayce?</h2>
              <p className="cmt-lead mb-4 max-w-2xl">
                Jayce is een jongen uit Tilburg die zijn eigen zakcentje verdient door
                bij de buren glas en statiegeld op te halen. Hij rijdt het rondje zelf
                op zijn skelter, telt zelf, en houdt zelf bij wat er nog moet gebeuren.
              </p>
              <p className="text-sm max-w-2xl" style={{ color: 'var(--cmt-ink-soft)' }}>
                Jij helpt hem op weg, hij scheelt jou een ritje naar de glasbak. Het
                statiegeld blijft gewoon van jou, daar komt hij niet aan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ---------------- Vragen ---------------- */}
    <section className="cmt-section">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="cmt-section-title mb-8">Veelgestelde vragen</h2>

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
        <span
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5"
          style={{ background: 'var(--cmt-glas-bg)', color: 'var(--cmt-glas)' }}
        >
          <Sparkles className="w-6 h-6" />
        </span>

        <h2 className="cmt-section-title mb-3">Klaar om je kratten kwijt te raken?</h2>
        <p className="cmt-lead mb-7 max-w-xl mx-auto">
          Een account maken kost een minuut en is gratis. Woon je in Tilburg rond de
          Magriethof, dan komt Jayce bij je langs.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/registreren" className="cmt-btn-primary cmt-btn-lg">
            Meld je aan <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="cmt-btn-ghost cmt-btn-lg">
            Ik heb al een account
          </Link>
        </div>
      </div>
    </section>

    {/* ---------------- Footer ---------------- */}
    <footer className="cmt-footer safe-area-bottom">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <Logo size="sm" showText={false} className="mb-3" />
            <p className="font-bold">CashMetTrash</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Glas en statiegeld ophalen in Tilburg.
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <Link to="/login">Inloggen</Link>
            <Link to="/registreren">Aanmelden</Link>
            <a href="#hoe-het-werkt">Hoe het werkt</a>
          </nav>
        </div>

        <p
          className="mt-8 pt-6 text-xs flex items-center gap-1.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.45)' }}
        >
          <Coins className="w-3.5 h-3.5" />
          Statiegeld is en blijft van jou.
        </p>
      </div>
    </footer>
  </div>
);

export default Landing;
