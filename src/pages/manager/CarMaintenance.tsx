import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Car as CarIcon,
  Wrench,
  FileText,
  Calendar,
  Upload,
  Download,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Shield
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useCarStore } from '../../store/carStore';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const CarMaintenance: React.FC = () => {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const { cars, fetchCars } = useCarStore();

  const [car, setCar] = useState(cars.find(c => c.id === carId));
  const [loading, setLoading] = useState(!car);
  const [saving, setSaving] = useState(false);

  // Form state
  const [apkExpiryDate, setApkExpiryDate] = useState(car?.apk_expiry_date || '');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState(car?.insurance_expiry_date || '');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(car?.last_maintenance_date || '');
  const [lastMaintenanceNotes, setLastMaintenanceNotes] = useState(car?.last_maintenance_notes || '');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(car?.next_maintenance_date || '');

  useEffect(() => {
    if (!car && carId) {
      fetchCars().then(() => {
        const foundCar = cars.find(c => c.id === carId);
        if (foundCar) {
          setCar(foundCar);
          setApkExpiryDate(foundCar.apk_expiry_date || '');
          setInsuranceExpiryDate(foundCar.insurance_expiry_date || '');
          setLastMaintenanceDate(foundCar.last_maintenance_date || '');
          setLastMaintenanceNotes(foundCar.last_maintenance_notes || '');
          setNextMaintenanceDate(foundCar.next_maintenance_date || '');
        }
        setLoading(false);
      });
    }
  }, [carId, car, cars, fetchCars]);

  const handleSave = async () => {
    if (!carId) return;

    setSaving(true);
    try {
      const carRef = doc(db, 'cars', carId);
      await updateDoc(carRef, {
        apk_expiry_date: apkExpiryDate || null,
        insurance_expiry_date: insuranceExpiryDate || null,
        last_maintenance_date: lastMaintenanceDate || null,
        last_maintenance_notes: lastMaintenanceNotes || null,
        next_maintenance_date: nextMaintenanceDate || null,
        updated_at: serverTimestamp(),
      });

      alert('Onderhoudsgegevens succesvol opgeslagen!');
      await fetchCars();
    } catch (error) {
      console.error('Error saving maintenance data:', error);
      alert('Fout bij opslaan. Probeer opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  const isApkExpired = (date: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isApkExpiringSoon = (date: string) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-400" />
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <CarIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400">Auto niet gevonden</p>
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
        <Header
          title="Onderhoudsprofiel"
          subtitle={`${car.brand} ${car.model} (${car.year}) - ${car.license_plate}`}
          icon={Wrench}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/manager/cars')}
              className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Terug naar auto's
            </button>

            {/* APK Status Alert */}
            {apkExpiryDate && (
              <div className={`mb-6 p-4 rounded-lg border ${
                isApkExpired(apkExpiryDate)
                  ? 'bg-red-500/10 border-red-500/20'
                  : isApkExpiringSoon(apkExpiryDate)
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-green-500/10 border-green-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  {isApkExpired(apkExpiryDate) ? (
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  ) : isApkExpiringSoon(apkExpiryDate) ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold ${
                      isApkExpired(apkExpiryDate)
                        ? 'text-red-400'
                        : isApkExpiringSoon(apkExpiryDate)
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}>
                      {isApkExpired(apkExpiryDate)
                        ? 'APK is verlopen!'
                        : isApkExpiringSoon(apkExpiryDate)
                        ? 'APK verloopt binnenkort'
                        : 'APK is geldig'}
                    </p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Vervaldatum: {new Date(apkExpiryDate).toLocaleDateString('nl-NL', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* APK Information */}
              <div className="vl-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-white">APK Informatie</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      APK Vervaldatum
                    </label>
                    <input
                      type="date"
                      value={apkExpiryDate}
                      onChange={(e) => setApkExpiryDate(e.target.value)}
                      className="vl-input"
                    />
                  </div>

                  {car.apk_document_url && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">
                        APK Keuringsbewijs
                      </label>
                      <a
                        href={car.apk_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vl-btn-secondary text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download APK
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Insurance Information */}
              <div className="vl-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-white">Verzekering</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Verzekering Vervaldatum
                    </label>
                    <input
                      type="date"
                      value={insuranceExpiryDate}
                      onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                      className="vl-input"
                    />
                  </div>

                  {car.insurance_document_url && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">
                        Verzekeringsbewijs
                      </label>
                      <a
                        href={car.insurance_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vl-btn-secondary text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download Verzekering
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Information */}
              <div className="vl-card p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-white">Onderhoudsgegevens</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Laatste Onderhoudsbeurt
                    </label>
                    <input
                      type="date"
                      value={lastMaintenanceDate}
                      onChange={(e) => setLastMaintenanceDate(e.target.value)}
                      className="vl-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Volgende Onderhoudsbeurt
                    </label>
                    <input
                      type="date"
                      value={nextMaintenanceDate}
                      onChange={(e) => setNextMaintenanceDate(e.target.value)}
                      className="vl-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-400 mb-2">
                      Opmerkingen Laatste Onderhoudsbeurt
                    </label>
                    <textarea
                      value={lastMaintenanceNotes}
                      onChange={(e) => setLastMaintenanceNotes(e.target.value)}
                      rows={4}
                      className="vl-input resize-none"
                      placeholder="Bijv. olie vervangen, remmen gecontroleerd..."
                    />
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="vl-card p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-white">Documenten voor Klant</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {car.groene_kaart_url && (
                    <a
                      href={car.groene_kaart_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-white/[0.1] rounded-lg hover:bg-white/[0.02] transition-colors"
                    >
                      <FileText className="w-8 h-8 text-green-400 mb-2" />
                      <p className="text-sm font-medium text-white">Groene Kaart</p>
                      <p className="text-xs text-neutral-500 mt-1">Verzekeringsbewijs</p>
                    </a>
                  )}

                  {car.rdw_verklaring_url && (
                    <a
                      href={car.rdw_verklaring_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-white/[0.1] rounded-lg hover:bg-white/[0.02] transition-colors"
                    >
                      <FileText className="w-8 h-8 text-green-400 mb-2" />
                      <p className="text-sm font-medium text-white">RDW Verklaring</p>
                      <p className="text-xs text-neutral-500 mt-1">Registratiebewijs</p>
                    </a>
                  )}

                  {car.vehicle_registration_url && (
                    <a
                      href={car.vehicle_registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 border border-white/[0.1] rounded-lg hover:bg-white/[0.02] transition-colors"
                    >
                      <FileText className="w-8 h-8 text-green-400 mb-2" />
                      <p className="text-sm font-medium text-white">Kentekenbewijs</p>
                      <p className="text-xs text-neutral-500 mt-1">Voertuigregistratie</p>
                    </a>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-400 font-medium mb-2">
                    📋 Voor klanten bij controle
                  </p>
                  <p className="text-xs text-neutral-400">
                    Deze documenten zijn beschikbaar voor klanten via hun dashboard.
                    Bij controle door politie kunnen zij deze direct tonen.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="vl-btn-primary px-6 py-3"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Wijzigingen Opslaan
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default CarMaintenance;
