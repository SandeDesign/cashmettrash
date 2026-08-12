import React, { useState, useEffect } from 'react';
import { Eye, Loader2, Search } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useRentalCarInspectionStore } from '../../store/rentalCarInspectionStore';
import { useBookingStore } from '../../store/bookingStore';
import { InspectionFormModal } from '../../components/inspection';
import { RentalCarInspectionForm, Booking } from '../../types';

const ManagerInspectionForms: React.FC = () => {
  const { inspectionForms, loading, fetchAllInspectionForms } = useRentalCarInspectionStore();
  const { bookings } = useBookingStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<RentalCarInspectionForm | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAllInspectionForms();
  }, [fetchAllInspectionForms]);

  const getBookingInfo = (bookingId: string) => {
    return bookings.find(b => b.id === bookingId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'voeg_fotos_toe': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'in_behandeling': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'goedgekeurd': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'afgekeurd': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'voeg_fotos_toe': return 'Fotos toevoegen';
      case 'in_behandeling': return 'In behandeling';
      case 'goedgekeurd': return 'Goedgekeurd';
      case 'afgekeurd': return 'Afgekeurd';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    return type === 'ophalen' ? 'Ophaalbewijs' : 'Afleveringsbewijs';
  };

  const filteredForms = inspectionForms.filter(form => {
    const booking = getBookingInfo(form.booking_id);
    const customerName = booking?.customer_snapshot?.name || '';
    const bookingId = form.booking_id;

    return !searchTerm ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bookingId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenForm = (form: RentalCarInspectionForm) => {
    const booking = getBookingInfo(form.booking_id);
    setSelectedForm(form);
    setSelectedBooking(booking || null);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header title="Inspectieformulieren" />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-green-400 mb-4" />
              <p className="text-neutral-400">Laden...</p>
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
        <Header title="Inspectieformulieren" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-6xl mx-auto">
            {/* Search */}
            <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600" />
                <input
                  type="text"
                  placeholder="Zoek op klant of boekingsnummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="vl-input !pl-12 pr-4 w-full"
                />
              </div>
            </div>

            {/* Forms List */}
            <div className="space-y-4">
              {filteredForms.length === 0 ? (
                <div className="vl-card p-8 rounded-lg shadow-sm border border-white/[0.1] text-center">
                  <p className="text-neutral-400">Geen formulieren gevonden</p>
                </div>
              ) : (
                filteredForms.map(form => {
                  const booking = getBookingInfo(form.booking_id);
                  return (
                    <div key={form.id} className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] hover:border-white/[0.2] transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {booking?.customer_snapshot?.name || 'Onbekende klant'}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(form.status)}`}>
                              {getStatusText(form.status)}
                            </span>
                            <span className="text-xs text-neutral-400 bg-neutral-900/50 px-2 py-1 rounded">
                              {getTypeText(form.type)}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-400">
                            Boeking: {form.booking_id}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Aangemaakt: {new Date(form.created_at).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenForm(form)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4" />
                          Bekijken
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Inspection Form Modal */}
      {selectedForm && selectedBooking && (
        <InspectionFormModal
          booking={selectedBooking}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedForm(null);
            setSelectedBooking(null);
          }}
          inspectionType={selectedForm.type}
          isReviewMode={true}
        />
      )}
    </div>
  );
};

export default ManagerInspectionForms;
