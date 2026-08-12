import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Car, Clock, Building2, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPartner = user?.role === 'partner';

  // Redirect if user is already approved
  React.useEffect(() => {
    if (user?.verification_status === 'approved') {
      navigate(isPartner ? '/partner' : '/dashboard', { replace: true });
    }
  }, [user?.verification_status, navigate, isPartner]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--vl-bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="vl-card p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>

          {/* Thank You Message */}
          <h1 className="text-2xl font-bold text-white mb-3">
            {isPartner ? 'Bedankt voor je aanmelding als partner!' : 'Bedankt voor je registratie! 🎉'}
          </h1>

          <p className="text-neutral-400 mb-6">
            {isPartner
              ? 'Je partneraanmelding wordt zo snel mogelijk beoordeeld door het Vlottr team.'
              : 'Je account wordt zo snel mogelijk goedgekeurd door ons team.'}
          </p>

          {/* Status Info */}
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-blue-300 font-bold text-sm mb-1">
                  {isPartner ? 'Aanmelding in behandeling' : 'Account in behandeling'}
                </p>
                <p className="text-blue-200 text-sm">
                  {isPartner
                    ? 'Je ontvangt een e-mail zodra je partneraccount is goedgekeurd. Daarna kun je direct auto\'s aanmelden.'
                    : 'Je ontvangt een e-mail zodra je account is goedgekeurd en je kunt beginnen met huren.'}
                </p>
              </div>
            </div>
          </div>

          {/* Teaser */}
          {isPartner ? (
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-white font-bold text-sm mb-1">
                    Wat kun je als partner?
                  </p>
                  <p className="text-neutral-400 text-sm">
                    Meld auto's aan, beheer je bedrijfsprofiel en bekijk contracten via je eigen dashboard.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-white font-bold text-sm mb-1">
                    Bekijk alvast onze auto's!
                  </p>
                  <p className="text-neutral-400 text-sm">
                    Je kunt alvast kijken naar ons aanbod en op de wachtlijst plaatsen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CTA Button */}
          {isPartner ? (
            <button
              onClick={() => navigate('/partner/business')}
              className="vl-btn-primary w-full"
            >
              <Building2 className="w-5 h-5" />
              Profiel bekijken
            </button>
          ) : (
            <button
              onClick={() => navigate('/cars')}
              className="vl-btn-primary w-full"
            >
              <Car className="w-5 h-5" />
              Auto's bekijken
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
