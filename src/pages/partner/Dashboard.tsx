import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Building2, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { usePartnerStore } from '../../store/partnerStore';

const PartnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { partnerCars, partnerContracts, fetchPartnerCars, fetchPartnerContracts } = usePartnerStore();

  useEffect(() => {
    if (user) {
      fetchPartnerCars(user.uid);
      fetchPartnerContracts(user.uid);
    }
  }, [user, fetchPartnerCars, fetchPartnerContracts]);

  const pendingCars = partnerCars.filter(c => !c.partner_approved);
  const approvedCars = partnerCars.filter(c => c.partner_approved);
  const pendingContracts = partnerContracts.filter(c => c.status === 'pending');
  const isPending = user?.verification_status === 'pending';

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Partner Dashboard"
          subtitle={user?.company_name || 'Welkom'}
          icon={Building2}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-5xl mx-auto">

            {/* Pending approval banner */}
            {isPending && (
              <div className="rounded-xl px-5 py-4 mb-6 border border-yellow-500/20 flex items-start gap-3" style={{ background: 'rgba(234, 179, 8, 0.08)' }}>
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-semibold text-sm">Aanmelding in behandeling</p>
                  <p className="text-neutral-400 text-sm mt-1">
                    Je partneraanmelding wordt beoordeeld door het Vlottr team. Je ontvangt een e-mail zodra je account is goedgekeurd.
                  </p>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <button
                onClick={() => navigate('/partner/cars')}
                className="vl-card vl-card-accent rounded-xl p-5 text-left hover:border-green-500/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{partnerCars.length}</div>
                <div className="text-xs text-neutral-500 mt-1">Aangemelde auto's</div>
              </button>

              <button
                onClick={() => navigate('/partner/cars')}
                className="vl-card vl-card-accent rounded-xl p-5 text-left hover:border-green-500/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{pendingCars.length}</div>
                <div className="text-xs text-neutral-500 mt-1">In afwachting</div>
              </button>

              <button
                onClick={() => navigate('/partner/cars')}
                className="vl-card vl-card-accent rounded-xl p-5 text-left hover:border-green-500/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{approvedCars.length}</div>
                <div className="text-xs text-neutral-500 mt-1">Goedgekeurd</div>
              </button>

              <button
                onClick={() => navigate('/partner/documents')}
                className="vl-card vl-card-accent rounded-xl p-5 text-left hover:border-green-500/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{partnerContracts.length}</div>
                <div className="text-xs text-neutral-500 mt-1">Contracten</div>
              </button>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/partner/cars')}
                className="vl-card rounded-xl p-6 text-left hover:border-green-500/20 transition-all group"
              >
                <Car className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-semibold mb-1">Auto's beheren</h3>
                <p className="text-neutral-500 text-sm">Bekijk je aangemelde auto's of meld een nieuwe auto aan.</p>
              </button>

              <button
                onClick={() => navigate('/partner/business')}
                className="vl-card rounded-xl p-6 text-left hover:border-green-500/20 transition-all group"
              >
                <Building2 className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-semibold mb-1">Bedrijfsgegevens</h3>
                <p className="text-neutral-500 text-sm">Vul je bedrijfsgegevens aan en upload je logo.</p>
              </button>

              <button
                onClick={() => navigate('/partner/documents')}
                className="vl-card rounded-xl p-6 text-left hover:border-green-500/20 transition-all group"
              >
                <FileText className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-white font-semibold mb-1">Documenten</h3>
                <p className="text-neutral-500 text-sm">Bekijk je contracten en partnerovereenkomsten.</p>
              </button>
            </div>

          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default PartnerDashboard;
