import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Euro, AlertCircle, Loader2, CheckCircle, Bell, MapPin, Truck, CreditCard, Banknote, Smartphone, ChevronLeft } from 'lucide-react';
import { Car, Booking } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useSettingsStore } from '../../store/settingsStore';
import { useContractStore } from '../../store/contractStore';
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { createSubscriptionCheckout } from '../../utils/stripe';
import { generateContractHTML } from '../../utils/pdf';
import WaitlistModal from '../car/WaitlistModal';

interface BookingModalProps {
  car: Car;
  onClose: () => void;
  onSuccess?: () => void;
  initialStartDate?: string;
}

type PlanId = 'basic' | 'half_year' | 'year';
type PayMethod = 'contant' | 'pin' | 'stripe';

const PLANS = [
  {
    id: 'basic' as PlanId,
    label: 'Basis',
    sublabel: 'Flexibel huren',
    rate: 140,
    perDay: 20,
    minWeeks: 4,
    minLabel: 'Min. 4 weken',
    hasBorg: true,
    badge: null,
    badgeColor: '',
    color: 'border-white/20',
    activeColor: 'border-green-500 bg-green-500/10',
    rateColor: 'text-white',
  },
  {
    id: 'half_year' as PlanId,
    label: 'Half jaar',
    sublabel: '6 maanden vastgezet',
    rate: 105,
    perDay: 15,
    minWeeks: 26,
    minLabel: 'Min. 6 maanden',
    hasBorg: false,
    badge: 'Populair',
    badgeColor: 'bg-blue-500 text-white',
    color: 'border-white/20',
    activeColor: 'border-blue-500 bg-blue-500/10',
    rateColor: 'text-blue-300',
  },
  {
    id: 'year' as PlanId,
    label: 'Jaar',
    sublabel: '12 maanden vastgezet',
    rate: 85,
    perDay: 12,
    minWeeks: 52,
    minLabel: 'Min. 12 maanden',
    hasBorg: false,
    badge: 'Goedkoopst',
    badgeColor: 'bg-green-500 text-black',
    color: 'border-white/20',
    activeColor: 'border-green-500 bg-green-500/10',
    rateColor: 'text-green-400',
  },
] as const;

const DELIVERY_COST = 25;

