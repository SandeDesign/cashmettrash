import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogIn, Smartphone, Handshake } from 'lucide-react';
import Logo from '../shared/Logo';

const PublicHeader: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrollY > 50 ? 'rgba(10,10,10,0.92)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <Link to="/">
            <Logo variant="strong-glow" size="md" />
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="bg-green-500 text-neutral-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-400 transition-all flex items-center gap-2"
            >
              <Menu className="w-4 h-4" />
              Menu
            </button>

            {/* Mobile dropdown */}
            {mobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  <Link
                    to="/partner-worden"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800 transition-colors border-b border-neutral-800"
                  >
                    <Handshake className="w-4 h-4 text-green-400" />
                    <span>Partner worden</span>
                  </Link>
                  <Link
                    to="/pwa-install"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800 transition-colors border-b border-neutral-800"
                  >
                    <Smartphone className="w-4 h-4 text-green-400" />
                    <span>Installeer App</span>
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800 transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-green-400" />
                    <span>Inloggen</span>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/partner-worden" className="text-neutral-300 hover:text-green-400 transition-colors flex items-center gap-2">
              <Handshake className="w-4 h-4" />
              Partner worden
            </Link>
            <Link to="/pwa-install" className="text-neutral-300 hover:text-green-400 transition-colors flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Installeer App
            </Link>
            <Link to="/login" className="text-neutral-300 hover:text-green-400 transition-colors">
              Inloggen
            </Link>
            <Link
              to="/registreren"
              className="bg-green-500 text-neutral-950 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-400 transition-all hover:scale-105"
            >
              Aanmelden
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
