import React, { useState } from 'react';
import { ChevronDown, Search, HelpCircle, MessageCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  // Algemeen
  {
    id: '1',
    category: 'Algemeen',
    question: 'Wat is VLOTTR?',
    answer: 'VLOTTR is een flexibele autoverhuur service van Buddy BV uit Zuid-Limburg. Wij bieden doorlopende huurcontracten vanaf 4 weken. Basis: €140/week (€20/dag all-in). Vooruit Planner (min. 6 maanden): €105/week (€15/dag all-in). Perfect voor wie tijdelijk een auto nodig heeft zonder de hoge kosten van traditionele autoverhuur.'
  },
  {
    id: '2',
    category: 'Algemeen',
    question: 'Wat is inbegrepen in de prijs?',
    answer: 'De weekprijs is all-in! Dit betekent: verzekering (WA + casco), wegenbelasting, pechhulp en onderhoud zijn allemaal inbegrepen. Geen verborgen kosten, servicekosten of boekingskosten.'
  },
  {
    id: '3',
    category: 'Algemeen',
    question: 'Voor wie is VLOTTR geschikt?',
    answer: 'VLOTTR is ideaal voor iedereen die tijdelijk een auto nodig heeft: studenten, mensen tussen banen, expats, of wie tijdelijk een tweede auto nodig heeft. Zolang je een geldig Nederlands rijbewijs hebt, kun je bij ons terecht!'
  },

  // Huren & Contract
  {
    id: '4',
    category: 'Huren & Contract',
    question: 'Hoe werkt het huren?',
    answer: '1. Registreer op het platform en upload je documenten (ID, rijbewijs)\n2. Wacht op goedkeuring (meestal binnen 24 uur)\n3. Kies een auto en selecteer je startdatum\n4. Onderteken het digitale contract\n5. Betaal de eerste week en borg\n6. Haal je auto op - klaar!'
  },
  {
    id: '5',
    category: 'Huren & Contract',
    question: 'Wat is de minimale huurduur?',
    answer: 'De minimale huurduur is 4 weken. Na deze periode is het contract wekelijks opzegbaar met 1 week opzegtermijn. Je zit dus niet vast aan een lange termijn!'
  },
  {
    id: '6',
    category: 'Huren & Contract',
    question: 'Hoe werkt opzeggen?',
    answer: 'Na de minimale periode van 4 weken kun je wekelijks opzeggen. Dit doe je schriftelijk via e-mail of via het platform. Let op: er geldt een opzegtermijn van 1 week.'
  },

  // Kosten & Betaling
  {
    id: '7',
    category: 'Kosten & Betaling',
    question: 'Wat kost het huren?',
    answer: 'Er zijn twee plannen:\n\n• Basis (min. 4 weken): €140/week (= €20 per dag, all-in)\n  - Eerste week: €140\n  - Borg: €250 (krijg je terug)\n\n• Vooruit Planner (min. 6 maanden): €105/week (= €15 per dag, all-in)\n  - Eerste week: €105\n  - Geen borg!\n\nDaarna wekelijkse automatische incasso van het gekozen tarief.'
  },
  {
    id: '8',
    category: 'Kosten & Betaling',
    question: 'Kan ik de borg vermijden?',
    answer: 'Ja! Kies het Vooruit Planner plan (min. 6 maanden) en je betaalt geen borg van €250. Bovendien betaal je slechts €105/week (€15/dag) in plaats van €140/week (€20/dag). Dubbel voordeel!'
  },
  {
    id: '9',
    category: 'Kosten & Betaling',
    question: 'Zijn er extra kosten?',
    answer: 'Nee! De weekprijs (€105 of €140, afhankelijk van je plan) is all-in. Er zijn GEEN:\n- Boekingskosten\n- Servicekosten\n- Verborgen kosten\n- Kosten voor verzekering, wegenbelasting of pechhulp\n\nDe enige extra kosten kunnen zijn: brandstof, verkeersovertredingen en schade door eigen schuld.'
  },

  // Auto & Onderhoud
  {
    id: '10',
    category: 'Auto & Onderhoud',
    question: 'Welke auto\'s zijn beschikbaar?',
    answer: 'We hebben verschillende betrouwbare auto\'s beschikbaar, voornamelijk uit de compacte en middenklasse. Check de website voor het actuele aanbod. Alle auto\'s zijn goed onderhouden en hebben geldige APK.'
  },
  {
    id: '11',
    category: 'Auto & Onderhoud',
    question: 'Wat als de auto kapot gaat?',
    answer: 'Bij normale slijtage en pech nemen wij de kosten voor onze rekening. Je krijgt pechhulp en indien nodig een vervangauto. Schade door eigen schuld of nalatigheid wordt wel verhaald op de huurder.'
  },
  {
    id: '12',
    category: 'Auto & Onderhoud',
    question: 'Mag ik de auto naar het buitenland?',
    answer: 'Dit kan in sommige gevallen, maar vraag dit altijd vooraf aan. Sommige bestemmingen zijn niet toegestaan vanwege verzekeringsbeperkingen.'
  },

  // Documenten & Verificatie
  {
    id: '13',
    category: 'Documenten',
    question: 'Welke documenten heb ik nodig?',
    answer: 'Je hebt nodig:\n- Geldig Nederlands rijbewijs (voor- en achterkant)\n- Geldig identiteitsbewijs (paspoort of ID-kaart)\n- Bankrekeningnummer voor automatische incasso'
  },
  {
    id: '14',
    category: 'Documenten',
    question: 'Hoe lang duurt de verificatie?',
    answer: 'Normaal gesproken binnen 24 uur op werkdagen. We controleren je rijbewijs en identiteitsbewijs zorgvuldig voordat we je account goedkeuren.'
  },

  // Schade & Verzekering
  {
    id: '15',
    category: 'Schade & Verzekering',
    question: 'Wat als ik schade rijd?',
    answer: 'Bij normale verkeersschade dekt de verzekering dit (met eigen risico). Bij schade door grove nalatigheid of opzet ben je zelf aansprakelijk. Meld schade altijd direct!'
  },
  {
    id: '16',
    category: 'Schade & Verzekering',
    question: 'Wat is het eigen risico?',
    answer: 'Het eigen risico bij schade is standaard en wordt vermeld in je contract. Bij grove nalatigheid of schade door verkeerd gebruik kan het volledige bedrag worden verhaald.'
  },

  // Contact & Support
  {
    id: '17',
    category: 'Support',
    question: 'Hoe kan ik contact opnemen?',
    answer: 'Je kunt ons op verschillende manieren bereiken:\n- Live chat via het platform (rechts boven)\n- E-mail: support@vlottr.nl\n- Telefonisch: zie contact pagina\n\nOns team helpt je graag verder!'
  },
  {
    id: '18',
    category: 'Support',
    question: 'Wat zijn de openingstijden?',
    answer: 'Onze klantenservice is bereikbaar op werkdagen van 9:00 - 18:00 uur. Spoedeisende zaken (pech, schade) kunnen 24/7 worden gemeld via de pechhulp.'
  }
];

