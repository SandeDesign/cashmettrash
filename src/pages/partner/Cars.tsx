import React, { useEffect, useState } from 'react';
import { Car, Plus, Clock, CheckCircle, X, Upload, Loader2, FileText, Shield, Wrench, XCircle, Mail, List, Edit3, ChevronLeft, ChevronRight, Euro, Eye } from 'lucide-react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { usePartnerStore } from '../../store/partnerStore';
import { useCarStore } from '../../store/carStore';
import { db } from '../../lib/firebase';

const PROXY_URL = 'https://internedata.nl/proxyvlottr.php';

const PartnerCars: React.FC = () => {
  const { user } = useAuth();
  const { partnerCars, subscribeToPartnerCars } = usePartnerStore();
  const { addCar } = useCarStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [carFilter, setCarFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [detailImgIndex, setDetailImgIndex] = useState(0);

  const EMPTY_FORM = {
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    description: '',
    images: [] as string[],
    specs: {
      fuel_type: '',
      transmission: '',
      seats: 5,
      doors: 4,
      color: '',
      condition: '',
      mileage: '' as string | number,
      highlights: [] as string[],
    },
    apk_expiry_date: '',
    apk_document_url: '',
    vehicle_registration_url: '',
    last_maintenance_date: '',
    last_maintenance_notes: '',
  };

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const unsub = subscribeToPartnerCars(user.uid);
      return unsub;
    }
  }, [user, subscribeToPartnerCars]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImages(true);
    setError(null);

    try {
      const newImages: string[] = [...formData.images];

      for (const file of Array.from(e.target.files)) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('folder', 'partner-cars');

        const response = await fetch(PROXY_URL, {
          method: 'POST',
          body: formDataUpload,
        });

        if (!response.ok) throw new Error('Upload mislukt');
        const data = await response.json();
        if (data.url) {
          newImages.push(data.url);
        }
      }

      setFormData(prev => ({ ...prev, images: newImages }));
    } catch (err: any) {
      setError(err.message || 'Foto upload mislukt');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(field);
    setError(null);

    try {
      const companySlug = (user.company_name || user.name || user.uid)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('folder', `vlottr/partner-documenten/${companySlug}`);

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) throw new Error('Upload mislukt');
      const data = await response.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, [field]: data.url }));
      }
    } catch (err: any) {
      setError(err.message || 'Document upload mislukt');
    } finally {
      setUploadingDoc(null);
    }
  };

  const HIGHLIGHTS_OPTIONS = [
    'Airconditioning', 'Navigatie', 'Cruise control', 'Bluetooth / handsfree',
    'Parkeersensoren', 'Achteruitrijcamera', 'Stoelverwarming', 'DAB+ Radio',
    'Apple CarPlay / Android Auto', 'Elektrische ramen', 'Trekhaak', 'Panoramadak',
  ];

  const openEditModal = (car: any) => {
    setFormData({
      brand: car.brand || '',
      model: car.model || '',
      year: car.year || new Date().getFullYear(),
      license_plate: car.license_plate || '',
      description: car.description || '',
      images: car.images || [],
      specs: {
        fuel_type: car.specs?.fuel_type || '',
        transmission: car.specs?.transmission || '',
        seats: car.specs?.seats || 5,
        doors: car.specs?.doors || 4,
        color: car.specs?.color || '',
        condition: car.specs?.condition || '',
        mileage: car.specs?.mileage || '',
        highlights: car.specs?.highlights || [],
      },
      apk_expiry_date: car.apk_expiry_date || '',
      apk_document_url: car.apk_document_url || '',
      vehicle_registration_url: car.vehicle_registration_url || '',
      last_maintenance_date: car.last_maintenance_date || '',
      last_maintenance_notes: car.last_maintenance_notes || '',
    });
    setEditingCarId(car.id);
    setError(null);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.brand || !formData.model || !formData.license_plate) {
      setError('Vul minimaal merk, model en kenteken in');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const carData: Record<string, any> = {
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        license_plate: formData.license_plate.toUpperCase(),
        images: formData.images,
        description: formData.description,
        specs: formData.specs,
        apk_expiry_date: formData.apk_expiry_date || null,
        apk_document_url: formData.apk_document_url || null,
        vehicle_registration_url: formData.vehicle_registration_url || null,
        last_maintenance_date: formData.last_maintenance_date || null,
        last_maintenance_notes: formData.last_maintenance_notes || null,
        updated_at: Timestamp.now(),
      };

      if (editingCarId) {
        const existingCar = partnerCars.find(c => c.id === editingCarId);
        if (existingCar && (existingCar as any).partner_approved === true) {
          // Bewerking van goedgekeurde auto → wijzigingsverzoek
          await updateDoc(doc(db, 'cars', editingCarId), {
            ...carData,
            change_request_pending: true,
            change_request_message: 'Gegevens bijgewerkt via bewerk-formulier',
            change_request_at: new Date().toISOString(),
          });
          setSuccess('Wijzigingsverzoek ingediend. De admin beoordeelt je aanpassingen.');
        } else {
          // Herindiening van afgekeurde auto
          await updateDoc(doc(db, 'cars', editingCarId), {
            ...carData,
            partner_approved: null,
            partner_rejection_reason: null,
            resubmitted_at: new Date().toISOString(),
          });
          setSuccess('Auto opnieuw ingediend! De admin beoordeelt je aanvraag.');
        }
      } else {
        // Nieuwe aanmelding
        await addCar({
          ...carData,
          weekly_rate: 15,
          status: 'maintenance',
          published: false,
          submitted_by_partner: user.uid,
          created_by: user.uid,
        } as any);
        setSuccess('Auto aangemeld! De admin beoordeelt je aanvraag en stelt de verkoopprijs vast.');
      }

      setShowAddModal(false);
      setEditingCarId(null);
      setFormData(EMPTY_FORM);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  // Change requests now go through the edit form (openEditModal)

  const getStatusBadge = (car: any) => {
    if (car.change_request_pending) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <MessageSquare className="w-3 h-3" /> Wijziging in behandeling
        </span>
      );
    }
    if (car.partner_approved === false) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle className="w-3 h-3" /> Afgewezen
        </span>
      );
    }
    if (car.partner_approved == null) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <Clock className="w-3 h-3" /> In afwachting
        </span>
      );
    }
    if (car.status === 'rented') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Car className="w-3 h-3" /> Verhuurd
        </span>
      );
    }
    if (car.status === 'maintenance') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
          <Wrench className="w-3 h-3" /> Onderhoud
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        <CheckCircle className="w-3 h-3" /> Beschikbaar
      </span>
    );
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Mijn Auto's"
          subtitle="Beheer je aangemelde auto's"
          icon={Car}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-5xl mx-auto">

            {/* Success message */}
            {success && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-green-500/20" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                <span className="text-green-400 text-sm">{success}</span>
              </div>
            )}

            {/* Multi-car banner */}
            <div className="rounded-xl px-5 py-4 mb-5 border border-white/[0.08] flex items-center justify-between gap-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <p className="text-white text-sm font-medium">Meerdere auto's tegelijk aanmelden?</p>
                <p className="text-neutral-500 text-xs mt-0.5">Neem contact op en we regelen het direct voor je.</p>
              </div>
              <a
                href="mailto:support@vlottr.eu?subject=Meerdere auto's aanmelden&body=Hallo Vlottr team,%0A%0AIk wil graag meerdere auto's aanmelden.%0A%0APartner: ${user?.company_name || user?.name || ''}%0A%0ABeschrijving:%0A"
                className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white rounded-lg border border-white/[0.1] hover:bg-white/[0.05] transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Stuur een mail
              </a>
            </div>

            {/* Filter tabs */}
            {partnerCars.length > 0 && (() => {
              const pendingCount = partnerCars.filter(c => (c as any).partner_approved == null && !(c as any).change_request_pending).length;
              const approvedCount = partnerCars.filter(c => (c as any).partner_approved === true).length;
              const rejectedCount = partnerCars.filter(c => (c as any).partner_approved === false).length;
              const tabs = [
                { id: 'all' as const, icon: <List className="w-4 h-4" />, label: 'Alle', badge: partnerCars.length },
                { id: 'pending' as const, icon: <Clock className="w-4 h-4" />, label: 'In behandeling', badge: pendingCount },
                { id: 'approved' as const, icon: <CheckCircle className="w-4 h-4" />, label: 'Goedgekeurd', badge: approvedCount },
                { id: 'rejected' as const, icon: <XCircle className="w-4 h-4" />, label: 'Afgewezen', badge: rejectedCount },
              ];
              return (
                <div className="flex gap-2 flex-wrap mb-5">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setCarFilter(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        carFilter === tab.id
                          ? 'bg-green-500 text-neutral-950'
                          : 'text-neutral-400 hover:text-white border border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                          carFilter === tab.id ? 'bg-neutral-950/20 text-neutral-950' : 'bg-white/10 text-white'
                        }`}>{tab.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Add car button */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-neutral-400 text-sm">
                {partnerCars.length} auto{partnerCars.length !== 1 ? "'s" : ''} aangemeld
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Auto aanmelden
              </button>
            </div>

            {/* Cars list */}
            {partnerCars.length === 0 ? (
              <div className="vl-card rounded-xl p-12 text-center">
                <Car className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Nog geen auto's aangemeld</h3>
                <p className="text-neutral-500 text-sm mb-6">Meld je eerste auto aan om te starten.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-2.5 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Auto aanmelden
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {partnerCars.filter(car => {
                  if (carFilter === 'all') return true;
                  if (carFilter === 'pending') return (car as any).partner_approved == null && !(car as any).change_request_pending;
                  if (carFilter === 'approved') return (car as any).partner_approved === true;
                  if (carFilter === 'rejected') return (car as any).partner_approved === false;
                  return true;
                }).map(car => (
                  <div
                    key={car.id}
                    className="vl-card rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-white/20 transition-all"
                    onClick={() => { setSelectedCar(car); setDetailImgIndex(0); }}
                  >
                    {/* Car image */}
                    <div className="w-20 h-20 rounded-lg bg-neutral-800 flex-shrink-0 overflow-hidden">
                      {car.images && car.images[0] ? (
                        <img src={car.images[0]} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-8 h-8 text-neutral-600" />
                        </div>
                      )}
                    </div>

                    {/* Car info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {car.brand} {car.model} ({car.year})
                      </h3>
                      <p className="text-neutral-500 text-sm">{car.license_plate}</p>
                      <div className="mt-2">
                        {getStatusBadge(car)}
                      </div>
                    </div>

                    {/* Purchase price + actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-neutral-500">Verkoopprijs</div>
                        <div className="text-sm font-medium text-neutral-400">
                          {(car as any).purchase_price > 0
                            ? `€${Number((car as any).purchase_price).toLocaleString('nl-NL')}`
                            : 'Nog vast te stellen'}
                        </div>
                        {(car as any).repayment_percentage > 0 && (
                          <div className="text-xs text-green-400">{(car as any).repayment_percentage}% aflossing</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <Eye className="w-3.5 h-3.5" /> Bekijken
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

      {/* Detail Modal */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
          <div className="relative w-full max-w-2xl rounded-2xl shadow-2xl border border-white/[0.08] max-h-[92vh] overflow-y-auto" style={{ background: 'rgba(18,18,18,0.98)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] sticky top-0 z-10" style={{ background: 'rgba(18,18,18,0.98)' }}>
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedCar.brand} {selectedCar.model} ({selectedCar.year})</h2>
                <p className="text-xs text-neutral-500">{selectedCar.license_plate}</p>
              </div>
              <div className="flex items-center gap-2">
                {(selectedCar as any).partner_approved === true && !(selectedCar as any).change_request_pending && (
                  <button
                    onClick={() => { openEditModal(selectedCar); setSelectedCar(null); }}
                    className="px-3 py-1.5 text-sm font-medium text-white rounded-lg border border-white/[0.1] hover:bg-white/[0.05] transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Bewerken
                  </button>
                )}
                {(selectedCar as any).partner_approved === false && (
                  <button
                    onClick={() => { openEditModal(selectedCar); setSelectedCar(null); }}
                    className="px-3 py-1.5 text-sm font-medium text-orange-400 rounded-lg border border-orange-500/30 hover:bg-orange-500/10 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Aanpassen & opnieuw indienen
                  </button>
                )}
                <button onClick={() => setSelectedCar(null)} className="text-neutral-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Image gallery */}
              {selectedCar.images && selectedCar.images.length > 0 && (
                <div className="relative rounded-xl overflow-hidden bg-neutral-900" style={{ height: 260 }}>
                  <img src={selectedCar.images[detailImgIndex]} alt="" className="w-full h-full object-cover" />
                  {selectedCar.images.length > 1 && (
                    <>
                      <button onClick={() => setDetailImgIndex(i => (i - 1 + selectedCar.images.length) % selectedCar.images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <button onClick={() => setDetailImgIndex(i => (i + 1) % selectedCar.images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {selectedCar.images.map((_: string, i: number) => (
                          <button key={i} onClick={() => setDetailImgIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === detailImgIndex ? 'bg-white' : 'bg-white/30'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Status */}
              <div>{getStatusBadge(selectedCar)}</div>

              {(selectedCar as any).partner_approved === false && (selectedCar as any).partner_rejection_reason && (
                <div className="rounded-xl px-4 py-3 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <p className="text-sm text-red-400"><strong>Reden afwijzing:</strong> {(selectedCar as any).partner_rejection_reason}</p>
                </div>
              )}

              {(selectedCar as any).change_request_pending && (
                <div className="rounded-xl px-4 py-3 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.08)' }}>
                  <p className="text-sm text-blue-400"><strong>Wijzigingsverzoek:</strong> {(selectedCar as any).change_request_message}</p>
                </div>
              )}

              {/* Pricing */}
              <div className="vl-card rounded-xl p-4">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Financieel</h4>
                {(selectedCar as any).purchase_price > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-neutral-500 text-xs">Verkoopprijs</p>
                      <p className="text-white font-semibold text-lg flex items-center gap-1"><Euro className="w-4 h-4 text-green-400" />{Number((selectedCar as any).purchase_price).toLocaleString('nl-NL')}</p>
                    </div>
                    {(selectedCar as any).repayment_percentage > 0 && (
                      <div>
                        <p className="text-neutral-500 text-xs">Aflossing</p>
                        <p className="text-white font-semibold">{(selectedCar as any).repayment_percentage}% van verhuurinkomsten</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-sm">Verkoopprijs wordt door Vlottr vastgesteld na beoordeling van het voertuig.</p>
                )}
              </div>

              {/* Specs */}
              <div className="vl-card rounded-xl p-4">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Voertuiggegevens</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Merk', selectedCar.brand],
                    ['Model', selectedCar.model],
                    ['Bouwjaar', selectedCar.year],
                    ['Kenteken', selectedCar.license_plate],
                    ['Brandstof', selectedCar.specs?.fuel_type || '—'],
                    ['Transmissie', selectedCar.specs?.transmission || '—'],
                    ['Kleur', selectedCar.specs?.color || '—'],
                    ['Zitplaatsen', selectedCar.specs?.seats || '—'],
                    ['KM-stand', selectedCar.specs?.mileage ? `${Number(selectedCar.specs.mileage).toLocaleString('nl-NL')} km` : '—'],
                    ['Staat', selectedCar.specs?.condition || '—'],
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

              {/* Highlights */}
              {selectedCar.specs?.highlights?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCar.specs.highlights.map((h: string) => (
                    <span key={h} className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">{h}</span>
                  ))}
                </div>
              )}

              {/* Documents */}
              <div className="vl-card rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Documenten</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400 flex items-center gap-2"><Shield className="w-4 h-4 text-neutral-600" />Tenaamstelling</span>
                  {(selectedCar as any).vehicle_registration_url ? (
                    <a href={(selectedCar as any).vehicle_registration_url} target="_blank" rel="noopener noreferrer" className="text-green-400 text-xs hover:underline">Bekijken</a>
                  ) : <span className="text-neutral-600 text-xs">Niet geüpload</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400 flex items-center gap-2"><FileText className="w-4 h-4 text-neutral-600" />APK</span>
                  {(selectedCar as any).apk_expiry_date ? (
                    <span className="text-white text-xs">Vervalt: {(selectedCar as any).apk_expiry_date}</span>
                  ) : <span className="text-neutral-600 text-xs">Niet opgegeven</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Car Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
          <div className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl border border-white/[0.08] max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(18,18,18,0.98)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <h2 className="text-lg font-semibold text-white">{editingCarId ? 'Auto aanpassen & opnieuw indienen' : 'Auto aanmelden'}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingCarId(null); setFormData(EMPTY_FORM); }} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-xl px-4 py-3 border border-red-500/20" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Merk</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="vl-input"
                    placeholder="bijv. Volkswagen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    className="vl-input"
                    placeholder="bijv. Golf"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Bouwjaar</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="vl-input"
                    min={2000}
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Kenteken</label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={e => setFormData(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                    className="vl-input uppercase"
                    placeholder="AB-123-CD"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Brandstof</label>
                  <select
                    value={formData.specs.fuel_type}
                    onChange={e => setFormData(prev => ({ ...prev, specs: { ...prev.specs, fuel_type: e.target.value } }))}
                    className="vl-input"
                  >
                    <option value="">Selecteer</option>
                    <option value="Benzine">Benzine</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Elektrisch">Elektrisch</option>
                    <option value="Hybride">Hybride</option>
                    <option value="LPG">LPG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Transmissie</label>
                  <select
                    value={formData.specs.transmission}
                    onChange={e => setFormData(prev => ({ ...prev, specs: { ...prev.specs, transmission: e.target.value } }))}
                    className="vl-input"
                  >
                    <option value="">Selecteer</option>
                    <option value="Handgeschakeld">Handgeschakeld</option>
                    <option value="Automaat">Automaat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Kleur</label>
                  <input
                    type="text"
                    value={formData.specs.color}
                    onChange={e => setFormData(prev => ({ ...prev, specs: { ...prev.specs, color: e.target.value } }))}
                    className="vl-input"
                    placeholder="bijv. Zwart"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">KM-stand</label>
                  <input
                    type="number"
                    value={formData.specs.mileage}
                    onChange={e => setFormData(prev => ({ ...prev, specs: { ...prev.specs, mileage: e.target.value } }))}
                    className="vl-input"
                    placeholder="bijv. 120000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Zitplaatsen</label>
                  <input
                    type="number"
                    value={formData.specs.seats}
                    onChange={e => setFormData(prev => ({ ...prev, specs: { ...prev.specs, seats: parseInt(e.target.value) || 5 } }))}
                    className="vl-input"
                    min={2} max={9}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Deuren</label>
                  <input
                    type="number"
                    value={formData.specs.doors}
                    onChange={e => setFormData(prev => ({ ...prev, specs: { ...prev.specs, doors: parseInt(e.target.value) || 4 } }))}
                    className="vl-input"
                    min={2} max={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">Staat</label>
                  <select
                    value={formData.specs.condition}
                    onChange={e => setFormData(prev => ({ ...prev, specs: { ...prev.specs, condition: e.target.value } }))}
                    className="vl-input"
                  >
                    <option value="">Selecteer</option>
                    <option value="Nieuwstaat">Nieuwstaat</option>
                    <option value="Uitstekend">Uitstekend</option>
                    <option value="Goed">Goed</option>
                    <option value="Redelijk">Redelijk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Uitrusting</label>
                <div className="grid grid-cols-2 gap-2">
                  {HIGHLIGHTS_OPTIONS.map(opt => {
                    const hl: string[] = Array.isArray(formData.specs.highlights) ? formData.specs.highlights : [];
                    const checked = hl.includes(opt);
                    return (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked ? hl.filter(h => h !== opt) : [...hl, opt];
                            setFormData(prev => ({ ...prev, specs: { ...prev.specs, highlights: next } }));
                          }}
                          className="w-4 h-4 rounded accent-green-500"
                        />
                        <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">Beschrijving</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="vl-input"
                  rows={3}
                  placeholder="Korte beschrijving van de auto..."
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Foto's <span className="text-neutral-500">(optioneel)</span>
                </label>

                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/[0.08]">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/[0.15] cursor-pointer hover:border-green-500/30 transition-colors">
                  {uploadingImages ? (
                    <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-neutral-500" />
                  )}
                  <span className="text-sm text-neutral-400">
                    {uploadingImages ? 'Uploaden...' : "Foto's toevoegen"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                </label>
              </div>

              {/* Document uploads section */}
              <div className="border-t border-white/[0.08] pt-4 mt-2">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  Documenten & Historie
                </h3>

                {/* Tenaamstelling */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-white mb-1.5">
                    Bewijs tenaamstelling (kentekenbewijs)
                  </label>
                  {formData.vehicle_registration_url ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-green-500/20" style={{ background: 'rgba(34,197,94,0.05)' }}>
                      <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-green-400 text-sm truncate flex-1">Document geupload</span>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, vehicle_registration_url: '' }))} className="text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/[0.15] cursor-pointer hover:border-green-500/30 transition-colors">
                      {uploadingDoc === 'vehicle_registration_url' ? (
                        <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-neutral-500" />
                      )}
                      <span className="text-sm text-neutral-400">
                        {uploadingDoc === 'vehicle_registration_url' ? 'Uploaden...' : 'Upload kentekenbewijs'}
                      </span>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleDocUpload(e, 'vehicle_registration_url')} disabled={!!uploadingDoc} />
                    </label>
                  )}
                </div>

                {/* APK */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">APK vervaldatum</label>
                    <input
                      type="date"
                      value={formData.apk_expiry_date}
                      onChange={e => setFormData(prev => ({ ...prev, apk_expiry_date: e.target.value }))}
                      className="vl-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-1.5">APK document</label>
                    {formData.apk_document_url ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-green-500/20 h-[42px]" style={{ background: 'rgba(34,197,94,0.05)' }}>
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-green-400 text-xs truncate flex-1">Geupload</span>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, apk_document_url: '' }))} className="text-red-400 hover:text-red-300">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/[0.15] cursor-pointer hover:border-green-500/30 transition-colors h-[42px]">
                        {uploadingDoc === 'apk_document_url' ? (
                          <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-neutral-500" />
                        )}
                        <span className="text-xs text-neutral-400">
                          {uploadingDoc === 'apk_document_url' ? 'Uploaden...' : 'Upload APK'}
                        </span>
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => handleDocUpload(e, 'apk_document_url')} disabled={!!uploadingDoc} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Onderhoud historie */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-white mb-1.5 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-neutral-400" />
                    Onderhoud historie
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Laatst onderhoud</label>
                      <input
                        type="date"
                        value={formData.last_maintenance_date}
                        onChange={e => setFormData(prev => ({ ...prev, last_maintenance_date: e.target.value }))}
                        className="vl-input"
                      />
                    </div>
                  </div>
                  <textarea
                    value={formData.last_maintenance_notes}
                    onChange={e => setFormData(prev => ({ ...prev, last_maintenance_notes: e.target.value }))}
                    className="vl-input"
                    rows={2}
                    placeholder="Beschrijf het laatste onderhoud (bijv. olie vervangen, remmen gecontroleerd...)"
                  />
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-neutral-500 mb-4">
                  De verkoopprijs en aflossing worden door Vlottr vastgesteld na beoordeling van het voertuig.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="vl-btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Bezig...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      {editingCarId ? 'Opslaan & indienen' : 'Auto aanmelden'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PartnerCars;
