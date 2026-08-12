import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Chrome,
  Menu,
  Share2,
  Plus,
  MoreVertical,
  ArrowLeft,
  Download
} from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';

type Platform = 'android-chrome' | 'ios-safari' | 'desktop-chrome' | 'desktop-edge';

const PWAInstallGuide: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('android-chrome');

  const platforms = [
    {
      id: 'android-chrome' as Platform,
      name: 'Android - Chrome',
      icon: () => (
        <div className="relative">
          <Smartphone className="w-8 h-8" />
          <Chrome className="w-4 h-4 absolute -bottom-1 -right-1 text-[#4285f4]" />
        </div>
      )
    },
    {
      id: 'ios-safari' as Platform,
      name: 'iPhone - Safari',
      icon: () => (
        <div className="relative">
          <Smartphone className="w-8 h-8" />
          <div className="w-4 h-4 absolute -bottom-1 -right-1 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">S</span>
          </div>
        </div>
      )
    },
    {
      id: 'desktop-chrome' as Platform,
      name: 'Desktop - Chrome',
      icon: () => (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <Chrome className="w-6 h-6 ml-2 text-[#4285f4]" />
        </div>
      )
    },
    {
      id: 'desktop-edge' as Platform,
      name: 'Desktop - Edge',
      icon: () => (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div className="w-6 h-6 ml-2 rounded-full bg-gradient-to-br from-blue-500 to-green-400"></div>
        </div>
      )
    }
  ];

  const instructions: Record<Platform, { steps: { title: string; description: string; icon: React.ReactNode }[] }> = {
    'android-chrome': {
      steps: [
        {
          title: 'Open Chrome Browser',
          description: 'Open Vlottr.eu in de Chrome browser op je Android telefoon',
          icon: <Chrome className="w-10 h-10 text-[#4285f4]" />
        },
        {
          title: 'Open Menu',
          description: 'Tik op de drie puntjes (⋮) rechts bovenin je scherm',
          icon: <MoreVertical className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Toevoegen aan startscherm',
          description: 'Tik op "Toevoegen aan startscherm" of "App installeren"',
          icon: <Download className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Bevestig installatie',
          description: 'Tik op "Toevoegen" of "Installeren" om te bevestigen',
          icon: <Plus className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Klaar! 🎉',
          description: 'Vlottr staat nu op je startscherm als een echte app!',
          icon: <Smartphone className="w-10 h-10 text-green-400" />
        }
      ]
    },
    'ios-safari': {
      steps: [
        {
          title: 'Open Safari Browser',
          description: 'Open Vlottr.eu in Safari (standaard browser) op je iPhone',
          icon: (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">S</span>
            </div>
          )
        },
        {
          title: 'Tik op Deel-knop',
          description: 'Tik op het deel-icoon (vierkant met pijl omhoog) onderaan je scherm',
          icon: <Share2 className="w-10 h-10 text-blue-400" />
        },
        {
          title: 'Scroll naar beneden',
          description: 'Scroll in het menu naar beneden en zoek "Zet in beginscherm"',
          icon: <div className="flex flex-col gap-1">
            <div className="h-1 w-12 bg-neutral-600 rounded"></div>
            <div className="h-1 w-10 bg-neutral-600 rounded"></div>
            <div className="h-1 w-12 bg-green-400 rounded"></div>
          </div>
        },
        {
          title: 'Zet in beginscherm',
          description: 'Tik op "Zet in beginscherm" met het plus-icoon',
          icon: <Plus className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Bevestig',
          description: 'Tik rechts bovenin op "Voeg toe" om te bevestigen',
          icon: <Plus className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Klaar! 🎉',
          description: 'Vlottr staat nu op je beginscherm als een echte app!',
          icon: <Smartphone className="w-10 h-10 text-green-400" />
        }
      ]
    },
    'desktop-chrome': {
      steps: [
        {
          title: 'Open Chrome',
          description: 'Open Vlottr.eu in de Chrome browser op je computer',
          icon: <Chrome className="w-10 h-10 text-[#4285f4]" />
        },
        {
          title: 'Installatie prompt',
          description: 'Klik op het installatie-icoon in de adresbalk (rechts van de URL)',
          icon: <Download className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Of via menu',
          description: 'Of ga naar Menu (⋮) → "Vlottr installeren..." of "App installeren"',
          icon: <Menu className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Bevestig installatie',
          description: 'Klik op "Installeren" in de popup',
          icon: <Plus className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Klaar! 🎉',
          description: 'Vlottr opent als zelfstandige applicatie!',
          icon: <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
            <Chrome className="w-8 h-8 text-green-400" />
          </div>
        }
      ]
    },
    'desktop-edge': {
      steps: [
        {
          title: 'Open Edge',
          description: 'Open Vlottr.eu in de Microsoft Edge browser',
          icon: <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-400"></div>
        },
        {
          title: 'Installatie prompt',
          description: 'Klik op het installatie-icoon in de adresbalk (rechts van de URL)',
          icon: <Download className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Of via menu',
          description: 'Of ga naar Menu (…) → "Apps" → "Vlottr installeren"',
          icon: <Menu className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Bevestig installatie',
          description: 'Klik op "Installeren" in de popup',
          icon: <Plus className="w-10 h-10 text-green-400" />
        },
        {
          title: 'Klaar! 🎉',
          description: 'Vlottr opent als zelfstandige applicatie!',
          icon: <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-green-400"></div>
          </div>
        }
      ]
    }
  };

  const currentInstructions = instructions[selectedPlatform];

  return (
    <div className="min-h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <PublicHeader />

      <main className="max-w-5xl mx-auto px-4 lg:px-6 py-12 pt-32">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            📱 Installeer Vlottr als App
          </h1>
        </div>

        {/* Platform Selection */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`vl-card p-6 flex flex-col items-center gap-3 transition-all ${
                selectedPlatform === platform.id
                  ? 'border-green-500 bg-green-500/[0.05]'
                  : 'border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              <platform.icon />
              <span className={`text-sm font-medium text-center ${
                selectedPlatform === platform.id ? 'text-green-400' : 'text-white'
              }`}>
                {platform.name}
              </span>
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div className="vl-card p-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Installatie instructies
          </h2>

          <div className="space-y-6">
            {currentInstructions.steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-6 p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-green-500/[0.3] transition-all"
              >
                {/* Step Number + Icon */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-green-500/[0.1] border-2 border-green-500 flex items-center justify-center text-green-400 font-bold text-lg mb-3">
                    {index + 1}
                  </div>
                  <div className="flex justify-center">
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-neutral-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="vl-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/[0.1] flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-bold text-white mb-2">Sneller</h3>
            <p className="text-sm text-neutral-400">
              Direct toegang zonder browser te openen
            </p>
          </div>

          <div className="vl-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/[0.1] flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📲</span>
            </div>
            <h3 className="font-bold text-white mb-2">App-ervaring</h3>
            <p className="text-sm text-neutral-400">
              Volledig scherm zonder browser balk
            </p>
          </div>

          <div className="vl-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/[0.1] flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="font-bold text-white mb-2">Notificaties</h3>
            <p className="text-sm text-neutral-400">
              Blijf op de hoogte van je boekingen
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link to="/registreren" className="vl-btn-primary inline-flex">
            Start met huren
            <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PWAInstallGuide;
