import React, { useState, useEffect } from 'react';
import { Wrench, Save, Loader2, CheckCircle } from 'lucide-react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';

const GARAGE_SERVICES = [
  { id: 'olie_verversen', label: 'Olie verversen', category: 'Onderhoud' },
  { id: 'remmen', label: 'Remmen vervangen/controleren', category: 'Onderhoud' },
  { id: 'banden', label: 'Banden wisselen/uitlijnen', category: 'Onderhoud' },
  { id: 'apk_keuring', label: 'APK keuring', category: 'Onderhoud' },
  { id: 'grote_beurt', label: 'Grote beurt', category: 'Onderhoud' },
  { id: 'kleine_beurt', label: 'Kleine beurt', category: 'Onderhoud' },
  { id: 'airco_service', label: 'Airco service', category: 'Onderhoud' },
  { id: 'distributieriem', label: 'Distributieriem vervangen', category: 'Reparatie' },
  { id: 'uitlaat', label: 'Uitlaat reparatie/vervanging', category: 'Reparatie' },
  { id: 'motor_diagnose', label: 'Motor diagnose / storing uitlezen', category: 'Reparatie' },
  { id: 'koppeling', label: 'Koppeling vervangen', category: 'Reparatie' },
  { id: 'schade_herstel', label: 'Schade herstel / carrosserie', category: 'Reparatie' },
  { id: 'lak_spuitwerk', label: 'Lak & spuitwerk', category: 'Reparatie' },
  { id: 'elektra', label: 'Elektrische storingen', category: 'Reparatie' },
  { id: 'accu', label: 'Accu vervangen', category: 'Overig' },
  { id: 'ruitenwissers', label: 'Ruitenwissers vervangen', category: 'Overig' },
  { id: 'interieur_reiniging', label: 'Interieur reiniging', category: 'Overig' },
  { id: 'exterieur_reiniging', label: 'Exterieur reiniging / polijsten', category: 'Overig' },
  { id: 'winterklaar', label: 'Auto winterklaar maken', category: 'Overig' },
  { id: 'ophaal_service', label: 'Ophaal- en brengservice', category: 'Overig' },
];

const categories = ['Onderhoud', 'Reparatie', 'Overig'];

const PartnerWerkplaats: React.FC = () => {
  const { user } = useAuth();
  const { initializeAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    if (user?.garage_services) {
      setSelectedServices(user.garage_services);
    }
  }, [user]);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        garage_services: selectedServices,
        updated_at: Timestamp.now(),
      });

      await initializeAuth();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving garage services:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Werkplaats"
          subtitle="Geef aan welke diensten je aanbiedt"
          icon={Wrench}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-3xl mx-auto">

            {success && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-green-500/20" style={{ background: 'rgba(34, 197, 94, 0.08)' }}>
                <span className="text-green-400 text-sm">Werkplaats diensten opgeslagen!</span>
              </div>
            )}

            <p className="text-neutral-400 text-sm mb-6">
              Selecteer de werkzaamheden die je werkplaats aanbiedt. Dit helpt ons om onderhoud aan verhuurde auto's bij jou te plannen.
            </p>

            {categories.map(category => {
              const services = GARAGE_SERVICES.filter(s => s.category === category);
              return (
                <div key={category} className="mb-6">
                  <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">{category}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {services.map(service => {
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleService(service.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                            isSelected
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-white/[0.06] hover:border-white/[0.12]'
                          }`}
                          style={{ background: isSelected ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)' }}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? 'border-green-500 bg-green-500' : 'border-white/20'
                          }`}>
                            {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-neutral-400'}`}>
                            {service.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between mt-8">
              <span className="text-sm text-neutral-500">
                {selectedServices.length} dienst{selectedServices.length !== 1 ? 'en' : ''} geselecteerd
              </span>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 bg-green-500 text-neutral-950 font-bold rounded-lg hover:bg-green-400 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Opslaan
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

export default PartnerWerkplaats;
