// src/components/common/AantalVeld.tsx
//
// Invoerveld voor een aantal. Klinkt simpel, maar een gewone <input type="number">
// met `Number(waarde) || 0` werkt hier niet: wis je het veld, dan springt de nul
// er meteen weer in en moet je hem eerst selecteren voor je iets kunt typen.
//
// Daarom houden we de getypte tekst apart bij en mag die leeg zijn. Naar buiten
// toe is leeg gewoon `min` (meestal nul), zodat de rest van de app niets met een
// half ingevuld veld te maken krijgt. Bij het verlaten van het veld zetten we er
// weer een getal in, anders blijft er een leeg vakje achter.
//
// We gebruiken bewust `type="text"` met `inputMode="numeric"`: dat geeft op de
// telefoon hetzelfde cijferklavier, maar zonder de eigenaardigheden van
// type="number" (waar een ongeldige toets een lege waarde oplevert en je met de
// muis per ongeluk kunt scrollen door de getallen).

import React, { useEffect, useRef, useState } from 'react';

interface AantalVeldProps {
  id: string;
  label: string;
  waarde: number;
  onChange: (aantal: number) => void;
  min?: number;
  max?: number;
  /** Grotere letters, voor de pagina's van Jayce. */
  groot?: boolean;
}

const AantalVeld: React.FC<AantalVeldProps> = ({
  id,
  label,
  waarde,
  onChange,
  min = 0,
  max = 999,
  groot = false,
}) => {
  const [tekst, setTekst] = useState(() => String(waarde));
  // Wat wij zelf als laatste hebben doorgegeven. Zo weten we of een nieuwe
  // waarde van buiten komt of gewoon ons eigen getik is.
  const laatstGemeld = useRef(waarde);

  useEffect(() => {
    if (waarde !== laatstGemeld.current) {
      laatstGemeld.current = waarde;
      setTekst(String(waarde));
    }
  }, [waarde]);

  const verwerk = (ruw: string) => {
    // Alleen cijfers, en een voorloopnul weghalen zodra er meer volgt: typ je een
    // 5 achter de 0, dan hoort daar 5 te staan en niet 05.
    const cijfers = ruw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    const begrensd = cijfers === '' ? '' : String(Math.min(max, Number(cijfers)));

    setTekst(begrensd);

    const naarBuiten = begrensd === '' ? min : Number(begrensd);
    laatstGemeld.current = naarBuiten;
    onChange(naarBuiten);
  };

  /** Leeg gelaten? Dan zetten we het laagste toegestane getal terug. */
  const opVerlaten = () => {
    if (tekst === '' || Number(tekst) < min) {
      setTekst(String(min));
      laatstGemeld.current = min;
      onChange(min);
    }
  };

  return (
    <div>
      <label className="cmt-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className={groot ? 'cmt-input !text-lg' : 'cmt-input'}
        value={tekst}
        onChange={(e) => verwerk(e.target.value)}
        onBlur={opVerlaten}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
};

export default AantalVeld;