const BookingModal: React.FC<BookingModalProps> = ({ car, onClose, onSuccess, initialStartDate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, loadSettings } = useSettingsStore();
  const { createContract } = useContractStore();

  // Step 1 = plan selection, Step 2 = details
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  // Step 2 state
  const [startDate, setStartDate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  const [pickupType, setPickupType] = useState<'ophalen' | 'bezorgen'>('ophalen');
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCostMethod, setDeliveryCostMethod] = useState<PayMethod>('contant');
  const [borgMethod, setBorgMethod] = useState<PayMethod>('contant');

  const plan = PLANS.find(p => p.id === selectedPlan);

  useEffect(() => {
    loadSettings();
    loadBookedDates();
  }, [loadSettings, car.id]);

  useEffect(() => {
    if (initialStartDate) {
      setStartDate(initialStartDate);
    } else {
      setStartDate(getNextMonday().toISOString().split('T')[0]);
    }
  }, [initialStartDate]);

  const getNextMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + daysUntilMonday);
    return next;
  };

  const loadBookedDates = async () => {
    try {
      setLoadingDates(true);
      const q = query(
        collection(db, 'bookings'),
        where('car_id', '==', car.id),
        where('status', 'in', ['pending', 'confirmed', 'active'])
      );
      const snapshot = await getDocs(q);
      const dates: string[] = [];
      snapshot.docs.forEach(doc => {
        const booking = doc.data() as Booking;
        const start = new Date(booking.start_date);
        const end = booking.end_date ? new Date(booking.end_date) : new Date(start);
        let current = new Date(start);
        while (current <= end) {
          dates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 7);
        }
      });
      setBookedDates(dates);
    } catch (error) {
      console.error('Error loading booked dates:', error);
    } finally {
      setLoadingDates(false);
    }
  };

  const isMonday = (dateString: string) => new Date(dateString).getDay() === 1;
  const isDateBooked = (dateString: string) => bookedDates.includes(dateString);

  const handleSelectPlan = (planId: PlanId) => {
    setSelectedPlan(planId);
    setStep(2);
    setError('');
  };

  const handleBooking = async () => {
    if (!user || !settings || !plan) return;

    if (user.verification_status !== 'approved') {
      setError('Uw account moet eerst worden goedgekeurd voordat u kunt boeken.');
      return;
    }
    if (!startDate || !isMonday(startDate)) {
      setError('Selecteer een maandag als startdatum.');
      return;
    }
    if (isDateBooked(startDate)) {
      setError('Deze week is al bezet. Kies een andere startdatum.');
      return;
    }
    if (pickupType === 'ophalen' && !pickupLocationId) {
      setError('Selecteer een ophaallocatie.');
      return;
    }
    if (pickupType === 'bezorgen' && !deliveryAddress.trim()) {
      setError('Voer het bezorgadres in.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const activeLocations = settings.locations ?? [];
      const chosenLocation = activeLocations.find(l => l.id === pickupLocationId);
      const hasBorg = plan.hasBorg;
      const hasDelivery = pickupType === 'bezorgen';

      const bookingData: Omit<Booking, 'id'> = {
        car_id: car.id,
        customer_id: user.uid,
        start_date: startDate,
        end_date: '',
        plan_type: plan.id,
        weeks_rented: 0,
        weekly_rate: plan.rate,
        total_price: plan.rate,
        status: 'draft',
        payment_status: 'pending',
        is_subscription: true,
        subscription_status: 'pending',
        customer_snapshot: {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        pickup_type: pickupType,
        ...(pickupType === 'ophalen' && {
          pickup_location_id: pickupLocationId,
          pickup_location_name: chosenLocation?.name || pickupLocationId,
        }),
        ...(hasDelivery && { delivery_address: deliveryAddress.trim() }),
        // Bezorgkosten
        ...(hasDelivery && {
          delivery_cost: DELIVERY_COST,
          delivery_cost_method: deliveryCostMethod,
          delivery_cost_confirmed: false,
        }),
        // Borg alleen bij basis plan
        ...(hasBorg && {
          borg_amount: settings.borg_amount ?? 500,
          borg_payment_method: borgMethod,
          borg_payment_method_set_at: new Date().toISOString(),
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

      const carInfo = `${car.brand} ${car.model} (${car.year})`;
      const contractTemplate = settings.contract_template || '';
      const adminSignatureUrl = settings.admin_signature_url || '';

      const incassoDag = startDate
        ? new Date(startDate).toLocaleDateString('nl-NL', { weekday: 'long' })
        : 'maandag';

      const contractVariables = {
        contract_id: bookingRef.id,
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone,
        customer_address: user.address || '',
        customer_birth_date: user.date_of_birth || '',
        customer_license_number: user.driver_license?.number || '',
        customer_license_category: user.driver_license?.category || 'B',
        customer_license_expiry: user.driver_license?.expiry_date || '',
        customer_license_issue_date: user.driver_license?.issue_date || '',
        incasso_dag: incassoDag,
        car_info: carInfo,
        license_plate: car.license_plate,
        start_date: startDate,
        end_date: 'Open contract (einddatum bij inlevering)',
        weeks_rented: 'Onbepaalde tijd',
        weekly_rate: plan.rate.toString(),
        total_price: `${plan.rate} per week`,
        current_date: new Date().toLocaleDateString('nl-NL', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        inspectie_ophalen_datum: '',
        inspectie_ophalen_status: 'Nog niet gedaan',
        inspectie_inleveren_datum: '',
        inspectie_inleveren_status: 'Nog niet gedaan',
        km_ophalen: '',
        km_inleveren: '',
      };

      const contractHtml = generateContractHTML(contractTemplate, contractVariables);

      await createContract({
        booking_id: bookingRef.id,
        customer_id: user.uid,
        customer_name: user.name,
        customer_email: user.email,
        customer_phone: user.phone || '',
        customer_address: user.address || '',
        customer_birth_date: user.date_of_birth || '',
        customer_license_number: user.driver_license?.number || '',
        customer_license_category: user.driver_license?.category || 'B',
        customer_license_expiry: user.driver_license?.expiry_date || '',
        customer_license_issue_date: user.driver_license?.issue_date || '',
        incasso_dag: incassoDag,
        car_id: car.id,
        car_info: carInfo,
        license_plate: car.license_plate || '',
        start_date: startDate,
        end_date: '',
        weeks_rented: 0,
        weekly_rate: plan.rate,
        total_price: plan.rate,
        contract_html: contractHtml,
        admin_signature_url: adminSignatureUrl,
        signed: false,
        status: 'pending',
      });

      navigate(`/customer/contract/${bookingRef.id}`, { replace: true });
    } catch (err: any) {
      console.error('[Booking] Error:', err);
      setError(err.message || 'Fout bij het aanmaken van het abonnement');
      setIsProcessing(false);
    }
  };

  const renderPayMethodSelector = (
    value: PayMethod,
    onChange: (v: PayMethod) => void,
    label: string,
    amount: string,
  ) => (
    <div className="mb-5">
      <p className="text-sm font-medium text-white mb-1">{label}</p>
      <p className="text-xs text-neutral-500 mb-3">{amount} — wordt bij overdracht verrekend</p>
      <div className="grid grid-cols-3 gap-2">
        {(['contant', 'pin', 'stripe'] as PayMethod[]).map(method => {
          const Icon = method === 'contant' ? Banknote : method === 'pin' ? Smartphone : CreditCard;
          const methodLabel = method === 'contant' ? 'Contant' : method === 'pin' ? 'Pin' : 'Online (Stripe)';
          const desc = method === 'contant' ? 'Cash bij overdracht' : method === 'pin' ? 'Pinapparaat ter plaatse' : 'Link via e-mail';
          return (
            <button
              key={method}
              type="button"
              onClick={() => onChange(method)}
              className={`rounded-xl p-3 text-left border-2 transition-all ${
                value === method
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/[0.12] bg-[var(--vl-bg-primary)] hover:border-white/30'
              }`}
            >
              <Icon className="w-4 h-4 text-green-400 mb-1" />
              <p className="text-xs font-semibold text-white">{methodLabel}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">{desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="vl-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-white/[0.15]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.1] flex items-center justify-between sticky top-0 z-10 vl-card">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => { setStep(1); setError(''); }}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="text-lg font-bold text-white">
                {step === 1 ? 'Kies je huurplan' : `${plan?.label} — ${car.brand} ${car.model}`}
              </h3>
              {step === 2 && (
                <p className="text-xs text-neutral-500">€{plan?.rate}/week · {plan?.minLabel}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">

          {/* ── STEP 1: Plan selectie ── */}
          {step === 1 && (
            <>
              {/* Auto preview */}
              <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                {car.images && car.images.length > 0 && (
                  <img
                    src={car.images[0]}
                    alt={`${car.brand} ${car.model}`}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div>
                  <p className="font-semibold text-white">{car.brand} {car.model}</p>
                  <p className="text-sm text-neutral-500">{car.year} · {car.license_plate}</p>
                </div>
              </div>

              {/* Plan cards */}
              <div className="space-y-3">
                {PLANS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlan(p.id)}
                    className={`w-full rounded-xl p-4 text-left border-2 transition-all hover:border-white/40 ${
                      selectedPlan === p.id ? p.activeColor : p.color + ' bg-[var(--vl-bg-primary)]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{p.label}</span>
                          {p.badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.badgeColor}`}>
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500">{p.sublabel}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-2xl font-black ${p.rateColor}`}>
                          €{p.rate}<span className="text-sm font-normal text-neutral-500">/wk</span>
                        </p>
                        <p className="text-xs text-neutral-500">€{p.perDay}/dag</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs text-neutral-500">
                      <span>· {p.minLabel}</span>
                      <span>· {p.hasBorg ? `€${settings?.borg_amount ?? 500} borg` : 'Geen borg'}</span>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs text-neutral-600 text-center">
                Alle plannen zijn open contracten — je betaalt wekelijks via automatische incasso
              </p>
            </>
          )}

          {/* ── STEP 2: Details ── */}
          {step === 2 && plan && (
            <>
              {/* Ophalen of bezorgen */}
              <div className="mb-5">
                <p className="text-sm font-medium text-white mb-3">Ophalen of bezorgen?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPickupType('ophalen')}
                    className={`rounded-xl p-4 text-left border-2 transition-all ${
                      pickupType === 'ophalen'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-white/[0.12] bg-[var(--vl-bg-primary)] hover:border-white/30'
                    }`}
                  >
                    <MapPin className="w-5 h-5 text-green-400 mb-1.5" />
                    <p className="text-sm font-semibold text-white">Zelf ophalen</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Gratis</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupType('bezorgen')}
                    className={`rounded-xl p-4 text-left border-2 transition-all ${
                      pickupType === 'bezorgen'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-white/[0.12] bg-[var(--vl-bg-primary)] hover:border-white/30'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-green-400 mb-1.5" />
                    <p className="text-sm font-semibold text-white">Bezorgen</p>
                    <p className="text-xs text-neutral-500 mt-0.5">+€{DELIVERY_COST} eenmalig</p>
                  </button>
                </div>

                {/* Ophaallocatie */}
                {pickupType === 'ophalen' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Ophaallocatie</label>
                    {(settings?.locations ?? []).filter(l => l.active).length === 0 ? (
                      <p className="text-sm text-yellow-400">Geen locaties beschikbaar. Neem contact op met de verhuurder.</p>
                    ) : (
                      <select
                        value={pickupLocationId}
                        onChange={e => setPickupLocationId(e.target.value)}
                        className="vl-input"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">— Kies een locatie —</option>
                        {(settings?.locations ?? []).filter(l => l.active).map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}{loc.address ? ` — ${loc.address}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Bezorgadres */}
                {pickupType === 'bezorgen' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Bezorgadres</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder={user?.address || 'Straat + huisnummer, Stad'}
                      className="vl-input"
                    />
                    {user?.address && !deliveryAddress && (
                      <button
                        type="button"
                        onClick={() => setDeliveryAddress(user.address)}
                        className="mt-1 text-xs text-green-400 hover:text-green-300"
                      >
                        Gebruik mijn profieladres: {user.address}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bezorgkosten betaalmethode */}
              {pickupType === 'bezorgen' && renderPayMethodSelector(
                deliveryCostMethod,
                setDeliveryCostMethod,
                'Bezorgkosten betalen',
                `Eenmalig €${DELIVERY_COST}`,
              )}

              {/* Borg betaalmethode — alleen bij basis */}
              {plan.hasBorg && renderPayMethodSelector(
                borgMethod,
                setBorgMethod,
                'Waarborgsom betalen',
                `Eenmalig €${settings?.borg_amount ?? 500} — terugbetaald bij inlevering`,
              )}

              {/* Startdatum — kies een maandag */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-white mb-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Startdatum
                </label>
                {loadingDates ? (
                  <p className="text-xs text-neutral-500">Beschikbaarheid laden...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 8 }, (_, i) => {
                      const d = getNextMonday();
                      d.setDate(d.getDate() + i * 7);
                      const iso = d.toISOString().split('T')[0];
                      const booked = isDateBooked(iso);
                      const selected = startDate === iso;
                      const label = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={booked}
                          onClick={() => { setStartDate(iso); setError(''); }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                            booked
                              ? 'border-red-500/40 bg-red-900/20 text-red-400 cursor-not-allowed opacity-60'
                              : selected
                              ? 'border-green-500 bg-green-500/20 text-white'
                              : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {label}
                          {booked && <span className="block text-xs text-red-400 font-normal">Bezet</span>}
                          {selected && !booked && <span className="block text-xs text-green-400 font-normal">Geselecteerd</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Prijsoverzicht */}
              <div className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-400">
                  <span>Wekelijks abonnement</span>
                  <span className="text-white font-medium">€{plan.rate}/week</span>
                </div>
                {plan.hasBorg && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Borgsom (eenmalig, terugbetaalbaar)</span>
                    <span className="text-white font-medium">€{settings?.borg_amount ?? 500}</span>
                  </div>
                )}
                {pickupType === 'bezorgen' && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Bezorgkosten (eenmalig)</span>
                    <span className="text-white font-medium">€{DELIVERY_COST}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                  <span className="text-neutral-300">Eerste betaling via Stripe</span>
                  <span className="text-green-400">€{plan.rate}</span>
                </div>
                {(plan.hasBorg || pickupType === 'bezorgen') && (
                  <p className="text-xs text-neutral-600">
                    Borg{pickupType === 'bezorgen' ? ' en bezorgkosten worden' : ' wordt'} apart verrekend bij overdracht
                  </p>
                )}
              </div>

              {/* Account niet goedgekeurd */}
              {user?.verification_status !== 'approved' && (
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-md p-4 mb-5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-400">
                      <p className="font-medium">Account niet goedgekeurd</p>
                      <p>Uw account moet eerst worden goedgekeurd voordat u kunt huren.</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-md p-4 mb-5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Stripe veiligheid */}
              <div className="bg-[var(--vl-bg-primary)] border border-white/[0.08] rounded-md p-3 mb-5 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs text-neutral-500">
                  Veilige betaling via Stripe · Eerste week €{plan.rate} · Daarna wekelijks automatisch afgeschreven
                </p>
              </div>

              {/* Actieknoppen */}
              <div className="flex gap-3">
                {isDateBooked(startDate) && isMonday(startDate) ? (
                  <>
                    <button
                      onClick={() => setShowWaitlistModal(true)}
                      className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-400 transition-colors flex items-center justify-center font-medium"
                    >
                      <Bell className="w-5 h-5 mr-2" />
                      Wachtlijst
                    </button>
                    <button onClick={onClose} className="px-6 py-3 border border-white/[0.12] rounded-md hover:bg-white/5 transition-colors text-neutral-300">
                      Annuleren
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleBooking}
                      disabled={isProcessing || user?.verification_status !== 'approved' || !isMonday(startDate)}
                      className="flex-1 bg-green-500 text-white px-4 py-3 rounded-md hover:bg-green-400 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Bezig...
                        </>
                      ) : (
                        <>
                          <Euro className="w-5 h-5 mr-2" />
                          Betaal €{plan.rate} en start
                        </>
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      disabled={isProcessing}
                      className="px-6 py-3 border border-white/[0.12] rounded-md hover:bg-white/5 transition-colors disabled:opacity-50 text-neutral-300"
                    >
                      Annuleren
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <WaitlistModal
        car={car}
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        onSuccess={() => { setShowWaitlistModal(false); onClose(); }}
      />
    </div>
  );
};

export default BookingModal;
