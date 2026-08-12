// src/components/landing/HeroIllustratie.tsx
//
// Decoratieve illustratie: een krat met flessen (glas, groen) naast een zak met
// blikjes (statiegeld, blauw). De kleurscheiding is dezelfde als in de rest van
// de app. Puur decoratief, dus aria-hidden.

import React from 'react';

const HeroIllustratie: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 480 380"
    className={className}
    role="presentation"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="cmt-glas-verloop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#12a67e" />
        <stop offset="100%" stopColor="#0a6e53" />
      </linearGradient>
      <linearGradient id="cmt-stat-verloop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1560c4" />
        <stop offset="100%" stopColor="#083a7c" />
      </linearGradient>
    </defs>

    {/* Zachte achtergrondvlakken */}
    <circle cx="252" cy="168" r="150" fill="#0e8f6c" opacity="0.07" />
    <circle cx="126" cy="212" r="96" fill="#0b4a9e" opacity="0.06" />

    {/* Stoep */}
    <rect x="24" y="308" width="432" height="14" rx="7" fill="#14181f" opacity="0.08" />

    {/* ---------- Statiegeld: zak met blikjes (blauw) ---------- */}
    <g>
      {/* zak, iets taps toelopend naar onderen */}
      <path d="M100 190h92l-8 118h-76z" fill="url(#cmt-stat-verloop)" />
      {/* omgeslagen rand */}
      <rect x="94" y="176" width="104" height="22" rx="11" fill="#0b4a9e" />
      <rect x="94" y="176" width="104" height="22" rx="11" fill="#fff" opacity="0.14" />
      {/* blikjes die uit de zak steken */}
      <g>
        <rect x="118" y="140" width="24" height="42" rx="6" fill="#f5f3ee" />
        <ellipse cx="130" cy="140" rx="12" ry="4.5" fill="#cfc9bc" />
        <rect x="122" y="152" width="16" height="4" rx="2" fill="#0b4a9e" opacity="0.5" />

        <rect x="150" y="132" width="24" height="50" rx="6" fill="#f5f3ee" />
        <ellipse cx="162" cy="132" rx="12" ry="4.5" fill="#cfc9bc" />
        <rect x="154" y="146" width="16" height="4" rx="2" fill="#0b4a9e" opacity="0.5" />
      </g>
      {/* highlight op de zak */}
      <path d="M112 200h10l-8 100h-10z" fill="#fff" opacity="0.16" />
    </g>

    {/* ---------- Glas: krat met flessen (groen) ---------- */}
    <g>
      {/* flessen */}
      {[
        { x: 250, h: 96 },
        { x: 292, h: 110 },
        { x: 334, h: 96 },
      ].map((fles) => (
        <g key={fles.x}>
          {/* hals */}
          <rect x={fles.x + 11} y={238 - fles.h} width="10" height="20" rx="4" fill="#0a6e53" />
          {/* dop */}
          <rect x={fles.x + 9} y={234 - fles.h} width="14" height="8" rx="3" fill="#14181f" opacity="0.55" />
          {/* body */}
          <path
            d={`M${fles.x} ${262 - fles.h + 30}
                c0-10 4-14 8-18
                v-16h16v16
                c4 4 8 8 8 18
                v56h-32z`}
            fill="url(#cmt-glas-verloop)"
          />
          {/* glans */}
          <rect x={fles.x + 5} y={266 - fles.h + 30} width="4" height="46" rx="2" fill="#fff" opacity="0.28" />
        </g>
      ))}

      {/* krat */}
      <rect x="236" y="248" width="150" height="60" rx="10" fill="#0a6e53" />
      <rect x="236" y="248" width="150" height="60" rx="10" fill="#fff" opacity="0.08" />
      {/* verticale ribben */}
      <rect x="264" y="256" width="7" height="44" rx="3.5" fill="#14181f" opacity="0.16" />
      <rect x="307" y="256" width="7" height="44" rx="3.5" fill="#14181f" opacity="0.16" />
      <rect x="350" y="256" width="7" height="44" rx="3.5" fill="#14181f" opacity="0.16" />
      {/* bovenrand */}
      <rect x="236" y="248" width="150" height="10" rx="5" fill="#12a67e" />
    </g>

    {/* Muntjes: het statiegeld dat terugkomt */}
    <g opacity="0.9">
      <circle cx="410" cy="120" r="17" fill="#f0b429" />
      <circle cx="410" cy="120" r="12" fill="#fff" opacity="0.28" />
      <circle cx="386" cy="164" r="11" fill="#f0b429" />
      <circle cx="386" cy="164" r="7.5" fill="#fff" opacity="0.28" />
      <circle cx="428" cy="176" r="7" fill="#f0b429" />
    </g>
  </svg>
);

export default HeroIllustratie;
