import React, { useState, useEffect } from 'react';
import { Search, Filter, Car as CarIcon, Loader2, Calendar, Euro, X, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import BookingModal from '../../components/booking/BookingModal';
import WaitlistModal from '../../components/car/WaitlistModal';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Car } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useAuth } from '../../hooks/useAuth';

const CustomerCars: React.FC = () => {
  const { user } = useAuth();
  const { settings, loadSettings } = useSettingsStore();
  const { fetchWaitlists, isCustomerOnWaitlist } = useWaitlistStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [waitlistCar, setWaitlistCar] = useState<Car | null>(null);
  const [viewingCar, setViewingCar] = useState<Car | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Filter states
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price'>('newest');

  useEffect(() => {
    loadSettings();
    loadCars();
    if (user) {
      fetchWaitlists();
    }
  }, [loadSettings, user]);

  const loadCars = async () => {
    try {
      setLoading(true);
      // Show ALL published cars (available AND rented)
      const q = query(
        collection(db, 'cars'),
        where('published', '==', true)
      );

      const snapshot = await getDocs(q);
      const carsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Car));

      setCars(carsData);
    } catch (error) {
      console.error('Error loading cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = cars.filter(car => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        car.brand?.toLowerCase().includes(search) ||
        car.model?.toLowerCase().includes(search) ||
        car.license_plate?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Brand filter
    if (brandFilter && car.brand !== brandFilter) {
      return false;
    }

    // Year filter
    if (yearFilter && car.year?.toString() !== yearFilter) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Sort logic
    if (sortBy === 'newest') {
      return b.year - a.year;
    } else if (sortBy === 'oldest') {
      return a.year - b.year;
    }
    // price is the same for all, so no need to sort
    return 0;
  });

  // Get unique brands and years for filters
  const uniqueBrands = Array.from(new Set(cars.map(car => car.brand).filter(Boolean))).sort();
  const uniqueYears = Array.from(new Set(cars.map(car => car.year?.toString()).filter(Boolean))).sort().reverse();

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Auto's Huren" />

        <main data-tour="cars-page" className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Search and Filter */}
            <div className="vl-card p-4 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Zoek op merk, model, kenteken..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full !pl-12 pr-4 py-2 bg-black/30 border border-white/[0.1] rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-neutral-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center px-4 py-2 border border-white/[0.1] rounded-md hover:bg-[var(--vl-bg-primary)] transition-colors lg:w-auto"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="mt-4 p-4 border border-white/[0.1] rounded-md bg-[var(--vl-bg-primary)]">
                  <h3 className="text-sm font-medium text-white mb-3">Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Merk
                      </label>
                      <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-md focus:ring-2 focus:ring-green-500 text-sm text-white"
                      >
                        <option value="">Alle merken</option>
                        {uniqueBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Bouwjaar
                      </label>
                      <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-md focus:ring-2 focus:ring-green-500 text-sm text-white"
                      >
                        <option value="">Alle jaren</option>
                        {uniqueYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Sorteren op
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'price')}
                        className="w-full px-3 py-2 bg-black/30 border border-white/[0.1] rounded-md focus:ring-2 focus:ring-green-500 text-sm text-white"
                      >
                        <option value="newest">Nieuwste eerst</option>
                        <option value="oldest">Oudste eerst</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setBrandFilter('');
                      setYearFilter('');
                      setSortBy('newest');
                    }}
                    className="mt-3 text-sm text-green-400 hover:text-green-300 transition-colors"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredCars.length === 0 && (
              <div className="text-center py-12">
                <CarIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  {searchTerm ? 'Geen auto\'s gevonden' : 'Nog geen auto\'s beschikbaar'}
                </h3>
                <p className="text-neutral-500 mb-4">
                  {searchTerm
                    ? 'Probeer een andere zoekopdracht'
                    : 'Er zijn momenteel geen auto\'s beschikbaar voor verhuur.'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-400 transition-colors"
                  >
                    Wis zoekopdracht
                  </button>
                )}
              </div>
            )}

            {/* Cars Grid */}
            {!loading && filteredCars.length > 0 && (
              <div data-tour="cars-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCars.map((car, index) => (
                  <div
                    key={car.id}
                    data-tour={index === 0 ? 'car-card' : undefined}
                    className="vl-card rounded-lg shadow-sm border border-white/[0.1] overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Car Image with Status Badge */}
                    <div className="relative">
                      {car.images && car.images.length > 0 ? (
                        <img
                          src={car.images[0]}
                          alt={`${car.brand} ${car.model}`}
                          onClick={() => { setViewingCar(car); setActivePhotoIdx(0); }}
                          className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div
                          onClick={() => { setViewingCar(car); setActivePhotoIdx(0); }}
                          className="w-full h-48 bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
                        >
                          <CarIcon className="w-16 h-16 text-neutral-600" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {car.status === 'available' ? (
                          <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                            Beschikbaar
                          </span>
                        ) : car.status === 'rented' ? (
                          <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                            Verhuurd
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-neutral-500 text-white text-xs font-bold rounded-full">
                            {car.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Car Details */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {car.brand} {car.model}
                      </h3>
                      <p className="text-sm text-neutral-500 mb-3">
                        {car.year} • {car.license_plate}
                      </p>

                      {car.description && (
                        <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
                          {car.description}
                        </p>
                      )}

                      <div className="space-y-3 pt-3 border-t border-white/[0.1]">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center text-green-400 font-bold text-lg">
                              <Euro className="w-5 h-5 mr-1" />
                              70
                            </div>
                            <p className="text-xs text-neutral-500">per week</p>
                            <p className="text-xs text-neutral-600">incl. BTW • min. 4 weken</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setViewingCar(car); setActivePhotoIdx(0); }}
                            className="flex-1 bg-white/[0.08] text-white border border-white/[0.12] px-4 py-2 rounded-md hover:bg-white/[0.12] transition-colors text-sm font-medium"
                          >
                            Details
                          </button>
                          {car.status === 'available' ? (
                            <button
                              onClick={() => setSelectedCar(car)}
                              className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-400 transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              Huur nu
                            </button>
                          ) : user && isCustomerOnWaitlist(car.id, user.uid) ? (
                            <button
                              disabled
                              className="flex-1 bg-blue-900 text-blue-300 px-4 py-2 rounded-md cursor-not-allowed text-sm font-medium flex items-center justify-center"
                            >
                              <Bell className="w-4 h-4 mr-1" />
                              Op wachtlijst
                            </button>
                          ) : (
                            <button
                              onClick={() => setWaitlistCar(car)}
                              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-400 transition-colors text-sm font-medium flex items-center justify-center"
                            >
                              <Bell className="w-4 h-4 mr-1" />
                              Wachtlijst
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />

      {/* Car Detail Modal */}
      {viewingCar && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/[0.2]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.1] flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {viewingCar.brand} {viewingCar.model}
              </h3>
              <button
                onClick={() => setViewingCar(null)}
                className="text-neutral-600 hover:text-neutral-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Photo gallery */}
              {viewingCar.images && viewingCar.images.length > 0 && (
                <div className="mb-6">
                  {/* Main photo */}
                  <div className="relative">
                    <img
                      src={viewingCar.images[activePhotoIdx]}
                      alt={`${viewingCar.brand} ${viewingCar.model} foto ${activePhotoIdx + 1}`}
                      className="w-full h-80 object-cover rounded-lg"
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
                  </div>
                  {/* Thumbnails */}
                  {viewingCar.images.length > 1 && (
                    <div className="flex gap-2 mt-2">
                      {viewingCar.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePhotoIdx(idx)}
                          className={`flex-1 h-16 rounded overflow-hidden border-2 transition-colors ${
                            idx === activePhotoIdx ? 'border-green-500' : 'border-transparent hover:border-white/30'
                          }`}
                        >
                          <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-neutral-400 mb-2">Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Merk</span>
                      <span className="text-white font-medium">{viewingCar.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Model</span>
                      <span className="text-white font-medium">{viewingCar.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Bouwjaar</span>
                      <span className="text-white font-medium">{viewingCar.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Kenteken</span>
                      <span className="text-white font-medium">{viewingCar.license_plate}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-neutral-400 mb-2">Prijs</h4>
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      €{viewingCar.weekly_rate || 140} <span className="text-sm text-neutral-500">/ week</span>
                    </div>
                    <p className="text-xs text-neutral-600">Inclusief BTW</p>
                    <p className="text-sm text-neutral-500 mt-2">Minimaal 4 weken</p>
                  </div>
                </div>
              </div>

              {/* Highlights badges */}
              {Array.isArray(viewingCar.specs?.highlights) && viewingCar.specs.highlights.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-medium text-neutral-400 mb-2">Uitrusting</h4>
                  <div className="flex flex-wrap gap-2">
                    {(viewingCar.specs.highlights as string[]).map((h: string) => (
                      <span key={h} className="px-2 py-1 bg-white/[0.06] border border-white/[0.1] rounded-full text-xs text-neutral-300">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description / samenvatting */}
              {viewingCar.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-neutral-400 mb-2">Over deze auto</h4>
                  <p className="text-neutral-300 leading-relaxed">{viewingCar.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {viewingCar.status === 'available' ? (
                  <button
                    onClick={() => {
                      setSelectedCar(viewingCar);
                      setViewingCar(null);
                    }}
                    className="flex-1 bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-400 transition-colors font-medium flex items-center justify-center"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Huur deze auto
                  </button>
                ) : user && isCustomerOnWaitlist(viewingCar.id, user.uid) ? (
                  <button
                    disabled
                    className="flex-1 bg-blue-900 text-blue-300 px-6 py-3 rounded-md font-medium flex items-center justify-center opacity-70 cursor-not-allowed"
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    Op wachtlijst
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setWaitlistCar(viewingCar);
                      setViewingCar(null);
                    }}
                    className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-400 transition-colors font-medium flex items-center justify-center"
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    Reserveren
                  </button>
                )}
                <button
                  onClick={() => setViewingCar(null)}
                  className="px-6 py-3 border border-white/[0.12] rounded-md hover:bg-[var(--vl-bg-primary)] transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedCar && (
        <BookingModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
          onSuccess={() => {
            setSelectedCar(null);
            loadCars();
          }}
        />
      )}

      {/* Waitlist Modal */}
      {waitlistCar && (
        <WaitlistModal
          car={waitlistCar}
          isOpen={true}
          onClose={() => setWaitlistCar(null)}
          onSuccess={() => {
            setWaitlistCar(null);
            if (user) {
              fetchWaitlists();
            }
          }}
        />
      )}
    </div>
  );
};

export default CustomerCars;