interface FAQProps {
  onChatOpen?: () => void;
}

const FAQ: React.FC<FAQProps> = ({ onChatOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const categories = ['Alle', ...Array.from(new Set(FAQ_DATA.map(item => item.category)))];

  const filteredFAQs = FAQ_DATA.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Alle' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="min-h-screen bg-[var(--vl-bg-primary)]">
      <Header onChatOpen={onChatOpen} />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 ml-0 lg:ml-64 mt-16 p-2 md:p-8 pb-20 lg:pb-8 overflow-x-hidden">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-4 md:mb-6 px-2">
              <div className="inline-flex items-center justify-center w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-400 rounded-lg md:rounded-2xl mb-2 md:mb-3">
                <HelpCircle className="w-5 h-5 md:w-8 md:h-8 text-white" />
              </div>
              <h1 className="text-lg md:text-4xl font-black text-white mb-1 md:mb-2">
                FAQ
              </h1>
              <p className="text-xs md:text-base text-neutral-400">
                Veelgestelde vragen
              </p>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Zoek in FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/[0.06] border border-white/[0.1] rounded-lg md:rounded-xl text-sm md:text-base text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm md:text-base font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-green-500 text-white'
                      : 'bg-white/[0.06] text-neutral-400 hover:bg-white/[0.1]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-3">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-400">Geen vragen gevonden</p>
                  <p className="text-sm text-neutral-600 mt-1">Probeer een andere zoekterm</p>
                </div>
              ) : (
                filteredFAQs.map(item => (
                  <div
                    key={item.id}
                    className="bg-white/[0.03] border border-white/[0.1] rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex-1 pr-4">
                        <span className="inline-block px-2 py-1 text-xs font-bold rounded-md bg-green-500/20 text-green-400 mb-2">
                          {item.category}
                        </span>
                        <h3 className="font-bold text-white">{item.question}</h3>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-neutral-400 transition-transform ${
                          openItems.has(item.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {openItems.has(item.id) && (
                      <div className="px-6 pb-4 border-t border-white/[0.06]">
                        <p className="text-neutral-300 mt-4 whitespace-pre-line leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Contact CTA */}
            <div className="mt-8 md:mt-12 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-white/[0.1] rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
              <MessageCircle className="w-10 h-10 md:w-12 md:h-12 text-green-400 mx-auto mb-3 md:mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Nog steeds vragen?
              </h2>
              <p className="text-sm md:text-base text-neutral-400 mb-4 md:mb-6">
                Ons support team helpt je graag verder!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <button
                  onClick={() => onChatOpen?.()}
                  className="w-full sm:w-auto px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-400 transition-colors text-sm md:text-base"
                >
                  Open Live Chat
                </button>
                <a
                  href="mailto:support@vlottr.nl"
                  className="w-full sm:w-auto px-6 py-3 bg-white/[0.06] text-white font-bold rounded-lg hover:bg-white/[0.1] transition-colors border border-white/[0.1] text-sm md:text-base"
                >
                  E-mail Support
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default FAQ;
