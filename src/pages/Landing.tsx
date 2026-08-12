import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car as CarIcon, ChevronRight, Check, Calendar, Wallet, PhoneCall, MapPin, Star, ArrowRight, Shield, Clock, Zap, X, ChevronLeft } from 'lucide-react';
import { collection, query, where, limit as fbLimit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Car } from '../types';
import PublicHeader from '../components/layout/PublicHeader';
import Logo from '../components/shared/Logo';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [viewingCar, setViewingCar] = useState<Car | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadFeaturedCars = async () => {
      try {
        const q = query(
          collection(db, 'cars'),
          where('published', '==', true),
          fbLimit(3)
        );
        const snapshot = await getDocs(q);
        const cars = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Car));

        // If no cars found, use placeholder cars for demo
        if (cars.length === 0) {
          const placeholderCars: Car[] = [
            {
              id: 'demo-1',
              brand: 'BMW',
              model: '3 Serie',
              year: 2023,
              license_plate: 'XX-XXX-X',
              weekly_rate: 299,
              status: 'available' as const,
              images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80'],
              description: 'Premium sedan met automatische transmissie en cruise control',
              specs: { transmission: 'Automaat', fuel: 'Benzine', seats: '5' },
              published: true,
              created_by: 'demo',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'demo-2',
              brand: 'Mercedes-Benz',
              model: 'C-Klasse',
              year: 2023,
              license_plate: 'XX-XXX-X',
              weekly_rate: 349,
              status: 'rented' as const,
              images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80'],
              description: 'Luxe business sedan met alle comfort opties',
              specs: { transmission: 'Automaat', fuel: 'Diesel', seats: '5' },
              published: true,
              created_by: 'demo',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'demo-3',
              brand: 'Volkswagen',
              model: 'Golf',
              year: 2024,
              license_plate: 'XX-XXX-X',
              weekly_rate: 249,
              status: 'available' as const,
              images: ['https://images.unsplash.com/photo-1622105077939-207ecf04d81e?w=800&q=80'],
              description: 'Zuinige en betrouwbare hatchback voor dagelijks gebruik',
              specs: { transmission: 'Handgeschakeld', fuel: 'Benzine', seats: '5' },
              published: true,
              created_by: 'demo',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          setFeaturedCars(placeholderCars);
        } else {
          setFeaturedCars(cars);
        }
      } catch (error) {
        console.error('Error loading featured cars:', error);
        // On error, still show placeholder cars
        const placeholderCars: Car[] = [
          {
            id: 'demo-1',
            brand: 'BMW',
            model: '3 Serie',
            year: 2023,
            license_plate: 'XX-XXX-X',
            weekly_rate: 299,
            status: 'available' as const,
            images: [],
            description: 'Premium sedan beschikbaar voor verhuur',
            specs: { transmission: 'Automaat', fuel: 'Benzine' },
            published: true,
            created_by: 'demo',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setFeaturedCars(placeholderCars);
      }
    };
    loadFeaturedCars();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="min-h-screen bg-neutral-950 text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');

        .font-mono { font-family: 'Space Mono', monospace; }

        .hero-gradient {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 70%, #0a0a0a 100%);
        }

        .price-glow {
          text-shadow: 0 0 40px rgba(34, 197, 94, 0.4), 0 0 80px rgba(34, 197, 94, 0.15);
        }

        .card-shine {
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.03) 100%);
        }

        .border-glow {
          border: 1px solid rgba(255,255,255,0.08);
        }

        .cta-pulse {
          animation: pulse-green 2s ease-in-out infinite;
        }

        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
        }

        .fade-up {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
        .stagger-4 { transition-delay: 0.4s; }

        .car-image-overlay {
          background: linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.4) 40%, transparent 100%);
        }

        .noise-bg {
          position: relative;
        }
        .noise-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        .scroll-indicator {
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }

        .marquee {
          animation: marquee 20s linear infinite;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ═══════════════════ STICKY HEADER ═══════════════════ */}
      <PublicHeader />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="hero-gradient noise-bg relative min-h-screen flex items-center overflow-hidden">
        {/* Car background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80"
            alt="Auto"
            className="w-full h-full object-cover opacity-70"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/80 to-neutral-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold tracking-wider uppercase font-mono">Zuid-Limburg</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none mb-6 tracking-tight">
              Rij al voor
              <br />
              <span className="text-green-400 price-glow">€15</span> per dag.
            </h1>

            <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
              Geen poespas, geen verborgen kosten. Occasions vanaf <span className="text-white font-semibold">€105/week</span>.
              Minimaal 4 weken huren — en rijden maar.
            </p>

            {/* CTA Block */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                to="/registreren"
                className="cta-pulse bg-green-500 text-neutral-950 px-8 py-4 rounded-xl text-lg font-bold hover:bg-green-400 transition-all inline-flex items-center justify-center gap-2 hover:gap-3"
              >
                Ik wil rijden <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#auto"
                className="border border-neutral-700 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/5 transition-all inline-flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('auto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                Bekijk de auto's
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-lg">
              {[
                { value: '€15', label: 'per dag' },
                { value: '€105', label: 'per week' },
                { value: '€0', label: 'borg bij 6 mnd' },
              ].map((stat, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stat.value}</div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator">
          <div className="w-6 h-10 border-2 border-neutral-600 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-green-400 rounded-full" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOE WERKT HET ═══════════════════ */}
      <section className="py-24 sm:py-32 noise-bg relative" id="hoewerkhet" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('hoewerkhet') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono">Simpel</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Zo makkelijk werkt het</h2>
            <p className="text-neutral-400 text-lg mb-16 max-w-xl">Geen gedoe met papierwerk of ingewikkelde voorwaarden. In 3 stappen op pad.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: <Calendar className="w-6 h-6" />,
                title: 'Kies je auto & periode',
                desc: 'Bekijk ons aanbod, kies een auto die bij je past en plan je startdatum. Minimaal 4 weken.',
              },
              {
                step: '02',
                icon: <Wallet className="w-6 h-6" />,
                title: 'Betaal de eerste week',
                desc: 'Eerste week vooruit betalen en je bent klaar. Elke week daarna gewoon per week betalen. Easy.',
              },
              {
                step: '03',
                icon: <CarIcon className="w-6 h-6" />,
                title: 'Pak de sleutel & rij',
                desc: 'Haal je auto op en ga. Geen verrassingen, geen kleine lettertjes. Gewoon rijden.',
              },
            ].map((item, i) => (
              <div
                key={i}
                id={`step-${i}`}
                data-animate
                className={`fade-up stagger-${i + 1} ${isVisible('hoewerkhet') ? 'visible' : ''} card-shine border-glow rounded-2xl p-8 relative overflow-hidden group hover:border-green-500/20 transition-all duration-500`}
              >
                <span className="absolute top-6 right-6 text-6xl font-black text-white/[0.03] font-mono">{item.step}</span>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-6 group-hover:bg-green-500/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className={`fade-up ${isVisible('hoewerkhet') ? 'visible' : ''} mt-10 text-center`}>
            <Link
              to="/hoe-het-werkt"
              className="group inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold transition-colors text-base"
            >
              Meer info over hoe het werkt
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ PRIJS SECTIE ═══════════════════ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" id="prijzen" data-animate>
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-green-950/10 to-neutral-950" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('prijzen') ? 'visible' : ''} text-center mb-16`}>
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono">Prijzen</span>
              <div className="h-px w-12 bg-green-500" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Eerlijk. Scherp. Klaar.
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Wat je ziet is wat je betaalt. Geen boekingskosten, geen servicekosten, geen onzin.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Pricing Card - Standaard */}
            <div className={`fade-up stagger-1 ${isVisible('prijzen') ? 'visible' : ''} card-shine border-glow rounded-3xl p-8 sm:p-10 relative`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neutral-600 to-transparent rounded-t-3xl" />
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider font-mono mb-6">Basis</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-black font-mono">€140</span>
                <span className="text-neutral-500 text-lg">/week</span>
              </div>
              <p className="text-neutral-500 mb-8">= €20 per dag, all-in</p>
              <ul className="space-y-4 mb-10">
                {[
                  'Minimaal 4 weken huren',
                  'Per week betalen',
                  'Eerste week vooruit',
                  '€250 borg (krijg je terug)',
                  'Verzekering inbegrepen',
                  'Pechhulp inbegrepen',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/registreren"
                className="w-full block text-center border border-neutral-700 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-white/5 transition-all"
              >
                Kies basis
              </Link>
            </div>

            {/* Pricing Card - Vooruit Planner */}
            <div className={`fade-up stagger-2 ${isVisible('prijzen') ? 'visible' : ''} relative rounded-3xl p-8 sm:p-10 overflow-hidden`}
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-t-3xl" />
              <div className="absolute top-6 right-6">
                <span className="bg-green-500 text-neutral-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Populair
                </span>
              </div>
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider font-mono mb-6">Vooruit Planner</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-6xl font-black font-mono text-green-400">€105</span>
                <span className="text-neutral-500 text-lg">/week</span>
              </div>
              <p className="text-neutral-500 mb-8">= €15 per dag, <span className="text-green-400 font-semibold">GEEN borg!</span></p>
              <ul className="space-y-4 mb-10">
                {[
                  'Minimaal 6 maanden huren',
                  'Per week betalen',
                  'Eerste week bij aanmelding voldoen',
                  'GEEN borg bij 6 mnd vooruit plannen',
                  'Verzekering inbegrepen',
                  'Pechhulp inbegrepen',
                  'Voorrang bij beschikbaarheid',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-neutral-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/registreren"
                className="cta-pulse w-full block text-center bg-green-500 text-neutral-950 px-6 py-3.5 rounded-xl font-bold hover:bg-green-400 transition-all"
              >
                Plan vooruit & bespaar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURED CARS ═══════════════════ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" id="auto" data-animate>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`fade-up ${isVisible('auto') ? 'visible' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-12 bg-green-500" />
                <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono">Ons Aanbod</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-16">
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight max-w-2xl">
                  Onze <span className="text-green-400">Premium Auto's</span>
                </h2>
                <Link
                  to="/registreren"
                  className="group flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold transition-colors"
                >
                  Bekijk alles
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCars.map((car, i) => (
                  <div
                    key={car.id}
                    className="group card-shine border-glow rounded-2xl overflow-hidden hover:border-green-500/30 transition-all duration-300 cursor-pointer"
                    style={{ animationDelay: `${i * 100}ms` }}
                    onClick={() => { setViewingCar(car); setActivePhotoIdx(0); }}
                  >
                    {/* Image */}
                    <div className="relative h-56 overflow-hidden bg-neutral-900">
                      {car.images?.[0] ? (
                        <img
                          src={car.images[0]}
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <CarIcon className="w-16 h-16 text-neutral-700" />
                        </div>
                      )}
                      {/* Status badge */}
                      <div className="absolute top-4 right-4">
                        {car.status === 'available' ? (
                          <div className="bg-green-500 text-neutral-950 px-3 py-1 rounded-full text-xs font-bold">
                            Beschikbaar
                          </div>
                        ) : car.status === 'rented' ? (
                          <div className="bg-yellow-500 text-neutral-950 px-3 py-1 rounded-full text-xs font-bold">
                            Verhuurd
                          </div>
                        ) : (
                          <div className="bg-neutral-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Onderhoud
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
                        {car.description || 'Premium auto beschikbaar voor langdurige verhuur'}
                      </p>

                      {/* Specs */}
                      <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
                        <span>{car.year}</span>
                        <span>•</span>
                        <span className="capitalize">{car.specs?.transmission || 'Automaat'}</span>
                        <span>•</span>
                        <span>{car.specs?.fuel || 'Benzine'}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-neutral-500 text-xs">Vanaf</p>
                          <p className="text-2xl font-bold text-green-400">
                            €{car.weekly_rate}
                            <span className="text-sm text-neutral-500 font-normal">/week</span>
                          </p>
                        </div>
                        <span className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold group-hover:bg-green-500 group-hover:text-neutral-950 transition-all">
                          Details →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      {/* ═══════════════════ WAAROM VLOTTR ═══════════════════ */}
      <section className="py-24 sm:py-32 noise-bg" id="waarom" data-animate>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('waarom') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono">Voordelen</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-16 tracking-tight">
              Waarom Vlottr dé keuze is
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Wallet className="w-6 h-6" />,
                title: 'Spotgoedkoop',
                desc: 'Vanaf €15 per dag. Dat is minder dan een dagkaart voor het OV. Serieus.',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Alles inbegrepen',
                desc: 'Verzekering, pechhulp, wegenbelasting — het zit er allemaal bij in. Nul verrassingen.',
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: 'Per week betalen',
                desc: 'Geen grote bedragen in één keer. Elke week een vast, laag bedrag. Lekker overzichtelijk.',
              },
              {
                icon: <MapPin className="w-6 h-6" />,
                title: 'Regio Zuid-Limburg',
                desc: 'Ophalen en terugbrengen in de buurt. Geen gedoe met ver reizen om je auto op te pikken.',
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: 'Geen kleine lettertjes',
                desc: 'Wij doen niet aan verborgen kosten of ingewikkelde contracten. Wat je ziet is wat je krijgt.',
              },
              {
                icon: <PhoneCall className="w-6 h-6" />,
                title: 'Persoonlijk contact',
                desc: 'Geen callcenter in Timbuktu. Gewoon even bellen of appen als er iets is. Wij zijn er voor je.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`fade-up stagger-${(i % 4) + 1} ${isVisible('waarom') ? 'visible' : ''} group p-6 rounded-2xl border-glow card-shine hover:border-green-500/20 transition-all duration-500`}
              >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400 mb-5 group-hover:bg-green-500/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ VERGELIJKING ═══════════════════ */}
      <section className="py-24 sm:py-32" id="vergelijk" data-animate>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('vergelijk') ? 'visible' : ''} text-center mb-16`}>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              Even vergelijken
            </h2>
            <p className="text-neutral-400 text-lg">Waarom zou je nog duurder huren?</p>
          </div>

          <div className={`fade-up stagger-1 ${isVisible('vergelijk') ? 'visible' : ''} overflow-hidden rounded-2xl border-glow`}>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-5 px-6 text-sm text-neutral-500 font-mono uppercase tracking-wider" />
                  <th className="py-5 px-6 text-sm text-neutral-500 font-mono uppercase tracking-wider">Traditioneel</th>
                  <th className="py-5 px-6 text-sm font-mono uppercase tracking-wider text-green-400 bg-green-500/5">Vlottr</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Dagprijs', '€30 - €60', '€15 - €20'],
                  ['Weekprijs', '€200 - €400', '€105 - €140'],
                  ['Borg', '€500 - €1.500', '€250 of €0'],
                  ['Verzekering', 'Extra bijbetalen', 'Inbegrepen'],
                  ['Boekingskosten', '€15 - €30', 'Geen'],
                  ['Pechhulp', 'Optioneel', 'Inbegrepen'],
                ].map(([label, traditional, vlottr], i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-neutral-300">{label}</td>
                    <td className="py-4 px-6 text-sm text-neutral-500">{traditional}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-green-400 bg-green-500/5">{vlottr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SOCIAL PROOF MARQUEE ═══════════════════ */}
      <section className="py-12 border-y border-white/5 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className="marquee flex items-center gap-8">
            {[...Array(2)].map((_, setIndex) => (
              <React.Fragment key={setIndex}>
                {[
                  '⭐ "Eindelijk betaalbaar een auto huren!"',
                  '⭐ "Geen gedoe, gewoon rijden"',
                  '⭐ "Beste deal in Limburg"',
                  '⭐ "Super service, eerlijke prijs"',
                  '⭐ "Nooit meer OV voor mij"',
                  '⭐ "Aanrader voor iedereen"',
                ].map((text, i) => (
                  <span key={`${setIndex}-${i}`} className="text-neutral-600 text-sm font-medium mx-4">
                    {text}
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section className="py-24 sm:py-32 noise-bg" id="faq" data-animate>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`fade-up ${isVisible('faq') ? 'visible' : ''}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-green-500" />
              <span className="text-green-400 text-sm font-semibold tracking-wider uppercase font-mono">FAQ</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-12 tracking-tight">Veelgestelde vragen</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Hoe lang moet ik minimaal huren?',
                a: 'Minimaal 4 weken. Hoe langer je huurt, hoe voordeliger het wordt. Plan je 6 maanden vooruit? Dan betaal je geen borg!',
              },
              {
                q: 'Hoeveel borg betaal ik?',
                a: 'Bij standaard huur betaal je €250 borg, die je terugkrijgt als je de auto netjes inlevert. Plan je 6 maanden vooruit? Dan is de borg €0.',
              },
              {
                q: 'Hoe werkt het betalen?',
                a: 'Je betaalt de eerste week vooruit bij het ophalen van de auto. Daarna betaal je elke week. Simpel, overzichtelijk, geen verrassingen.',
              },
              {
                q: 'Zit verzekering erbij?',
                a: 'Ja! Alle auto\'s zijn volledig verzekerd. Pechhulp zit er ook bij. Je hoeft nergens extra voor te betalen.',
              },
              {
                q: 'Wat voor auto\'s hebben jullie?',
                a: 'Betrouwbare occasions in goede staat. Geen luxe bolides, maar prima auto\'s die je van A naar B brengen. Ideaal voor dagelijks gebruik.',
              },
              {
                q: 'Waar kan ik de auto ophalen?',
                a: 'In de regio Zuid-Limburg. Exacte locatie krijg je na je aanmelding. Makkelijk bereikbaar en vlakbij.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className={`fade-up stagger-${(i % 4) + 1} ${isVisible('faq') ? 'visible' : ''} group border-glow rounded-xl overflow-hidden`}
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-white/[0.02] transition-colors list-none">
                  <span className="font-semibold text-white pr-4">{item.q}</span>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-6 text-neutral-400 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="py-24 sm:py-32 relative overflow-hidden" id="finalcta" data-animate>
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/20 via-neutral-950 to-neutral-950" />
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://www.rijlesdenhaag.nl/wp-content/uploads/2023/07/Waarschuwingslampjes-dashboard-auto.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`fade-up ${isVisible('finalcta') ? 'visible' : ''}`}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight">
              Stop met duur huren.
              <br />
              <span className="text-green-400">Begin met Vlottr.</span>
            </h2>
            <p className="text-neutral-400 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
              Meld je aan, kies je auto, betaal de eerste week en ga rijden. Zo simpel is het.
            </p>
            <Link
              to="/registreren"
              className="cta-pulse inline-flex items-center gap-3 bg-green-500 text-neutral-950 px-10 py-5 rounded-xl text-xl font-bold hover:bg-green-400 transition-all hover:scale-105"
            >
              Nu aanmelden <ArrowRight className="w-6 h-6" />
            </Link>
            <p className="text-neutral-600 text-sm mt-6">Geen verplichtingen. Gratis aanmelden. Direct beschikbaar.</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CAR DETAIL MODAL ═══════════════════ */}
      {viewingCar && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={() => setViewingCar(null)}
        >
          <div
            className="bg-[#0a0a0a] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/[0.12]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{viewingCar.brand} {viewingCar.model}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">{viewingCar.year} · {viewingCar.specs?.transmission || 'Automaat'} · {viewingCar.specs?.fuel || 'Benzine'}</p>
              </div>
              <button
                onClick={() => setViewingCar(null)}
                className="p-2 hover:bg-white/[0.08] rounded-full text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo */}
            {viewingCar.images && viewingCar.images.length > 0 && (
              <div className="relative">
                <img
                  src={viewingCar.images[activePhotoIdx]}
                  alt={`${viewingCar.brand} ${viewingCar.model}`}
                  className="w-full h-64 object-cover"
                />
                {viewingCar.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActivePhotoIdx(i => (i - 1 + viewingCar.images.length) % viewingCar.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActivePhotoIdx(i => (i + 1) % viewingCar.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {activePhotoIdx + 1} / {viewingCar.images.length}
                    </div>
                  </>
                )}
                {/* Status badge */}
                <div className="absolute top-3 left-3">
                  {viewingCar.status === 'available' ? (
                    <span className="bg-green-500 text-neutral-950 px-3 py-1 rounded-full text-xs font-bold">Beschikbaar</span>
                  ) : viewingCar.status === 'rented' ? (
                    <span className="bg-yellow-500 text-neutral-950 px-3 py-1 rounded-full text-xs font-bold">Verhuurd</span>
                  ) : (
                    <span className="bg-neutral-600 text-white px-3 py-1 rounded-full text-xs font-bold">Onderhoud</span>
                  )}
                </div>
              </div>
            )}

            <div className="p-6 space-y-5">
              {/* Price */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Wekelijks tarief</p>
                  <p className="text-3xl font-black text-green-400">€{viewingCar.weekly_rate}<span className="text-sm text-neutral-500 font-normal"> / week</span></p>
                </div>
                <p className="text-xs text-neutral-600">Incl. BTW · min. 4 weken</p>
              </div>

              {/* Description */}
              {viewingCar.description && (
                <div>
                  <h4 className="text-sm font-medium text-neutral-400 mb-2">Over deze auto</h4>
                  <p className="text-neutral-300 text-sm leading-relaxed">{viewingCar.description}</p>
                </div>
              )}

              {/* Highlights */}
              {Array.isArray(viewingCar.specs?.highlights) && viewingCar.specs.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(viewingCar.specs.highlights as string[]).map((h: string) => (
                    <span key={h} className="px-2 py-1 bg-white/[0.05] border border-white/[0.08] rounded-full text-xs text-neutral-300">{h}</span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-3 pt-1">
                <Link
                  to="/registreren"
                  className="flex-1 bg-green-500 hover:bg-green-400 text-neutral-950 font-bold py-3.5 rounded-xl text-center transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Huur mij!
                </Link>
                <button
                  onClick={() => setViewingCar(null)}
                  className="px-5 py-3.5 border border-white/[0.12] text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors font-medium"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo variant="glow" size="sm" />
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <Link to="/terms" className="hover:text-white transition-colors">Algemene Voorwaarden</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacybeleid</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
            <div className="text-sm text-neutral-600">
              © {new Date().getFullYear()} Vlottr · Zuid-Limburg
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;