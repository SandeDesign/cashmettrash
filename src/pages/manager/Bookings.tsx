import React, { useState, useEffect } from 'react';
import { Calendar, Search, Loader2, Car as CarIcon, User, ChevronDown, ChevronUp, MoreVertical, Eye, Trash2, Check, FileText, Phone, Lock, CheckCircle, XCircle, AlertTriangle, Clock, Link as LinkIcon, Copy, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import BookingDetailModal from '../../components/booking/BookingDetailModal';
import { InspectionFormModal } from '../../components/inspection';
import { useBookingStore } from '../../store/bookingStore';
import { useCarStore } from '../../store/carStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../contexts/ModalContext';
import { Booking } from '../../types';
import { createCheckoutSession } from '../../utils/stripe';
import { sendPaymentLinkEmail, sendPickupReadyEmail } from '../../utils/email';
import { useEmailTemplatesStore } from '../../store/emailTemplatesStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Bell } from 'lucide-react';

/** Returns weeks since start_date (rounded down) */
function weeksActive(startDate: string): number {
  const ms = new Date().getTime() - new Date(startDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
}

/** Returns whether a booking is eligible for cancellation */
function isCancellable(booking: Booking): { ok: boolean; reason?: string } {
  const weeks = weeksActive(booking.start_date);
  if (weeks < 4) {
    return { ok: false, reason: `< 4 weken gehuurd (${weeks} wk)` };
  }
  if (booking.lock_period && booking.lock_period_end_date) {
    if (new Date(booking.lock_period_end_date) > new Date()) {
      const m = booking.lock_period === '6_months' ? 6 : 12;
      return { ok: false, reason: `Vastzetperiode ${m} mnd actief` };
    }
  }
  return { ok: true };
}

const ManagerBookings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, loading, subscribeToBookings, cancelBooking, confirmCancellation, denyCancellation, confirmBorg, confirmDeliveryCost, approveExtension, denyExtension, updateBooking } = useBookingStore();
  const [denyModal, setDenyModal] = useState<{ booking: Booking | null; reason: string }>({ booking: null, reason: '' });
  const [borgLinkModal, setBorgLinkModal] = useState<{ booking: Booking | null; url: string | null; loading: boolean }>({ booking: null, url: null, loading: false });
  const { cars, fetchCars } = useCarStore();
  const { settings, loadSettings } = useSettingsStore();
  const { getTemplate, loadTemplates: loadEmailTemplates } = useEmailTemplatesStore();
  const { createNotification } = useNotificationStore();
  const { showConfirm, showSuccess, showError } = useModal();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [borgOpenFilter, setBorgOpenFilter] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [inspectionFormModal, setInspectionFormModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
    type: 'ophalen' | 'inleveren';
  }>({ isOpen: false, booking: null, type: 'ophalen' });
  const [selectedBookingForDetail, setSelectedBookingForDetail] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch all bookings, cars, and settings on mount
  useEffect(() => {
    const unsubscribe = subscribeToBookings();
    fetchCars();
    loadSettings();
    loadEmailTemplates();
    return () => unsubscribe();
  }, [subscribeToBookings, fetchCars, loadSettings, loadEmailTemplates]);

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    let matchesStatus = true;

    if (statusFilter !== 'all') {
      matchesStatus = booking.status === statusFilter;
    }

    const matchesBorgFilter = !borgOpenFilter ||
      (booking.borg_payment_method != null && !booking.borg_confirmed);

    const car = cars.find(c => c.id === booking.car_id);
    const matchesSearch = !searchTerm ||
      booking.customer_snapshot?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_snapshot?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car?.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesBorgFilter && matchesSearch;
  });

  const getCarDetails = (carId: string) => {
    return cars.find(c => c.id === carId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-600';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-orange-100 text-orange-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-neutral-700 text-neutral-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Concept';
      case 'pending': return 'In behandeling';
      case 'confirmed': return 'Betaald — wacht op overdracht';
      case 'active': return 'Actief';
      case 'cancelled': return 'Geannuleerd';
      case 'completed': return 'Afgerond';
      default: return status;
    }
  };

  const hasExtensionRequest = (booking: Booking) => {
    return booking.extension_requests?.some(r => r.status === 'pending') ?? false;
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBookingForDetail(booking);
    setIsDetailModalOpen(true);
  };

  const handleCancel = async (booking: Booking) => {
    await showConfirm(
      'Boeking annuleren',
      `Weet je zeker dat je de boeking van ${booking.customer_snapshot?.name || 'de klant'} wilt annuleren?`,
      async () => {
        try {
          await cancelBooking(booking.id, 'Geannuleerd door manager');
          showSuccess('Boeking geannuleerd!');
        } catch (error) {
          console.error('Error cancelling booking:', error);
          showError('Fout bij het annuleren van de boeking.');
        }
      },
      'warning'
    );
  };

  const handleAcceptExtension = async (booking: Booking) => {
    if (!user) return;

    const extension = booking.extension_requests?.find(r => r.status === 'pending');
    if (!extension) return;

    await showConfirm(
      'Verlengingsverzoek accepteren',
      `Verleng de boeking voor ${extension.type === '6_months' ? '6 maanden' : '12 maanden'}?`,
      async () => {
        try {
          await approveExtension(booking.id, extension.type, user.uid);
          showSuccess('Verlenging geaccepteerd!');
        } catch (error) {
          console.error('Error accepting extension:', error);
          showError('Fout bij het accepteren van de verlenging.');
        }
      },
      'warning'
    );
  };

  const handleConfirmCancellation = async (booking: Booking) => {
    if (!user) return;

    await showConfirm(
      'Annulering bevestigen',
      'De auto wordt dan weer beschikbaar.',
      async () => {
        try {
          await confirmCancellation(booking.id, user.uid);
          showSuccess('Annulering bevestigd!');
        } catch (error) {
          console.error('Error confirming cancellation:', error);
          showError('Fout bij het bevestigen van de annulering.');
        }
      },
      'warning'
    );
  };

  const handleConfirmBorg = async (booking: Booking) => {
    if (!user) return;
    await showConfirm(
      'Borg bevestigen',
      `Bevestig ontvangst van €${booking.borg_amount ?? 500} borg via ${booking.borg_payment_method === 'contant' ? 'contant' : booking.borg_payment_method === 'pin' ? 'pin' : 'Stripe'} van ${booking.customer_snapshot?.name || 'klant'}.`,
      async () => {
        try {
          await confirmBorg(booking.id, user.uid);
          showSuccess('Borg bevestigd!');
        } catch (error) {
          showError('Fout bij bevestigen borg.');
        }
      },
      'warning'
    );
  };

  const handleGenerateBorgLink = async (booking: Booking) => {
    setBorgLinkModal({ booking, url: null, loading: true });
    try {
      const proxyUrl = settings?.stripe_checkout_proxy_url || 'https://internedata.nl/uploads/vlottr/checkout.php';
      const borgAmount = booking.borg_amount ?? 500;
      const result = await createCheckoutSession({
        amount: borgAmount * 100,
        productName: `Waarborgsom — ${booking.customer_snapshot?.name || 'klant'}`,
        customerEmail: booking.customer_snapshot?.email || '',
        bookingId: booking.id,
        successUrl: `${window.location.origin}/payment/borg-success?booking_id=${booking.id}`,
        cancelUrl: `${window.location.origin}/bookings`,
        proxyUrl,
      });
      if (result.error || !result.url) {
        showError(result.error || 'Geen URL ontvangen van Stripe');
        setBorgLinkModal({ booking: null, url: null, loading: false });
      } else {
        setBorgLinkModal({ booking, url: result.url, loading: false });
        const emailResult = await sendPaymentLinkEmail(
          booking.customer_snapshot?.email || '',
          booking.customer_snapshot?.name || 'klant',
          result.url,
          borgAmount,
          'borg'
        );
        if (!emailResult.success) {
          console.error('[Email] Send failed:', emailResult.error);
          showError(`Link gegenereerd maar e-mail kon niet worden verzonden: ${emailResult.error || 'Onbekende fout'}. Kopieer de link handmatig.`);
        } else {
          showSuccess(`Betaallink verzonden naar ${booking.customer_snapshot?.email}`);
        }
      }
    } catch (err: any) {
      showError(err.message || 'Fout bij genereren borg link');
      setBorgLinkModal({ booking: null, url: null, loading: false });
    }
  };

  const handleConfirmDeliveryCost = async (booking: Booking) => {
    if (!user) return;
    await showConfirm(
      'Bezorgkosten bevestigen',
      `Bevestig ontvangst van €${booking.delivery_cost ?? 25} bezorgkosten via ${booking.delivery_cost_method === 'contant' ? 'contant' : booking.delivery_cost_method === 'pin' ? 'pin' : 'Stripe'}.`,
      async () => {
        try {
          await confirmDeliveryCost(booking.id, user.uid);
          showSuccess('Bezorgkosten bevestigd!');
        } catch (error) {
          showError('Fout bij bevestigen bezorgkosten.');
        }
      },
      'warning'
    );
  };

  const handleGenerateDeliveryLink = async (booking: Booking) => {
    setBorgLinkModal({ booking, url: null, loading: true });
    try {
      const proxyUrl = settings?.stripe_checkout_proxy_url || 'https://internedata.nl/uploads/vlottr/checkout.php';
      const amount = booking.delivery_cost ?? 25;
      const result = await createCheckoutSession({
        amount: amount * 100,
        productName: `Bezorgkosten — ${booking.customer_snapshot?.name || 'klant'}`,
        customerEmail: booking.customer_snapshot?.email || '',
        bookingId: booking.id,
        successUrl: `${window.location.origin}/payment/delivery-success?booking_id=${booking.id}`,
        cancelUrl: `${window.location.origin}/bookings`,
        proxyUrl,
      });
      if (result.error || !result.url) {
        showError(result.error || 'Geen URL ontvangen van Stripe');
        setBorgLinkModal({ booking: null, url: null, loading: false });
      } else {
        setBorgLinkModal({ booking, url: result.url, loading: false });
        const emailResult = await sendPaymentLinkEmail(
          booking.customer_snapshot?.email || '',
          booking.customer_snapshot?.name || 'klant',
          result.url,
          amount,
          'bezorgkosten'
        );
        if (!emailResult.success) {
          console.error('[Email] Send failed:', emailResult.error);
          showError(`Link gegenereerd maar e-mail kon niet worden verzonden: ${emailResult.error || 'Onbekende fout'}. Kopieer de link handmatig.`);
        } else {
          showSuccess(`Betaallink verzonden naar ${booking.customer_snapshot?.email}`);
        }
      }
    } catch (err: any) {
      showError(err.message || 'Fout bij genereren bezorgkosten link');
      setBorgLinkModal({ booking: null, url: null, loading: false });
    }
  };

  const handleApproveCancellationRequest = async (booking: Booking) => {
    if (!user) return;
    await showConfirm(
      'Opzegging goedkeuren',
      `Opzegging van ${booking.customer_snapshot?.name || 'klant'} goedkeuren? De boeking wordt geannuleerd en de auto beschikbaar gesteld.`,
      async () => {
        try {
          await cancelBooking(booking.id, `Opzegging goedgekeurd door manager (aangevraagd door klant)`);
          await confirmCancellation(booking.id, user.uid);
          showSuccess('Opzegging goedgekeurd, boeking geannuleerd!');
        } catch (error) {
          showError('Fout bij goedkeuren opzegging.');
        }
      },
      'warning'
    );
  };

  const handleDenyCancellationRequest = async () => {
    if (!user || !denyModal.booking) return;
    if (!denyModal.reason.trim()) {
      showError('Geef een reden op voor het afwijzen.');
      return;
    }
    try {
      await denyCancellation(denyModal.booking.id, user.uid, denyModal.reason.trim());
      showSuccess('Opzeggingsaanvraag afgewezen.');
      setDenyModal({ booking: null, reason: '' });
    } catch (error) {
      showError('Fout bij afwijzen opzegging.');
    }
  };

  const getAvailableActions = (booking: Booking) => {
    const actions = [
      { label: 'Boeking bekijken', action: 'view', icon: Eye },
    ];

    // Confirmed: needs borg confirm + pickup inspection form
    if (booking.status === 'confirmed') {
      if (!booking.borg_confirmed && booking.borg_payment_method) {
        if (booking.borg_payment_method === 'stripe') {
          actions.push({ label: 'Stuur borg betaallink', action: 'send_borg_link', icon: LinkIcon });
        } else {
          actions.push({ label: 'Borg bevestigen', action: 'confirm_borg', icon: CheckCircle });
        }
      }
      if (booking.delivery_cost && !booking.delivery_cost_confirmed) {
        if (booking.delivery_cost_method === 'stripe') {
          actions.push({ label: 'Stuur bezorgkosten link', action: 'send_delivery_link', icon: LinkIcon });
        } else {
          actions.push({ label: 'Bezorgkosten bevestigen', action: 'confirm_delivery_cost', icon: CheckCircle });
        }
      }
      if (!booking.pickup_inspection_form_id) {
        actions.push({ label: 'Ophaal Inspectie', action: 'pickup_form', icon: FileText });
      }
      // Notify customer car is ready (only when borg confirmed and email not yet sent)
      if (booking.borg_confirmed && !(booking as any).pickup_ready_email_sent_at) {
        actions.push({ label: 'Klaar om op te halen', action: 'send_pickup_ready', icon: Bell });
      }
    }

    // Inspection forms
    if (booking.status === 'pending' && !booking.pickup_inspection_form_id) {
      actions.push({ label: 'Ophaal Inspectie', action: 'pickup_form', icon: FileText });
    }

    if (booking.status === 'active' && !booking.return_inspection_form_id) {
      actions.push({ label: 'Inlever Inspectie', action: 'return_form', icon: FileText });
    }

    if (booking.status === 'active' || booking.status === 'pending' || booking.status === 'confirmed') {
      actions.push({ label: 'Annuleren', action: 'cancel', icon: Trash2 });
    }

    if (hasExtensionRequest(booking)) {
      actions.push({ label: 'Verlenging accepteren', action: 'accept_extension', icon: Check });
    }

    if (booking.status === 'cancelled' && !booking.cancellation_confirmed) {
      actions.push({ label: 'Bevestig annulering', action: 'confirm_cancellation', icon: Check });
    }

    if ((booking as any).cancellation_requested) {
      actions.push({ label: 'Annulering goedkeuren', action: 'approve_cancellation_request', icon: CheckCircle });
      actions.push({ label: 'Annulering afwijzen', action: 'deny_cancellation_request', icon: XCircle });
    }

    return actions;
  };

  const handleAction = async (action: string, booking: Booking) => {
    switch (action) {
      case 'view':
        handleViewDetails(booking);
        break;
      case 'cancel':
        handleCancel(booking);
        break;
      case 'accept_extension':
        handleAcceptExtension(booking);
        break;
      case 'confirm_cancellation':
        handleConfirmCancellation(booking);
        break;
      case 'confirm_borg':
        handleConfirmBorg(booking);
        break;
      case 'send_borg_link':
        handleGenerateBorgLink(booking);
        break;
      case 'confirm_delivery_cost':
        handleConfirmDeliveryCost(booking);
        break;
      case 'send_delivery_link':
        handleGenerateDeliveryLink(booking);
        break;
      case 'approve_cancellation_request':
        handleApproveCancellationRequest(booking);
        break;
      case 'deny_cancellation_request':
        setDenyModal({ booking, reason: '' });
        break;
      case 'pickup_form':
        setInspectionFormModal({
          isOpen: true,
          booking,
          type: 'ophalen',
        });
        break;
      case 'return_form':
        setInspectionFormModal({
          isOpen: true,
          booking,
          type: 'inleveren',
        });
        break;
      case 'send_pickup_ready': {
        const template = getTemplate('ophalen');
        if (!template) {
          showError('Sjabloon niet gevonden. Ga naar Instellingen → Sjablonen om het ophaal sjabloon in te stellen.');
          break;
        }
        const email = booking.customer_snapshot?.email || (booking as any).customer_email;
        const name = booking.customer_snapshot?.name || (booking as any).customer_name || 'Klant';
        const car = cars.find((c) => c.id === booking.car_id);
        const carName = car ? `${car.brand} ${car.model}` : 'uw auto';
        const location = booking.pickup_location_name || booking.delivery_address || '—';
        const date = booking.start_date
          ? new Date(booking.start_date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
          : '—';
        if (!email) {
          showError('Geen e-mailadres gevonden voor deze klant.');
          break;
        }
        try {
          const result = await sendPickupReadyEmail(email, name, carName, location, date, template.subject, template.body_html);
          if (result.success) {
            await updateBooking(booking.id, { pickup_ready_email_sent_at: new Date().toISOString() } as any);
            // Create in-app notification for the customer
            await createNotification({
              user_id: booking.customer_id,
              type: 'pickup_scheduled',
              title: 'Uw auto staat klaar om op te halen!',
              message: `Uw ${carName} is klaar voor ophaling op ${date}${location !== '—' ? ` bij ${location}` : ''}.`,
              link: '/bookings',
              read: false,
              data: { booking_id: booking.id, car_name: carName, pickup_date: date, pickup_location: location },
            });
            showSuccess(`E-mail verstuurd naar ${email}`);
          } else {
            showError(`Verzenden mislukt: ${result.error}`);
          }
        } catch (err: any) {
          showError(err.message || 'Verzenden mislukt');
        }
        break;
      }
    }
    setOpenDropdown(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Boekingen" />

        <main data-tour="bookings-page" className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Search and Filters */}
            <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Zoek op klant, auto, boekingsnummer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="vl-input !pl-12 pr-4"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black/20 border border-white/[0.1] rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="all">Alle statussen</option>
                  <option value="pending">In behandeling</option>
                  <option value="confirmed">Betaald — wacht op overdracht</option>
                  <option value="active">Actief</option>
                  <option value="completed">Afgerond</option>
                  <option value="cancelled">Geannuleerd</option>
                </select>
                <button
                  onClick={() => setBorgOpenFilter(v => !v)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors whitespace-nowrap ${
                    borgOpenFilter
                      ? 'bg-red-600/30 border-red-500/60 text-red-300'
                      : 'bg-black/20 border-white/[0.1] text-neutral-400 hover:text-white'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Borg open
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            {loading && bookings.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                  <span className="ml-3 text-neutral-500">Boekingen laden...</span>
                </div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1]">
                <div className="p-6">
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      {bookings.length === 0 ? 'Nog geen boekingen' : 'Geen boekingen gevonden'}
                    </h3>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block vl-card rounded-lg shadow-sm border border-white/[0.1]">
                  <div>
                    <table className="vl-table">
                      <thead>
                        <tr>
                          <th>Klant</th>
                          <th>Auto</th>
                          <th>Huurinfo</th>
                          <th>Status</th>
                          <th>Betaling</th>
                          <th className="text-right">Acties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map(booking => {
                          const car = getCarDetails(booking.car_id);
                          const actions = getAvailableActions(booking);
                          const weeks = weeksActive(booking.start_date);
                          const { ok: cancellable, reason: cancelReason } = isCancellable(booking);
                          const hasActiveLock = booking.lock_period && booking.lock_period_end_date && new Date(booking.lock_period_end_date) > new Date();
                          const cancellationRequested = (booking as any).cancellation_requested;

                          return (
                            <tr key={booking.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-neutral-500" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-white">
                                      {booking.customer_snapshot?.name || booking.customer_name || 'Onbekende klant'}
                                    </div>
                                    <div className="text-sm text-neutral-500">
                                      {booking.customer_snapshot?.email || booking.customer_email || 'Geen email'}
                                    </div>
                                    {booking.customer_snapshot?.phone && (
                                      <div className="text-xs text-neutral-600 flex items-center gap-1 mt-0.5">
                                        <Phone className="w-3 h-3" />
                                        {booking.customer_snapshot.phone}
                                      </div>
                                    )}
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
                              <td className="px-6 py-4">
                                <div className="text-sm text-neutral-300">{formatDate(booking.start_date)}</div>
                                <div className="text-xs text-neutral-500">{weeks} weken actief</div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {booking.plan_type && (
                                    <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${booking.plan_type === 'long' ? 'bg-purple-900/40 text-purple-300' : 'bg-neutral-700 text-neutral-300'}`}>
                                      {booking.plan_type === 'long' ? 'Long' : 'Basic'}
                                    </span>
                                  )}
                                  {hasActiveLock && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-blue-900/40 text-blue-300">
                                      <Lock className="w-2.5 h-2.5" />
                                      {booking.lock_period === '6_months' ? '6 mnd' : '12 mnd'}
                                    </span>
                                  )}
                                  {booking.status === 'active' && (
                                    cancellable
                                      ? <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-green-900/40 text-green-300"><CheckCircle className="w-2.5 h-2.5" />Kan opzeggen</span>
                                      : <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-red-900/40 text-red-300" title={cancelReason}><AlertTriangle className="w-2.5 h-2.5" />Geblokkeerd</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                    {getStatusText(booking.status)}
                                  </span>
                                  {booking.status === 'confirmed' && (
                                    <div className="text-xs text-neutral-400 space-y-0.5 mt-0.5">
                                      {booking.pickup_type && (
                                        <div>{booking.pickup_type === 'ophalen' ? `Ophalen: ${booking.pickup_location_name || '—'}` : `Bezorgen: ${booking.delivery_address || '—'}`}</div>
                                      )}
                                      {booking.borg_payment_method && (
                                        <div className={`flex items-center gap-1 ${booking.borg_confirmed ? 'text-green-400' : 'text-orange-400'}`}>
                                          {booking.borg_confirmed ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                          Borg {booking.borg_payment_method === 'contant' ? 'contant' : booking.borg_payment_method === 'pin' ? 'pin' : 'Stripe'}
                                          {booking.borg_confirmed ? ' ✓' : ' — nog te ontvangen'}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {cancellationRequested && (
                                    <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-orange-900/40 text-orange-300 border border-orange-500/30">
                                      <Clock className="w-3 h-3" />
                                      Opzegging aangevraagd
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                  booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {booking.payment_status === 'paid' ? 'Betaald' :
                                   booking.payment_status === 'pending' ? 'In afwachting' :
                                   'Mislukt'}
                                </span>
                              </td>
                              <td>
                                <div className="relative inline-block">
                                  <button
                                    onClick={() => setOpenDropdown(openDropdown === booking.id ? null : booking.id)}
                                    className="vl-icon-btn"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openDropdown === booking.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-neutral-800 border border-white/[0.1] rounded-lg shadow-lg z-50">
                                      {actions.map((action) => (
                                        <button
                                          key={action.action}
                                          onClick={() => handleAction(action.action, booking)}
                                          className="w-full text-left px-4 py-2 hover:bg-white/[0.05] text-sm text-white flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                                        >
                                          <action.icon className="w-4 h-4" />
                                          {action.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View - Collapsible */}
                <div className="lg:hidden space-y-3">
                  {filteredBookings.map(booking => {
                    const car = getCarDetails(booking.car_id);
                    const isExpanded = expandedBookingId === booking.id;
                    const actions = getAvailableActions(booking);
                    const weeks = weeksActive(booking.start_date);
                    const { ok: cancellable } = isCancellable(booking);
                    const hasActiveLock = booking.lock_period && booking.lock_period_end_date && new Date(booking.lock_period_end_date) > new Date();
                    const cancellationRequested = (booking as any).cancellation_requested;

                    return (
                      <div key={booking.id} className="vl-card rounded-lg shadow-sm border border-white/[0.1] overflow-hidden">
                        {/* Header - Always Visible */}
                        <button
                          onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-neutral-500" />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="font-semibold text-white truncate text-sm">{booking.customer_snapshot?.name || booking.customer_name || 'Onbekende klant'}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(booking.status)}`}>
                                  {getStatusText(booking.status)}
                                </span>
                                {cancellationRequested && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full bg-orange-900/40 text-orange-300 border border-orange-500/30">
                                    <Clock className="w-3 h-3" />
                                    Opzegging aangevraagd
                                  </span>
                                )}
                              </div>
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
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-neutral-400">
                                <CarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{car ? `${car.brand} ${car.model}` : 'Onbekend'}</span>
                              </div>
                              <div className="flex items-center text-sm text-neutral-400">
                                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span>{formatDate(booking.start_date)} · {weeks} wk actief</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {booking.plan_type && (
                                  <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${booking.plan_type === 'long' ? 'bg-purple-900/40 text-purple-300' : 'bg-neutral-700 text-neutral-300'}`}>
                                    {booking.plan_type === 'long' ? 'Long' : 'Basic'}
                                  </span>
                                )}
                                {hasActiveLock && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-blue-900/40 text-blue-300">
                                    <Lock className="w-2.5 h-2.5" />
                                    {booking.lock_period === '6_months' ? '6 mnd' : '12 mnd'}
                                  </span>
                                )}
                                {booking.status === 'active' && (
                                  cancellable
                                    ? <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-green-900/40 text-green-300"><CheckCircle className="w-2.5 h-2.5" />Kan opzeggen</span>
                                    : <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-red-900/40 text-red-300"><AlertTriangle className="w-2.5 h-2.5" />Geblokkeerd</span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-white">€{booking.weekly_rate.toFixed(2)}/wk</span>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                  booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                  booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {booking.payment_status === 'paid' ? 'Betaald' :
                                   booking.payment_status === 'pending' ? 'Wacht' :
                                   'Mislukt'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                              {actions.map((action) => (
                                <button
                                  key={action.action}
                                  onClick={() => handleAction(action.action, booking)}
                                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                                    action.action === 'approve_cancellation_request'
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : action.action === 'deny_cancellation_request'
                                      ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  <action.icon className="w-3.5 h-3.5" />
                                  {action.label}
                                </button>
                              ))}
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

      {/* Inspection Form Modal */}
      {inspectionFormModal.booking && (
        <InspectionFormModal
          booking={inspectionFormModal.booking}
          isOpen={inspectionFormModal.isOpen}
          onClose={() => {
            setInspectionFormModal({ isOpen: false, booking: null, type: 'ophalen' });
          }}
          inspectionType={inspectionFormModal.type}
          isReviewMode={true}
        />
      )}

      {/* Booking Detail Modal */}
      {selectedBookingForDetail && (
        <BookingDetailModal
          booking={selectedBookingForDetail}
          car={cars.find(c => c.id === selectedBookingForDetail.car_id) ?? null}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}

      {/* Borg Stripe Payment Link Modal */}
      {borgLinkModal.booking && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="vl-card rounded-lg border border-white/[0.1] p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Borg betaallink</h3>
            {borgLinkModal.loading ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-5 h-5 animate-spin text-green-400" />
                <p className="text-neutral-400 text-sm">Link genereren via Stripe...</p>
              </div>
            ) : borgLinkModal.url ? (
              <>
                <p className="text-sm text-neutral-400 mb-4">
                  Stuur deze link naar <span className="text-white">{borgLinkModal.booking.customer_snapshot?.name}</span> om de borgsom van <span className="text-white">€{borgLinkModal.booking.borg_amount ?? 500}</span> te betalen.
                </p>
                <div className="flex gap-2 mb-4">
                  <input
                    readOnly
                    value={borgLinkModal.url}
                    className="vl-input flex-1 text-xs font-mono"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(borgLinkModal.url!); showSuccess('Link gekopieerd!'); }}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : null}
            <div className="flex justify-end">
              <button
                onClick={() => setBorgLinkModal({ booking: null, url: null, loading: false })}
                className="px-4 py-2 border border-white/10 text-neutral-300 rounded-md hover:text-white transition-colors text-sm"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Cancellation Modal */}
      {denyModal.booking && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="vl-card rounded-lg border border-white/[0.1] p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-2">Opzegging afwijzen</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Geef een reden op waarom de opzeggingsaanvraag van <span className="text-white">{denyModal.booking.customer_snapshot?.name}</span> wordt afgewezen.
            </p>
            <textarea
              value={denyModal.reason}
              onChange={e => setDenyModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Bijv. Vastzetperiode is nog actief, of klant heeft een lopend contract..."
              className="vl-textarea w-full mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={handleDenyCancellationRequest}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Afwijzen
              </button>
              <button
                onClick={() => setDenyModal({ booking: null, reason: '' })}
                className="px-4 py-2 border border-white/10 text-neutral-300 rounded-md hover:text-white transition-colors text-sm"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerBookings;
