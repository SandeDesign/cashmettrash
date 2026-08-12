import React from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { DriverLicense } from '../../types';

interface DriverLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverLicense: DriverLicense | null | undefined;
  userName: string;
}

const DriverLicenseModal: React.FC<DriverLicenseModalProps> = ({
  isOpen,
  onClose,
  driverLicense,
  userName
}) => {
  if (!isOpen) return null;

  if (!driverLicense) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="vl-card max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Rijbewijs - {userName}
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-neutral-400">Geen rijbewijs geüpload</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="vl-card max-w-4xl w-full p-4 lg:p-6 my-4 lg:my-8 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-400" />
            Rijbewijs - {userName}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* License Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <div>
            <p className="text-sm text-neutral-500">Rijbewijsnummer</p>
            <p className="font-medium text-white">{driverLicense.number || 'Niet beschikbaar'}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Naam</p>
            <p className="font-medium text-white">
              {driverLicense.first_name} {driverLicense.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Geboortedatum</p>
            <p className="font-medium text-white">
              {driverLicense.date_of_birth ? new Date(driverLicense.date_of_birth).toLocaleDateString('nl-NL') : 'Niet beschikbaar'}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Geldig tot</p>
            <p className="font-medium text-white">
              {driverLicense.expiry_date ? new Date(driverLicense.expiry_date).toLocaleDateString('nl-NL') : 'Niet beschikbaar'}
            </p>
          </div>
        </div>

        {/* License Images */}
        <div className="space-y-6">
          {/* Front Image */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center text-green-400 text-sm font-bold">
                V
              </span>
              Voorkant
            </h3>
            {driverLicense.front_image_url ? (
              <div className="bg-black/40 border border-white/[0.06] rounded-lg overflow-hidden">
                <img
                  src={driverLicense.front_image_url}
                  alt="Rijbewijs voorkant"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-neutral-400">Voorkant niet beschikbaar</p>
              </div>
            )}
          </div>

          {/* Back Image */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center text-green-400 text-sm font-bold">
                A
              </span>
              Achterkant
            </h3>
            {driverLicense.back_image_url ? (
              <div className="bg-black/40 border border-white/[0.06] rounded-lg overflow-hidden">
                <img
                  src={driverLicense.back_image_url}
                  alt="Rijbewijs achterkant"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-neutral-400">Achterkant niet beschikbaar</p>
              </div>
            )}
          </div>
        </div>

        {/* Verification Status */}
        <div className="mt-6 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-500">Verificatie status</p>
              <p className="font-medium text-white">
                {driverLicense.verified ? (
                  <span className="text-green-400">✓ Geverifieerd</span>
                ) : (
                  <span className="text-yellow-500">⏳ In afwachting van verificatie</span>
                )}
              </p>
            </div>
            {driverLicense.verified && driverLicense.verified_at && (
              <div className="lg:text-right">
                <p className="text-sm text-neutral-500">Geverifieerd op</p>
                <p className="text-sm text-neutral-400">
                  {new Date(driverLicense.verified_at).toLocaleDateString('nl-NL')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLicenseModal;
