import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarStore } from '../../store/carStore';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import {
  FileText,
  Download,
  ArrowLeft,
  Car as CarIcon,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';

interface Document {
  id: string;
  name: string;
  description: string;
  url?: string;
  expiryDate?: string;
  icon: any;
  category: 'apk' | 'insurance' | 'registration' | 'other';
}

export function CustomerDocuments() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore();
  const { cars, fetchCars } = useCarStore();

  // LOAD BOOKINGS AND CARS ON MOUNT
  useEffect(() => {
    if (user?.uid) {
      console.log('[Documents] Loading bookings and cars for user:', user.uid);
      fetchBookings({ customer_id: user.uid });
      fetchCars();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only re-fetch when user ID changes

  // Get active booking
  const activeBooking = bookings.find(
    b => b.customer_id === user?.uid && (b.status === 'active' || b.status === 'confirmed')
  );

  const car = activeBooking ? cars.find(c => c.id === activeBooking.car_id) : null;

  // Prepare documents - Only APK and Groene Kaart
  const documents: Document[] = car ? [
    {
      id: 'apk',
      name: 'APK/RDW Bewijs',
      description: 'APK keuringsrapport en RDW documentatie',
      url: car.apk_document_url,
      expiryDate: car.apk_expiry_date,
      icon: CheckCircle2,
      category: 'apk'
    },
    {
      id: 'groene-kaart',
      name: 'Groene Kaart',
      description: 'Internationaal verzekeringsbewijs',
      url: car.groene_kaart_url,
      icon: Shield,
      category: 'insurance'
    }
  ].filter(doc => doc.url) : []; // Only show documents that have a URL

  // Check if document is expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  };

  // Check if document is expired
  const isExpired = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    return expiry < now;
  };

  const handleDownload = (doc: Document) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  if (!car) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Terug naar Dashboard
              </button>

              <div className="vl-card rounded-xl p-8 text-center border border-white/[0.1]">
                <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  Geen Actieve Boeking
                </h2>
                <p className="text-neutral-400">
                  Je hebt momenteel geen actieve huurauto. Documenten zijn alleen beschikbaar tijdens een actieve huurperiode.
                </p>
              </div>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Terug naar Dashboard
              </button>
              <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="w-7 h-7 text-green-400" />
                Auto Documenten
              </h1>
              <p className="text-neutral-400">
                Bekijk en download alle documenten van je huurauto
              </p>
            </div>

            {/* Car Info */}
            <div className="vl-card rounded-lg p-4 mb-6 border border-white/[0.1]">
              <div className="flex items-center gap-3">
                <CarIcon className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="text-white font-semibold">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {car.license_plate} • {car.year}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Grid */}
            {documents.length === 0 ? (
              <div className="vl-card rounded-xl p-8 text-center border border-white/[0.1]">
                <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nog Geen Documenten Beschikbaar
                </h3>
                <p className="text-neutral-400 text-sm">
                  De documenten voor deze auto worden binnenkort toegevoegd door de beheerder.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map(doc => {
                  const Icon = doc.icon;
                  const expiring = isExpiringSoon(doc.expiryDate);
                  const expired = isExpired(doc.expiryDate);

                  return (
                    <div
                      key={doc.id}
                      className={`vl-card rounded-lg p-6 border transition-all hover:shadow-lg ${
                        expired
                          ? 'border-red-500/30 bg-red-500/5'
                          : expiring
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-white/[0.1]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            expired
                              ? 'bg-red-500/10'
                              : expiring
                              ? 'bg-amber-500/10'
                              : 'bg-green-500/10'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              expired
                                ? 'text-red-400'
                                : expiring
                                ? 'text-amber-400'
                                : 'text-green-400'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{doc.name}</h3>
                            <p className="text-xs text-neutral-400">{doc.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Expiry Date */}
                      {doc.expiryDate && (
                        <div className={`text-xs mb-4 px-3 py-2 rounded-md ${
                          expired
                            ? 'bg-red-500/10 text-red-300'
                            : expiring
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-green-500/10 text-green-300'
                        }`}>
                          {expired && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Verlopen op {new Date(doc.expiryDate).toLocaleDateString('nl-NL')}</span>
                            </div>
                          )}
                          {!expired && expiring && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Verloopt {new Date(doc.expiryDate).toLocaleDateString('nl-NL')}</span>
                            </div>
                          )}
                          {!expired && !expiring && (
                            <span>Geldig tot {new Date(doc.expiryDate).toLocaleDateString('nl-NL')}</span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-400 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Bekijken
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Info */}
            <div className="mt-6 vl-card rounded-lg p-4 border border-blue-500/30 bg-blue-500/5">
              <p className="text-sm text-neutral-300">
                💡 <span className="font-medium text-white">Let op:</span> Deze documenten zijn alleen beschikbaar tijdens je actieve huurperiode.
                Bewaar kopieën indien nodig voor controles.
              </p>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default CustomerDocuments;
