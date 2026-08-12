// src/components/shared/LogoLockup.tsx
//
// Het volledige logo inclusief wordmerk. Bewust inline en niet als <img src>:
// een SVG die via een img-tag wordt geladen haalt geen externe fonts op, waardoor
// het wordmerk in een verkeerd lettertype zou verschijnen. Inline erft het gewoon
// Poppins van de pagina.
//
// De gradient-id's hebben een prefix zodat ze niet botsen met HeroIllustratie,
// die ook defs gebruikt.

import React from 'react';

const LogoLockup: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 640 640"
    className={className}
    role="img"
    aria-label="CashMetTrash"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="cmt-logo-body" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1FA97F" />
        <stop offset="55%" stopColor="#0E8F6C" />
        <stop offset="100%" stopColor="#0A6E54" />
      </linearGradient>
      <linearGradient id="cmt-logo-lid" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1560C9" />
        <stop offset="100%" stopColor="#0B4A9E" />
      </linearGradient>
      <linearGradient id="cmt-logo-coin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#CFE8FF" />
      </linearGradient>
      <radialGradient id="cmt-logo-bg" cx="50%" cy="40%" r="75%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#EAF6F1" />
      </radialGradient>
      <filter id="cmt-logo-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#0A6E54" floodOpacity="0.25" />
      </filter>
    </defs>

    <circle cx="320" cy="320" r="306" fill="url(#cmt-logo-bg)" />
    <circle cx="320" cy="320" r="300" fill="none" stroke="#0B4A9E" strokeWidth="12" />

    <g transform="translate(0,-10)">
      <ellipse cx="320" cy="420" rx="100" ry="13" fill="#0A6E54" opacity="0.15" />
      <g filter="url(#cmt-logo-shadow)">
        <g fill="#0A6E54">
          <ellipse cx="280" cy="408" rx="16" ry="8" />
          <ellipse cx="356" cy="408" rx="16" ry="8" />
        </g>
        <rect x="271" y="375" width="18" height="36" rx="9" fill="#0E8F6C" />
        <rect x="347" y="375" width="18" height="36" rx="9" fill="#0E8F6C" />
        <path
          d="M232 250 Q184 234 180 193"
          stroke="#0E8F6C"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M408 250 Q456 234 460 193"
          stroke="#0E8F6C"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="179" cy="189" r="13" fill="#1FA97F" />
        <circle cx="461" cy="189" r="13" fill="#1FA97F" />
        <path
          d="M240 236 L262 382 Q320 400 378 382 L400 236 Q320 260 240 236 Z"
          fill="url(#cmt-logo-body)"
        />
        <path d="M257 248 L271 362 Q286 368 286 368 L273 244 Z" fill="#FFFFFF" opacity="0.18" />
        <path d="M225 209 Q320 171 415 209 L402 239 Q320 265 238 239 Z" fill="url(#cmt-logo-lid)" />
        <ellipse cx="320" cy="209" rx="90" ry="20" fill="#1560C9" />
        <ellipse cx="320" cy="209" rx="39" ry="11" fill="#063A7A" />
        <circle cx="291" cy="292" r="10" fill="#FFFFFF" />
        <circle cx="291" cy="292" r="5" fill="#0A3A2C" />
        <circle cx="349" cy="292" r="10" fill="#FFFFFF" />
        <circle cx="349" cy="292" r="5" fill="#0A3A2C" />
        <path
          d="M278 321 Q320 353 362 321"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="320" cy="164" r="35" fill="url(#cmt-logo-coin)" stroke="#0B4A9E" strokeWidth="4" />
        <text
          x="320"
          y="178"
          fontWeight="800"
          fontSize="38"
          fill="#0B4A9E"
          textAnchor="middle"
          style={{ fontFamily: 'var(--cmt-font)' }}
        >
          €
        </text>
        <g stroke="#1FA97F" strokeWidth="5" strokeLinecap="round" opacity="0.8">
          <path d="M263 145 L246 132" />
          <path d="M377 145 L394 132" />
          <path d="M320 111 L320 92" />
        </g>
      </g>

      <text
        x="320"
        y="490"
        fontWeight="700"
        fontSize="46"
        textAnchor="middle"
        fill="#0B4A9E"
        style={{ fontFamily: 'var(--cmt-font)' }}
      >
        Cash Met Trash
      </text>
    </g>
  </svg>
);

export default LogoLockup;
