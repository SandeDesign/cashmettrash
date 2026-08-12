import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { Car, CheckCircle, XCircle, Clock, AlertCircle, Loader2, Euro, Building2, X, FileText, Wrench, Shield, ChevronLeft, ChevronRight, User, Mail, MessageSquare, List } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { db } from '../../lib/firebase';
import { useCarStore } from '../../store/carStore';
import { usePartnerStore } from '../../store/partnerStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuth } from '../../hooks/useAuth';
import { Car as CarType } from '../../types';
import { generatePartnerContractHtml } from './Partners';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface SubmittedCar extends CarType {
  partnerName?: string;
  partnerCompany?: string;
  partnerEmail?: string;
  apk_expiry_date?: string;
  apk_document_url?: string;
  vehicle_registration_url?: string;
  last_maintenance_date?: string;
  last_maintenance_notes?: string;
  partner_rejection_reason?: string;
  change_request_pending?: boolean;
  change_request_message?: string;
  change_request_at?: string;
}

type FilterType = 'all' | 'pending' | 'changes' | 'rejected';

const PartnerCarSubmissions: React.FC = () => {
  const { user } = useAuth();
  const { approvePartnerCar, rejectPartnerCar, resolveChangeRequest } = useCarStore();
  const { createPartnerContract } = usePartnerStore();
  const { settings } = useSettingsStore();
  const [cars, setCars] = useState<SubmittedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ carId: string; carName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [changeResponseModal, setChangeResponseModal] = useState<{ carId: string; carName: string } | null>(null);
  const [changeResponse, setChangeResponse] = useState('');
  const [changeResponseApproved, setChangeResponseApproved] = useState<boolean | null>(null);
  const [changeResponseError, setChangeResponseError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<SubmittedCar | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [approveModal, setApproveModal] = useState<{ carId: string; carName: string } | null>(null);
  const [approvePurchasePrice, setApprovePurchasePrice] = useState<number>(0);
  const [approveRepaymentPct, setApproveRepaymentPct] = useState<number>(30);
  const [approveError, setApproveError] = useState<string | null>(null);

  const loadCars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(
        query(collection(db, 'cars'), where('submitted_by_partner', '!=', null))
      );

      const partnerUids = [...new Set(snap.docs.map(d => d.data().submitted_by_partner as string))];
      const partnerMap: Record<string, { name: string; company: string; email: string }> = {};

      await Promise.all(
        partnerUids.map(async uid => {
          try {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (userSnap.exists()) {
              const u = userSnap.data();
              partnerMap[uid] = {
                name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || uid,
                company: u.company_name || '',
                email: u.email || '',
              };
            }
          } catch {
            partnerMap[uid] = { name: uid, company: '', email: '' };
          }
        })
      );

      const result: SubmittedCar[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        created_at: d.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: d.data().updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        partnerName: partnerMap[d.data().submitted_by_partner]?.name,
        partnerCompany: partnerMap[d.data().submitted_by_partner]?.company,
        partnerEmail: partnerMap[d.data().submitted_by_partner]?.email,
      } as SubmittedCar));

      setCars(result);
    } catch (err: any) {
      setError(err.message || 'Laden mislukt');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCars(); }, [loadCars]);

  const filteredCars = cars.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'pending') return c.partner_approved == null || c.partner_approved === undefined;
    if (filter === 'rejected') return c.partner_approved === false;
    if (filter === 'changes') return c.change_request_pending === true;
    return true;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try { return format(new Date(dateStr), 'd MMM yyyy', { locale: nl }); } catch { return dateStr; }
  };

  const openApproveModal = (carId: string, carName: string) => {
    setApproveModal({ carId, carName });
    setApprovePurchasePrice(0);
    setApproveRepaymentPct(30);
    setApproveError(null);
  };

  const handleApprove = async (carId?: string) => {
    const targetCarId = carId || approveModal?.carId;
    if (!user || !targetCarId) return;

    // If called without modal (quick approve from card), open modal instead
    if (!approveModal) {
      const car = cars.find(c => c.id === targetCarId);
      if (car) {
        openApproveModal(targetCarId, `${car.brand} ${car.model}`);
      }
      return;
    }

    if (!approvePurchasePrice || approvePurchasePrice <= 0) {
      setApproveError('Vul een geldige verkoopprijs in');
      return;
    }
    if (!approveRepaymentPct || approveRepaymentPct <= 0 || approveRepaymentPct > 100) {
      setApproveError('Vul een geldig aflossingspercentage in (1-100%)');
      return;
    }

    setActionLoading(targetCarId);
    setError(null);
    setApproveError(null);
    try {
      await approvePartnerCar(targetCarId, user.uid, approvePurchasePrice, approveRepaymentPct);

      // Create unsigned partner contract with price details
      const car = cars.find(c => c.id === targetCarId);
      if (car) {
        const carInfo = `${car.brand} ${car.model} (${car.year})`;
        const contractHtml = generatePartnerContractHtml({
          partner_company: car.partnerCompany || car.partnerName || '',
          partner_name: car.partnerName || '',
          partner_email: car.partnerEmail || '',
          car_info: carInfo,
          license_plate: car.license_plate,
          purchase_price: approvePurchasePrice.toLocaleString('nl-NL'),
          repayment_percentage: String(approveRepaymentPct),
          current_date: new Date().toLocaleDateString('nl-NL'),
          admin_signature: '',
        });

        await createPartnerContract({
          partner_id: car.submitted_by_partner || '',
          partner_name: car.partnerName || '',
          partner_email: car.partnerEmail || '',
          partner_company: car.partnerCompany || '',
          car_id: targetCarId,
          car_info: carInfo,
          license_plate: car.license_plate,
          purchase_price: approvePurchasePrice,
          repayment_percentage: approveRepaymentPct,
          payment_terms: `Aflossing via ${approveRepaymentPct}% van maandelijkse verhuurinkomsten`,
          contract_html: contractHtml,
          contract_subtype: 'auto_inkoop',
          partner_signature_url: '',
          admin_signature_url: settings?.admin_signature_url || '',
          signed: false,
          status: 'pending',
        });

        // Send notification to partner
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          user_id: car.submitted_by_partner || '',
          type: 'car_approved',
          title: `Verkoopprijs vastgesteld: ${carInfo}`,
          message: `De verkoopprijs voor je ${carInfo} is vastgesteld op \u20AC${approvePurchasePrice.toLocaleString('nl-NL')}. Teken het inkoopcontract in je documenten.`,
          link: '/partner/documents',
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      setCars(prev => prev.map(c => c.id === targetCarId ? { ...c, partner_approved: true, purchase_price: approvePurchasePrice, repayment_percentage: approveRepaymentPct } : c));
      if (selectedCar?.id === targetCarId) setSelectedCar(prev => prev ? { ...prev, partner_approved: true, purchase_price: approvePurchasePrice, repayment_percentage: approveRepaymentPct } : prev);
      setSuccess('Auto goedgekeurd met verkoopprijs en aflossing.');
      setTimeout(() => setSuccess(null), 4000);
      setApproveModal(null);
    } catch (err: any) {
      setApproveError(err.message || 'Goedkeuren mislukt');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !user) return;
    if (!rejectReason.trim()) {
      setRejectError('Vul een reden in voor de afwijzing.');
      return;
    }
    setActionLoading(rejectModal.carId);
    setRejectError(null);
    setError(null);
    try {
      await rejectPartnerCar(rejectModal.carId, rejectReason.trim());
      setCars(prev => prev.map(c => c.id === rejectModal.carId
        ? { ...c, partner_approved: false, partner_rejection_reason: rejectReason.trim() }
        : c
      ));
      if (selectedCar?.id === rejectModal.carId) {
        setSelectedCar(prev => prev ? { ...prev, partner_approved: false, partner_rejection_reason: rejectReason.trim() } : prev);
      }
      setSuccess('Auto afgewezen.');
      setTimeout(() => setSuccess(null), 4000);
      setRejectModal(null);
      setRejectReason('');
    } catch (err: any) {
      setError(err.message || 'Afwijzen mislukt');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveChangeRequest = async () => {
    if (!changeResponseModal || changeResponseApproved === null) return;
    if (!changeResponse.trim()) {
      setChangeResponseError('Vul een reactie in voor de partner.');
      return;
    }
    setActionLoading(changeResponseModal.carId);
    setChangeResponseError(null);
    try {
      await resolveChangeRequest(changeResponseModal.carId, changeResponseApproved, changeResponse.trim());
      setCars(prev => prev.map(c => c.id === changeResponseModal.carId
        ? { ...c, change_request_pending: false }
        : c
      ));
      if (selectedCar?.id === changeResponseModal.carId) {
        setSelectedCar(prev => prev ? { ...prev, change_request_pending: false } : prev);
      }
      setSuccess(changeResponseApproved ? 'Wijziging goedgekeurd.' : 'Wijziging afgewezen.');
      setTimeout(() => setSuccess(null), 4000);
      setChangeResponseModal(null);
      setChangeResponse('');
      setChangeResponseApproved(null);
    } catch (err: any) {
      setError(err.message || 'Reactie sturen mislukt');
    } finally {
      setActionLoading(null);
    }
  };

  const counts = {
    pending: cars.filter(c => c.partner_approved == null || c.partner_approved === undefined).length,
    rejected: cars.filter(c => c.partner_approved === false).length,
    changes: cars.filter(c => c.change_request_pending === true).length,
    all: cars.length,
  };

  const filterBtns: { id: FilterType; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'all', icon: <List className="w-4 h-4" />, label: 'Alle', badge: counts.all },
    { id: 'pending', icon: <Clock className="w-4 h-4" />, label: 'In behandeling', badge: counts.pending },
    { id: 'changes', icon: <MessageSquare className="w-4 h-4" />, label: 'Wijzigingen', badge: counts.changes },
    { id: 'rejected', icon: <XCircle className="w-4 h-4" />, label: 'Afgewezen', badge: counts.rejected },
  ];

  const openDetail = (car: SubmittedCar) => {
    setSelectedCar(car);
    setImgIndex(0);
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Auto Indieningen"
          subtitle="Beoordeel auto's aangeboden door partners"
          icon={Car}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-6xl mx-auto space-y-5">

            {error && (
              <div className="rounded-xl px-4 py-3 border border-red-500/20 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}
            {success && (
              <div className="rounded-xl px-4 py-3 border border-green-500/20 flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.08)' }}>
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-sm text-green-400">{success}</span>
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {filterBtns.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    filter === btn.id
                      ? 'bg-green-500 text-neutral-950'
                      : 'text-neutral-400 hover:text-white border border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {btn.icon}
                  <span className="hidden sm:inline">{btn.label}</span>
                  {(btn.badge ?? 0) > 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                      filter === btn.id ? 'bg-neutral-950/20 text-neutral-950' : 'bg-white/10 text-white'
                    }`}>
                      {btn.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="text-center py-20">
                <Car className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">Geen auto's gevonden voor dit filter</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCars.map(car => {
                  const isPending = car.partner_approved == null || car.partner_approved === undefined;
                  const isApproved = car.partner_approved === true;
                  const isActionLoading = actionLoading === car.id;

                  return (
                    <div
                      key={car.id}
                      className="vl-card rounded-2xl overflow-hidden border border-white/[0.08] flex flex-col cursor-pointer hover:border-white/20 transition-all"
                      onClick={() => openDetail(car)}
                    >
                      {/* Image */}
                      <div className="relative h-44 bg-neutral-900">
                        {car.images?.[0] ? (
                          <img src={car.images[0]} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-12 h-12 text-neutral-700" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                          {car.change_request_pending && (
                            <span className="vl-badge vl-badge-blue flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" /> Wijzigingsverzoek
                            </span>
                          )}
                          {isPending && (
                            <span className="vl-badge vl-badge-yellow flex items-center gap-1">
                              <Clock className="w-3 h-3" /> In behandeling
                            </span>
                          )}
                          {isApproved && !car.change_request_pending && (
                            <span className="vl-badge vl-badge-green flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Goedgekeurd
                            </span>
                          )}
                          {car.partner_approved === false && (
                            <span className="vl-badge vl-badge-red flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Afgewezen
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex flex-col gap-3">
                        <div>
                          <h3 className="font-semibold text-white">{car.brand} {car.model} ({car.year})</h3>
                          <p className="text-xs text-neutral-500">{car.license_plate}</p>
                        </div>

                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-neutral-600" />
                            <span className="truncate">{car.partnerName || '—'}{car.partnerCompany ? ` · ${car.partnerCompany}` : ''}</span>
                          </div>
                          {car.purchase_price != null && (
                            <div className="flex items-center gap-2 text-neutral-400">
                              <Euro className="w-3.5 h-3.5 flex-shrink-0 text-neutral-600" />
                              <span>Inkoopprijs: <strong className="text-white">€{car.purchase_price.toLocaleString('nl-NL')}</strong></span>
                            </div>
                          )}
                          <div className="text-xs text-neutral-600">Ingediend: {formatDate(car.created_at)}</div>
                        </div>

                        {/* Actions */}
                        {isPending && (
                          <div className="flex gap-2 mt-auto pt-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => openApproveModal(car.id, `${car.brand} ${car.model}`)}
                              disabled={isActionLoading}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500 text-neutral-950 text-sm font-semibold hover:bg-green-400 transition-colors disabled:opacity-50"
                            >
                              {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Goedkeuren
                            </button>
                            <button
                              onClick={() => setRejectModal({ carId: car.id, carName: `${car.brand} ${car.model}` })}
                              disabled={isActionLoading}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Afwijzen
                            </button>
                          </div>
                        )}
                        {!isPending && (
                          <div className="mt-auto pt-2 text-xs text-neutral-600">
                            {car.partner_approved_at ? `Beoordeeld op ${formatDate(car.partner_approved_at)}` : ''}
                          </div>
                        )}
                      </div>
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
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
          <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl border border-white/[0.08] max-h-[92vh] overflow-y-auto" style={{ background: 'rgba(18,18,18,0.98)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] sticky top-0 z-10" style={{ background: 'rgba(18,18,18,0.98)' }}>
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedCar.brand} {selectedCar.model} ({selectedCar.year})</h2>
                <p className="text-xs text-neutral-500">{selectedCar.license_plate}</p>
              </div>
              <div className="flex items-center gap-2">
                {(selectedCar.partner_approved == null || selectedCar.partner_approved === undefined) && (
                  <>
                    <button
                      onClick={() => openApproveModal(selectedCar.id, `${selectedCar.brand} ${selectedCar.model}`)}
                      disabled={actionLoading === selectedCar.id}
                      className="px-3 py-1.5 text-sm font-semibold text-neutral-950 bg-green-500 rounded-lg hover:bg-green-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actionLoading === selectedCar.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Goedkeuren
                    </button>
                    <button
                      onClick={() => setRejectModal({ carId: selectedCar.id, carName: `${selectedCar.brand} ${selectedCar.model}` })}
                      className="px-3 py-1.5 text-sm font-medium text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Afwijzen
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedCar(null)} className="text-neutral-400 hover:text-white transition-colors ml-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">

              {/* Image gallery */}
              {selectedCar.images && selectedCar.images.length > 0 && (
                <div className="relative rounded-xl overflow-hidden bg-neutral-900" style={{ height: 260 }}>
                  <img
                    src={selectedCar.images[imgIndex]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {selectedCar.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIndex(i => (i - 1 + selectedCar.images!.length) % selectedCar.images!.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => setImgIndex(i => (i + 1) % selectedCar.images!.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {selectedCar.images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-white' : 'bg-white/30'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Wijzigingsverzoek */}
              {selectedCar.change_request_pending && (
                <div className="rounded-xl p-4 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.08)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-400">Wijzigingsverzoek</span>
                    <span className="text-xs text-neutral-500 ml-auto">{formatDate(selectedCar.change_request_at)}</span>
                  </div>
                  <p className="text-sm text-neutral-300 mb-3">{selectedCar.change_request_message}</p>
                  <button
                    onClick={() => {
                      setChangeResponseModal({ carId: selectedCar.id, carName: `${selectedCar.brand} ${selectedCar.model}` });
                      setChangeResponse('');
                      setChangeResponseApproved(null);
                      setChangeResponseError(null);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Reageren
                  </button>
                </div>
              )}

              {/* Status badge */}
              <div>
                {selectedCar.partner_approved == null && (
                  <span className="vl-badge vl-badge-yellow inline-flex items-center gap-1"><Clock className="w-3 h-3" /> In behandeling</span>
                )}
                {selectedCar.partner_approved === true && (
                  <span className="vl-badge vl-badge-green inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Goedgekeurd op {formatDate(selectedCar.partner_approved_at)}</span>
                )}
                {selectedCar.partner_approved === false && (
                  <div>
                    <span className="vl-badge vl-badge-red inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Afgewezen op {formatDate(selectedCar.partner_approved_at)}</span>
                    {selectedCar.partner_rejection_reason && (
                      <p className="text-sm text-neutral-400 mt-2">Reden: <span className="text-white">{selectedCar.partner_rejection_reason}</span></p>
                    )}
                  </div>
                )}
              </div>

              {/* Partner info */}
              <div className="vl-card rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Partner</h4>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-neutral-600" />
                  <span className="text-white">{selectedCar.partnerName || '—'}</span>
                  {selectedCar.partnerCompany && <span className="text-neutral-500">· {selectedCar.partnerCompany}</span>}
                </div>
                {selectedCar.partnerEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-neutral-600" />
                    <a href={`mailto:${selectedCar.partnerEmail}`} className="text-green-400 hover:underline">{selectedCar.partnerEmail}</a>
                  </div>
                )}
                <div className="text-xs text-neutral-600">Ingediend: {formatDate(selectedCar.created_at)}</div>
              </div>

              {/* Car specs */}
              <div className="vl-card rounded-xl p-4">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Voertuiggegevens</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Merk', selectedCar.brand],
                    ['Model', selectedCar.model],
                    ['Bouwjaar', selectedCar.year],
                    ['Kenteken', selectedCar.license_plate],
                    ['Inkoopprijs', selectedCar.purchase_price != null && selectedCar.purchase_price > 0 ? `€${Number(selectedCar.purchase_price).toLocaleString('nl-NL')}` : 'Nog vast te stellen'],
                    ['Aflossing', (selectedCar as any).repayment_percentage ? `${(selectedCar as any).repayment_percentage}% van verhuurinkomsten` : 'Nog vast te stellen'],
                    ['Brandstof', (selectedCar as any).specs?.fuel_type || '—'],
                    ['Transmissie', (selectedCar as any).specs?.transmission || '—'],
                    ['Kleur', (selectedCar as any).specs?.color || '—'],
                    ['Zitplaatsen', (selectedCar as any).specs?.seats || '—'],
                    ['KM-stand', (selectedCar as any).specs?.mileage ? `${Number((selectedCar as any).specs.mileage).toLocaleString('nl-NL')} km` : '—'],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <p className="text-neutral-500 text-xs">{label}</p>
                      <p className="text-white font-medium">{String(value ?? '—')}</p>
                    </div>
                  ))}
                </div>
                {selectedCar.description && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <p className="text-neutral-500 text-xs mb-1">Beschrijving</p>
                    <p className="text-neutral-300 text-sm">{selectedCar.description}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="vl-card rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Documenten & APK</h4>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Shield className="w-4 h-4 text-neutral-600" />
                    <span>Tenaamstelling</span>
                  </div>
                  {(selectedCar as any).vehicle_registration_url ? (
                    <a href={(selectedCar as any).vehicle_registration_url} target="_blank" rel="noopener noreferrer" className="text-green-400 text-xs hover:underline flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Bekijken
                    </a>
                  ) : (
                    <span className="text-neutral-600 text-xs">Niet geüpload</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <CheckCircle className="w-4 h-4 text-neutral-600" />
                    <span>APK vervaldatum</span>
                  </div>
                  <span className="text-white text-xs">{(selectedCar as any).apk_expiry_date ? formatDate((selectedCar as any).apk_expiry_date) : '—'}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <FileText className="w-4 h-4 text-neutral-600" />
                    <span>APK document</span>
                  </div>
                  {(selectedCar as any).apk_document_url ? (
                    <a href={(selectedCar as any).apk_document_url} target="_blank" rel="noopener noreferrer" className="text-green-400 text-xs hover:underline flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Bekijken
                    </a>
                  ) : (
                    <span className="text-neutral-600 text-xs">Niet geüpload</span>
                  )}
                </div>
              </div>

              {/* Maintenance */}
              {((selectedCar as any).last_maintenance_date || (selectedCar as any).last_maintenance_notes) && (
                <div className="vl-card rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5" /> Onderhoud Historie
                  </h4>
                  {(selectedCar as any).last_maintenance_date && (
                    <div className="text-sm">
                      <span className="text-neutral-500">Laatste onderhoud: </span>
                      <span className="text-white">{formatDate((selectedCar as any).last_maintenance_date)}</span>
                    </div>
                  )}
                  {(selectedCar as any).last_maintenance_notes && (
                    <p className="text-neutral-300 text-sm">{(selectedCar as any).last_maintenance_notes}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change Request Response Modal */}
      {changeResponseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="vl-card rounded-2xl w-full max-w-md border border-white/[0.12] shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Reageer op wijzigingsverzoek</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              Wijzigingsverzoek voor <strong className="text-white">{changeResponseModal.carName}</strong>. Kies een reactie:
            </p>

            {/* Approve / Reject buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setChangeResponseApproved(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  changeResponseApproved === true
                    ? 'bg-green-500 text-neutral-950 border-green-500'
                    : 'border-white/[0.1] text-neutral-400 hover:border-green-500/40 hover:text-green-400'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Akkoord gewijzigd
              </button>
              <button
                onClick={() => setChangeResponseApproved(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  changeResponseApproved === false
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : 'border-white/[0.1] text-neutral-400 hover:border-red-500/40 hover:text-red-400'
                }`}
              >
                <XCircle className="w-4 h-4" /> Nee, omdat...
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-neutral-400 mb-2">
                Toelichting voor de partner <span className="text-red-400">*</span>
              </label>
              <textarea
                value={changeResponse}
                onChange={e => { setChangeResponse(e.target.value); setChangeResponseError(null); }}
                rows={3}
                className="vl-input w-full text-sm"
                placeholder={changeResponseApproved ? 'Bijv. De wijziging is doorgevoerd in het systeem.' : 'Bijv. De inkoopprijs kan niet worden aangepast na ondertekening.'}
                autoFocus
              />
              {changeResponseError && <p className="text-red-400 text-xs mt-1.5">{changeResponseError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResolveChangeRequest}
                disabled={actionLoading === changeResponseModal.carId || changeResponseApproved === null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-neutral-950 font-semibold hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {actionLoading === changeResponseModal.carId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Versturen
              </button>
              <button
                onClick={() => { setChangeResponseModal(null); setChangeResponse(''); setChangeResponseApproved(null); setChangeResponseError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal - Set purchase price & repayment % */}
      {approveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="vl-card rounded-2xl w-full max-w-md border border-white/[0.12] shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Euro className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">Verkoopprijs & Aflossing</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-5">
              Stel de verkoopprijs en het aflossingspercentage in voor <strong className="text-white">{approveModal.carName}</strong>.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">
                  Verkoopprijs (€) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={approvePurchasePrice || ''}
                  onChange={e => { setApprovePurchasePrice(Number(e.target.value)); setApproveError(null); }}
                  className="vl-input w-full text-sm"
                  placeholder="bijv. 1500"
                  min={1}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">
                  Aflossingspercentage (%) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={approveRepaymentPct || ''}
                  onChange={e => { setApproveRepaymentPct(Number(e.target.value)); setApproveError(null); }}
                  className="vl-input w-full text-sm"
                  placeholder="bijv. 30"
                  min={1}
                  max={100}
                />
                <p className="text-xs text-neutral-500 mt-1.5">
                  Percentage van de maandelijkse verhuurinkomsten dat naar aflossing gaat.
                </p>
              </div>

              {approvePurchasePrice > 0 && approveRepaymentPct > 0 && (
                <div className="rounded-xl p-3 border border-green-500/20" style={{ background: 'rgba(34,197,94,0.06)' }}>
                  <p className="text-xs text-neutral-400">
                    Bij {approveRepaymentPct}% aflossing van verhuurinkomsten wordt de verkoopprijs van €{approvePurchasePrice.toLocaleString('nl-NL')} in circa 8-9 maanden afgelost.
                  </p>
                </div>
              )}
            </div>

            {approveError && <p className="text-red-400 text-xs mb-3">{approveError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove()}
                disabled={actionLoading === approveModal.carId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-neutral-950 font-semibold hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {actionLoading === approveModal.carId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Goedkeuren
              </button>
              <button
                onClick={() => { setApproveModal(null); setApproveError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="vl-card rounded-2xl w-full max-w-md border border-white/[0.12] shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-white">Auto afwijzen</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              Je wijst <strong className="text-white">{rejectModal.carName}</strong> af. Geef de partner een duidelijke reden.
            </p>
            <div className="mb-5">
              <label className="block text-xs font-medium text-neutral-400 mb-2">
                Reden <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => { setRejectReason(e.target.value); setRejectError(null); }}
                rows={3}
                className="vl-input w-full text-sm"
                placeholder="Bijv. onvoldoende documentatie, auto voldoet niet aan eisen..."
                autoFocus
              />
              {rejectError && (
                <p className="text-red-400 text-xs mt-1.5">{rejectError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.carId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading === rejectModal.carId ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Afwijzen
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); setRejectError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-neutral-400 hover:text-white transition-colors"
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

export default PartnerCarSubmissions;
