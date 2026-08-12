import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Car as CarIcon, Phone, Loader2, CheckCircle, XCircle, DollarSign, ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import BookingDetailModal from '../../components/booking/BookingDetailModal';
import LockPeriodModal from '../../components/booking/LockPeriodModal';
import { useBookingStore } from '../../store/bookingStore';
import { useCarStore } from '../../store/carStore';
import { useEmailTemplatesStore } from '../../store/emailTemplatesStore';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { Booking } from '../../types';

/** Returns whether a customer can request cancellation and why not if blocked */
function getCancellationEligibility(booking: Booking): { canCancel: boolean; reason?: string } {
  const startDate = new Date(booking.start_date);
  const now = new Date();
  const weeksDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7);

  if (weeksDiff < 4) {
    const weeksLeft = Math.ceil(4 - weeksDiff);
    return {
      canCancel: false,
      reason: `U kunt pas opzeggen na 4 weken huur. Nog ${weeksLeft} week${weeksLeft > 1 ? 'en' : ''} te gaan.`
    };
  }

  if (booking.lock_period && booking.lock_period_end_date) {
    const lockEnd = new Date(booking.lock_period_end_date);
    if (lockEnd > now) {
      const months = booking.lock_period === '6_months' ? 6 : 12;
      return {
        canCancel: false,
        reason: `U heeft een actieve vastzetperiode van ${months} maanden t/m ${lockEnd.toLocaleDateString('nl-NL')}.`
      };
    }
  }

  return { canCancel: true };
}

