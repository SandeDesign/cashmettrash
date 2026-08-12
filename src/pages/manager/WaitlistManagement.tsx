import React, { useState, useEffect } from 'react';
import { Bell, Search, Loader2, Car as CarIcon, User, Trash2, Send, CheckCircle, RotateCcw, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import NotifyDateModal from '../../components/manager/NotifyDateModal';
import AlternativeCarsModal from '../../components/manager/AlternativeCarsModal';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useCarStore } from '../../store/carStore';
import { useBookingStore } from '../../store/bookingStore';
import { useModal } from '../../contexts/ModalContext';
import { Waitlist } from '../../types';

const WaitlistManagement: React.FC = () => {
  const { waitlists, loading, fetchWaitlists, removeFromWaitlist, notifyWaitlist, resetToWaiting } = useWaitlistStore();
  const { cars, fetchCars } = useCarStore();
  const { fetchBookings } = useBookingStore();
  const { showError, showSuccess, showConfirm } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [carFilter, setCarFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [selectedCarForNotify, setSelectedCarForNotify] = useState<{ id: string; name: string; count: number } | null>(null);
  const [showAlternativeModal, setShowAlternativeModal] = useState(false);
  const [selectedWaitlistForAlternative, setSelectedWaitlistForAlternative] = useState<Waitlist | null>(null);
  const [expandedWaitlistId, setExpandedWaitlistId] = useState<string | null>(null);

  // Fetch waitlists, cars, and bookings on mount
  useEffect(() => {
    fetchWaitlists();
    fetchCars();
    fetchBookings({});
  }, [fetchWaitlists, fetchCars, fetchBookings]);

  // Get unique cars with waitlists
  const carsWithWaitlists = [...new Set(waitlists.map(w => w.car_id))];

  // Filter waitlists
  const filteredWaitlists = waitlists.filter(waitlist => {
    const matchesStatus = statusFilter === 'all' || waitlist.status === statusFilter;
    const matchesCar = carFilter === 'all' || waitlist.car_id === carFilter;
    const car = cars.find(c => c.id === waitlist.car_id);
    const matchesSearch = !searchTerm ||
      waitlist.customer_snapshot?.name || 'Onbekende klant'.toLowerCase().includes(searchTerm.toLowerCase()) ||
      waitlist.customer_snapshot?.email || 'Geen email'.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car?.model.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesCar && matchesSearch;
  });

  const getCarDetails = (carId: string) => {
    return cars.find(c => c.id === carId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'notified': return 'bg-blue-100 text-blue-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Wachtend';
      case 'notified': return 'Genotificeerd';
      case 'converted': return 'Geboekt';
      case 'cancelled': return 'Geannuleerd';
      default: return status;
    }
  };

  const handleNotifyWaitlist = (carId: string) => {
    const car = getCarDetails(carId);
    if (!car) {
      showError('Auto niet gevonden!');
      return;
    }

    const waitingForCar = waitlists.filter(w => w.car_id === carId && w.status === 'waiting');
    if (waitingForCar.length === 0) {
      showError('Geen personen op de wachtlijst voor deze auto.');
      return;
    }

    // Open modal with car details
    setSelectedCarForNotify({
      id: carId,
      name: `${car.brand} ${car.model}`,
      count: waitingForCar.length,
    });
    setShowNotifyModal(true);
  };

  const handleConfirmNotify = async (availableFrom: string) => {
    if (!selectedCarForNotify) return;

    try {
      await notifyWaitlist(selectedCarForNotify.id, availableFrom);
      showSuccess(`Wachtlijst genotificeerd! ${selectedCarForNotify.count} ${selectedCarForNotify.count === 1 ? 'melding verzonden' : 'meldingen verzonden'}.`);

      // Refresh the waitlist
      await fetchWaitlists();

      // Close modal
      setShowNotifyModal(false);
      setSelectedCarForNotify(null);
    } catch (error: any) {
      console.error('Error notifying waitlist:', error);
      showError(`Er is een fout opgetreden: ${error.message || 'Onbekende fout'}`);
    }
  };

  const handleOfferAlternatives = (waitlist: Waitlist) => {
    setSelectedWaitlistForAlternative(waitlist);
    setShowAlternativeModal(true);
  };

  const handleConfirmAlternatives = async (carIds: string[], availableFrom: string) => {
    if (!selectedWaitlistForAlternative) return;

    try {
      // Import the function from waitlistStore
      const { notifyWithAlternatives } = useWaitlistStore.getState();

      await notifyWithAlternatives(
        selectedWaitlistForAlternative.customer_id,
        selectedWaitlistForAlternative.car_id,
        carIds,
        availableFrom
      );

      showSuccess(`Alternatieve auto's aangeboden! Klant ontvangt een notificatie met ${carIds.length} ${carIds.length === 1 ? 'optie' : 'opties'}.`);

      // Refresh the waitlist
      await fetchWaitlists();

      // Close modal
      setShowAlternativeModal(false);
      setSelectedWaitlistForAlternative(null);
    } catch (error: any) {
      console.error('Error offering alternatives:', error);
      showError(`Er is een fout opgetreden: ${error.message || 'Onbekende fout'}`);
    }
  };

  const handleRemoveFromWaitlist = async (waitlist: Waitlist) => {
    const car = getCarDetails(waitlist.car_id);
    await showConfirm(
      'Verwijderen van wachtlijst',
      `Weet je zeker dat je ${waitlist.customer_snapshot?.name || 'Onbekende klant'} wilt verwijderen van de wachtlijst voor ${car?.brand} ${car?.model}?`,
      async () => {
        try {
          await removeFromWaitlist(waitlist.id);
          showSuccess('Verwijderd van wachtlijst!');
        } catch (error) {
          console.error('Error removing from waitlist:', error);
          showError('Er is een fout opgetreden bij het verwijderen.');
        }
      },
      'warning'
    );
  };

  const handleResetToWaiting = async (waitlist: Waitlist) => {
    const car = getCarDetails(waitlist.car_id);
    await showConfirm(
      'Status resetten',
      `Weet je zeker dat je de status van ${waitlist.customer_snapshot?.name || 'Onbekende klant'} wilt resetten naar "Wachtend" voor ${car?.brand} ${car?.model}?`,
      async () => {
        try {
          await resetToWaiting(waitlist.id);
          showSuccess('Status gereset naar Wachtend!');
        } catch (error) {
          console.error('Error resetting status:', error);
          showError('Er is een fout opgetreden bij het resetten.');
        }
      },
      'warning'
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Wachtlijst Beheer"
          subtitle="Beheer klanten op de wachtlijst"
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Search and Filters */}
            <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Zoek op klant, auto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="vl-input !pl-12 pr-4"
                  />
                </div>
                <select
                  value={carFilter}
                  onChange={(e) => setCarFilter(e.target.value)}
                  className="border border-white/[0.1] rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-[var(--vl-bg-secondary)] text-white"
                >
                  <option value="all">Alle auto's</option>
                  {carsWithWaitlists.map(carId => {
                    const car = getCarDetails(carId);
                    return car ? (
                      <option key={carId} value={carId}>
                        {car.brand} {car.model}
                      </option>
                    ) : null;
                  })}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-white/[0.1] rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-[var(--vl-bg-secondary)] text-white"
                >
                  <option value="all">Alle statussen</option>
                  <option value="waiting">Wachtend</option>
                  <option value="notified">Genotificeerd</option>
                  <option value="converted">Geboekt</option>
                  <option value="cancelled">Geannuleerd</option>
                </select>
              </div>
            </div>

            {/* Waitlist Table */}
            {loading ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                  <span className="ml-3 text-neutral-500">Wachtlijsten laden...</span>
                </div>
              </div>
            ) : filteredWaitlists.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1]">
                <div className="p-6">
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      {waitlists.length === 0 ? 'Geen wachtlijsten' : 'Geen resultaten'}
                    </h3>
                    <p className="text-neutral-500">
                      {waitlists.length === 0
                        ? 'Klanten op de wachtlijst verschijnen hier.'
                        : 'Pas uw zoekcriteria aan om resultaten te zien.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block vl-card rounded-lg shadow-sm border border-white/[0.1] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="vl-table">
                      <thead>
                        <tr>
                          <th>Klant</th>
                          <th>Auto</th>
                          <th>Status</th>
                          <th>Aangemeld op</th>
                          <th>Genotificeerd op</th>
                          <th className="text-right">Acties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWaitlists.map(waitlist => {
                          const car = getCarDetails(waitlist.car_id);
                          return (
                            <tr key={waitlist.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-neutral-500" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-white">
                                      {waitlist.customer_snapshot?.name || 'Onbekende klant'}
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                      {waitlist.customer_snapshot?.email || 'Geen email'}
                                    </div>
                                    <div className="text-xs text-neutral-600">
                                      {waitlist.customer_snapshot?.phone || 'Geen telefoon'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <CarIcon className="w-5 h-5 text-neutral-600 mr-2" />
                                  <div className="text-sm text-white">
                                    {car ? `${car.brand} ${car.model}` : 'Onbekend'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(waitlist.status)}`}>
                                  {getStatusText(waitlist.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                {formatDate(waitlist.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                {formatDate(waitlist.notification_sent_at)}
                              </td>
                              <td>
                                <div className="flex gap-1.5 justify-end">
                                  {waitlist.status === 'waiting' && (
                                    <>
                                      <button
                                        onClick={() => handleNotifyWaitlist(waitlist.car_id)}
                                        className="vl-icon-btn vl-icon-btn-blue"
                                        data-tooltip="Notificeer hele wachtlijst"
                                      >
                                        <Send className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleOfferAlternatives(waitlist)}
                                        className="vl-icon-btn vl-icon-btn-purple"
                                        data-tooltip="Bied alternatieve auto's aan"
                                      >
                                        <CarIcon className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                  {waitlist.status === 'notified' && (
                                    <button
                                      onClick={() => handleResetToWaiting(waitlist)}
                                      className="vl-icon-btn vl-icon-btn-yellow"
                                      data-tooltip="Reset naar Wachtend"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveFromWaitlist(waitlist)}
                                    className="vl-icon-btn vl-icon-btn-red"
                                    data-tooltip="Verwijder van wachtlijst"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {filteredWaitlists.map(waitlist => {
                    const car = getCarDetails(waitlist.car_id);
                    const isExpanded = expandedWaitlistId === waitlist.id;
                    return (
                      <div key={waitlist.id} className="vl-card p-4 rounded-lg shadow-sm border border-white/[0.1]">
                        {/* Header - Always Visible */}
                        <button
                          onClick={() => setExpandedWaitlistId(isExpanded ? null : waitlist.id)}
                          className="w-full flex items-start justify-between mb-3 text-left"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-neutral-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white truncate">{waitlist.customer_snapshot?.name || 'Onbekende klant'}</p>
                              <p className="text-sm text-neutral-500 truncate">{waitlist.customer_snapshot?.email || 'Geen email'}</p>
                              <p className="text-xs text-neutral-600 truncate">{waitlist.customer_snapshot?.phone || 'Geen telefoon'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(waitlist.status)}`}>
                              {getStatusText(waitlist.status)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                        </button>

                        {/* Details - Collapsible */}
                        {isExpanded && (
                          <div className="animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center text-sm text-white">
                                <CarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{car ? `${car.brand} ${car.model}` : 'Onbekend'}</span>
                              </div>
                              <div className="flex items-center text-sm text-neutral-400">
                                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">Aangemeld: {formatDate(waitlist.created_at)}</span>
                              </div>
                              {waitlist.notification_sent_at && (
                                <div className="flex items-center text-sm text-neutral-400">
                                  <Send className="w-4 h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">Genotificeerd: {formatDate(waitlist.notification_sent_at)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-3 border-t border-white/[0.1]">
                              {waitlist.status === 'waiting' && (
                                <>
                                  <button
                                    onClick={() => handleNotifyWaitlist(waitlist.car_id)}
                                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-400 transition-colors"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Notificeer
                                  </button>
                                  <button
                                    onClick={() => handleOfferAlternatives(waitlist)}
                                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white text-xs font-medium rounded-md hover:bg-purple-400 transition-colors"
                                  >
                                    <CarIcon className="w-3.5 h-3.5" />
                                    Alternatief
                                  </button>
                                </>
                              )}
                              {waitlist.status === 'notified' && (
                                <button
                                  onClick={() => handleResetToWaiting(waitlist)}
                                  className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500 text-white text-xs font-medium rounded-md hover:bg-yellow-400 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Reset
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveFromWaitlist(waitlist)}
                                className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Verwijder
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <BottomNav />

      {/* Notify Date Modal */}
      {selectedCarForNotify && (
        <NotifyDateModal
          carId={selectedCarForNotify.id}
          carName={selectedCarForNotify.name}
          waitlistCount={selectedCarForNotify.count}
          isOpen={showNotifyModal}
          onClose={() => {
            setShowNotifyModal(false);
            setSelectedCarForNotify(null);
          }}
          onConfirm={handleConfirmNotify}
        />
      )}

      {/* Alternative Cars Modal */}
      {selectedWaitlistForAlternative && (
        <AlternativeCarsModal
          waitlistCustomerName={selectedWaitlistForAlternative.customer_snapshot.name}
          originalCarId={selectedWaitlistForAlternative.car_id}
          originalCarName={(() => {
            const car = getCarDetails(selectedWaitlistForAlternative.car_id);
            return car ? `${car.brand} ${car.model}` : 'Onbekend';
          })()}
          isOpen={showAlternativeModal}
          onClose={() => {
            setShowAlternativeModal(false);
            setSelectedWaitlistForAlternative(null);
          }}
          onConfirm={handleConfirmAlternatives}
        />
      )}
    </div>
  );
};

export default WaitlistManagement;
