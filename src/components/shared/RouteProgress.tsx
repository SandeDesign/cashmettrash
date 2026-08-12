// src/components/shared/RouteProgress.tsx
//
// Dunne balk bovenaan tijdens het laden van een route. Verschijnt bewust pas na
// een korte vertraging: bij een cache-hit is de route er direct, en dan zou de
// balk alleen maar knipperen.

import React, { useEffect, useState } from 'react';

const VERTRAGING_MS = 180;

const RouteProgress: React.FC = () => {
  const [zichtbaar, setZichtbaar] = useState(false);
  const [breedte, setBreedte] = useState(0);

  useEffect(() => {
    const start = window.setTimeout(() => {
      setZichtbaar(true);
      setBreedte(25);
    }, VERTRAGING_MS);

    // Kruipt richting 90% zolang het laden duurt; de laatste 10% is voor het
    // moment dat de route er echt is.
    const kruipen = window.setInterval(() => {
      setBreedte((b) => (b >= 90 ? b : b + (90 - b) * 0.15));
    }, 220);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(kruipen);
    };
  }, []);

  if (!zichtbaar) return null;

  return (
    <div
      className="cmt-route-balk"
      style={{ width: `${breedte}%` }}
      role="progressbar"
      aria-label="Pagina wordt geladen"
    />
  );
};

export default RouteProgress;