const CustomerBookings: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { bookings, loading, subscribeToBookings, requestCancellation } = useBookingStore();
  const { cars, fetchCars } = useCarStore();
  const { loadTemplates } = useEmailTemplatesStore();
  const { showSuccess, showError } = useModal();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [lockPeriodModal, setLockPeriodModal] = useState<{ booking: Booking; period: '6_months' | '12_months' } | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');
  const [showCancellationForm, setShowCancellationForm] = useState<string | null>(null); // bookingId
  const [requestingExtensionId, setRequestingExtensionId] = useState<string | null>(null);

  // Check for success message from payment
  useEffect(() => {
    const success = searchParams.get('success');
    const testMode = searchParams.get('test_mode');

    if (success === 'true') {
      setShowSuccessMessage(true);
      setIsTestMode(testMode === 'true');

      setTimeout(() => {
        setSearchParams({});
      }, 100);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToBookings({ customer_id: user.uid });
      fetchCars({ published: true });
      loadTemplates();
      return () => unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const activeBookings = bookings.filter(b =>
    b.status === 'pending' || b.status === 'confirmed' || b.status === 'active'
  );

  const historyBookings = bookings.filter(b =>
    b.status === 'cancelled' || b.status === 'completed'
  );

  const displayedBookings = activeTab === 'active' ? activeBookings : historyBookings;

  const getCarDetails = (carId: string) => {
    return cars.find(c => c.id === carId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-orange-100 text-orange-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-neutral-700 text-neutral-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Concept';
      case 'pending': return 'In afwachting';
      case 'confirmed': return 'Betaald — wacht op overdracht';
      case 'active': return 'Actief';
      case 'cancelled': return 'Geannuleerd';
      case 'completed': return 'Afgerond';
      default: return status;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <DollarSign className="w-4 h-4 text-neutral-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleSubmitCancellationRequest = async (booking: Booking) => {
    const reason = cancellationReasonInput.trim() || 'Wekelijks opzegging';
    try {
      await requestCancellation(booking.id, reason);
      showSuccess('Opzeggingsaanvraag ingediend. Een beheerder zal uw aanvraag beoordelen.');
      setShowCancellationForm(null);
      setCancellationReasonInput('');
    } catch (error: any) {
      showError(error.message || 'Er is een fout opgetreden bij het indienen van de aanvraag');
    }
  };

  const handleRequestExtension = (booking: Booking, period: '6_months' | '12_months') => {
    setLockPeriodModal({ booking, period });
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Mijn Boekingen" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div data-tour="bookings-page" className="max-w-7xl mx-auto">
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                Betaling succesvol! Uw boeking is geactiveerd.
                {isTestMode && <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">TEST MODE</span>}
              </div>
            )}

            {/* Tabs */}
            <div data-tour="bookings-tabs" className="flex gap-2 mb-6 border-b border-white/[0.1]">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'active'
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-neutral-500 hover:text-white'
                }`}
              >
                Actieve Boekingen ({activeBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'history'
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-neutral-500 hover:text-white'
                }`}
              >
                Geschiedenis ({historyBookings.length})
              </button>
            </div>

            {/* Loading State */}
            {loading && bookings.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                  <span className="ml-3 text-neutral-500">Boekingen laden...</span>
                </div>
              </div>
            ) : displayedBookings.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1]">
                <div className="p-6">
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      {activeTab === 'active' ? 'Geen actieve boekingen' : 'Geen boekingen in geschiedenis'}
                    </h3>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedBookings.map(booking => {
                  const car = getCarDetails(booking.car_id);
                  const isExpanded = expandedBookingId === booking.id;
                  const hasActiveLockPeriod = booking.lock_period && new Date(booking.lock_period_end_date || '') > new Date();
                  const { canCancel, reason: cancelBlockReason } = getCancellationEligibility(booking);
                  const cancellationRequested = (booking as any).cancellation_requested;
                  const cancellationDenialReason = (booking as any).cancellation_denial_reason;
                  const isCancellationFormOpen = showCancellationForm === booking.id;

                  return (
                    <div key={booking.id} className="vl-card rounded-lg shadow-sm border border-white/[0.1] overflow-hidden">
                      {/* Header - Always Visible */}
                      <button
                        onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-white">
                              {car ? `${car.brand} ${car.model}` : 'Auto onbekend'}
                            </h3>
                            <div className="flex items-center gap-2">
                              {cancellationRequested && (
                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-900/40 text-orange-300 border border-orange-500/30 whitespace-nowrap">
                                  Opzegging in behandeling
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap ${getStatusColor(booking.status)}`}>
                                {getStatusText(booking.status)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Calendar className="w-4 h-4 text-neutral-500" />
                            <span className="text-sm text-neutral-400">
                              Sinds {formatDate(booking.start_date)}
                            </span>
                            {hasActiveLockPeriod && (
                              <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded">
                                Vastgezet: {booking.lock_period === '6_months' ? '6 mnd' : '12 mnd'}
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-green-400 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0 ml-2" />
                        )}
                      </button>

                      {/* Details - Collapsible */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05] pt-3">
                          {/* Denial notice */}
                          {cancellationDenialReason && !cancellationRequested && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-sm">
                              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-red-400">Opzeggingsaanvraag afgewezen</p>
                                <p className="text-neutral-300 mt-0.5">Reden: {cancellationDenialReason}</p>
                              </div>
                            </div>
                          )}

                          {/* Confirmed booking info block */}
                          {booking.status === 'confirmed' && (
                            <div className="rounded-lg border border-orange-500/30 bg-orange-900/10 p-3 space-y-2">
                              <p className="text-sm font-semibold text-orange-300 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Betaling ontvangen — wacht op sleuteloverdracht
                              </p>
                              <p className="text-xs text-neutral-400">
                                Een manager neemt contact op om de overdracht in te plannen.
                              </p>
                              {booking.pickup_type && (
                                <div className="text-xs text-neutral-300 space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-neutral-500">Ophaalwijze</span>
                                    <span>{booking.pickup_type === 'ophalen' ? `Ophalen bij ${booking.pickup_location_name || booking.pickup_location_id}` : `Bezorgen op ${booking.delivery_address}`}</span>
                                  </div>
                                  {booking.borg_payment_method && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Borg betaalmethode</span>
                                        <span className="capitalize">
                                          {booking.borg_payment_method === 'contant' ? 'Contant' : booking.borg_payment_method === 'pin' ? 'Pin' : 'Online (Stripe)'}
                                          {booking.borg_confirmed ? ' ✓ Bevestigd' : ' — wacht op bevestiging'}
                                        </span>
                                      </div>
                                      {booking.borg_payment_method === 'stripe' && !booking.borg_confirmed && (
                                        <p className="text-xs text-blue-400 mt-1">
                                          Je ontvangt een betaallink voor de borgsom van de beheerder.
                                        </p>
                                      )}
                                    </>
                                  )}
                                  {booking.delivery_cost != null && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Bezorgkosten</span>
                                        <span>
                                          €{booking.delivery_cost}
                                          {booking.delivery_cost_confirmed ? ' ✓ Betaald' : ' — nog te betalen'}
                                        </span>
                                      </div>
                                      {booking.delivery_cost_method === 'stripe' && !booking.delivery_cost_confirmed && (
                                        <p className="text-xs text-blue-400 mt-1">
                                          Je ontvangt een betaallink voor de bezorgkosten van de beheerder.
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Price & Payment */}
                          <div className="bg-white/[0.03] rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-400">Wekelijks tarief</span>
                              <span className="font-semibold text-white">€{booking.weekly_rate.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-neutral-400">Betaalstatus</span>
                              <div className="flex items-center gap-2">
                                {getPaymentStatusIcon(booking.payment_status)}
                                <span className="text-sm text-white capitalize">{booking.payment_status}</span>
                              </div>
                            </div>
                          </div>

                          {/* Borg info voor active boekingen */}
                          {booking.status === 'active' && booking.borg_payment_method && (
                            <div className="bg-white/[0.03] rounded-lg p-3 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-neutral-500">Borgsom</span>
                                <span className="capitalize">
                                  {booking.borg_payment_method === 'contant' ? 'Contant' : booking.borg_payment_method === 'pin' ? 'Pin' : 'Online (Stripe)'}
                                  {booking.borg_confirmed ? ' ✓ Bevestigd' : ' — niet bevestigd'}
                                </span>
                              </div>
                              {booking.borg_amount && (
                                <div className="flex justify-between">
                                  <span className="text-neutral-500">Bedrag</span>
                                  <span>€{booking.borg_amount}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="space-y-2">
                            <button
                              onClick={() => handleViewDetails(booking)}
                              className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Details bekijken
                            </button>

                            {booking.status === 'active' && (
                              <>
                                {!hasActiveLockPeriod && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-neutral-400">Verhuur vastzetzen:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => handleRequestExtension(booking, '6_months')}
                                        disabled={requestingExtensionId === booking.id}
                                        className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                                      >
                                        6 Maanden
                                      </button>
                                      <button
                                        onClick={() => handleRequestExtension(booking, '12_months')}
                                        disabled={requestingExtensionId === booking.id}
                                        className="px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                                      >
                                        12 Maanden
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Cancellation section */}
                                {cancellationRequested ? (
                                  <div className="flex items-center gap-2 p-3 rounded-md bg-orange-900/20 border border-orange-500/30 text-sm text-orange-300">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    <span>Opzeggingsaanvraag is ingediend en wordt beoordeeld door een beheerder.</span>
                                  </div>
                                ) : isCancellationFormOpen ? (
                                  <div className="space-y-2 p-3 rounded-md border border-red-500/30 bg-red-900/10">
                                    <p className="text-sm text-neutral-300 font-medium">Opzegging aanvragen</p>
                                    <textarea
                                      value={cancellationReasonInput}
                                      onChange={e => setCancellationReasonInput(e.target.value)}
                                      placeholder="Optioneel: geef een reden voor uw opzegging..."
                                      className="vl-textarea w-full text-sm"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSubmitCancellationRequest(booking)}
                                        className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                                      >
                                        Aanvraag indienen
                                      </button>
                                      <button
                                        onClick={() => { setShowCancellationForm(null); setCancellationReasonInput(''); }}
                                        className="px-3 py-2 border border-white/10 text-neutral-300 text-sm rounded-md hover:text-white transition-colors"
                                      >
                                        Annuleren
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <button
                                      onClick={() => canCancel ? setShowCancellationForm(booking.id) : undefined}
                                      disabled={!canCancel}
                                      title={!canCancel ? cancelBlockReason : undefined}
                                      className={`w-full px-3 py-2 text-sm font-medium rounded-md border transition-colors flex items-center justify-center gap-2 ${
                                        canCancel
                                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-500/30 cursor-pointer'
                                          : 'bg-white/[0.03] text-neutral-500 border-white/[0.08] cursor-not-allowed'
                                      }`}
                                    >
                                      {!canCancel && <AlertTriangle className="w-4 h-4" />}
                                      Opzegging aanvragen
                                    </button>
                                    {!canCancel && cancelBlockReason && (
                                      <p className="text-xs text-neutral-500 flex items-start gap-1">
                                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                        {cancelBlockReason}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          car={cars.find(c => c.id === selectedBooking.car_id) ?? null}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}

      {/* Lock Period Contract Modal */}
      {lockPeriodModal && user && (
        <LockPeriodModal
          isOpen={true}
          onClose={() => setLockPeriodModal(null)}
          booking={lockPeriodModal.booking}
          car={cars.find(c => c.id === lockPeriodModal.booking.car_id)}
          extensionType={lockPeriodModal.period}
          customerEmail={user.email}
          customerName={user.name}
        />
      )}
    </div>
  );
};

export default CustomerBookings;
