import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Calendar, Mail, CreditCard, FileText, Camera, Shield, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import { User as UserType } from '../../types';
import CollapsibleSection from '../common/CollapsibleSection';

interface UserProfileModalProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerification?: (userId: string) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onNavigateToVerification }) => {
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (enlargedPhoto) {
          setEnlargedPhoto(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, enlargedPhoto]);

  if (!isOpen || !user) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="vl-badge vl-badge-red">Admin</span>;
      case 'manager':
        return <span className="vl-badge vl-badge-blue">Manager</span>;
      case 'customer':
        return <span className="vl-badge vl-badge-neutral">Klant</span>;
      case 'partner':
        return <span className="vl-badge vl-badge-yellow">Partner</span>;
      default:
        return <span className="vl-badge vl-badge-neutral">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle className="w-3 h-3" />
            Geverifieerd
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Clock className="w-3 h-3" />
            In afwachting
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3" />
            Afgewezen
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const fullAddress = [
    user.address,
    // Fallback: try structured fields if address is empty
    ...(!user.address ? [
      [(user as any).street, (user as any).house_number].filter(Boolean).join(' '),
      [(user as any).postal_code, (user as any).city].filter(Boolean).join(' ')
    ].filter(Boolean) : [])
  ].filter(Boolean).join(', ');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl border border-white/[0.1] overflow-hidden"
          style={{ background: 'var(--vl-bg-elevated)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/[0.1]" style={{ background: 'var(--vl-bg-elevated)' }}>
            <h2 className="text-lg font-bold text-white">Gebruikersprofiel</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
            {/* User Header (not collapsible) */}
            <div className="flex items-center gap-4">
              {user.profile_photo ? (
                <button
                  onClick={() => setEnlargedPhoto(user.profile_photo!)}
                  className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-green-500 transition-all cursor-zoom-in"
                >
                  <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
                </button>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 text-2xl font-bold flex-shrink-0">
                  {user.name?.substring(0, 2).toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-white truncate">{user.name || 'Geen naam'}</h3>
                <p className="text-sm text-neutral-400 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {getRoleBadge(user.role)}
                  {getStatusBadge(user.verification_status || 'pending')}
                </div>
              </div>
            </div>

            {/* Persoonlijke gegevens */}
            <CollapsibleSection title="Persoonlijke gegevens" icon={<User className="w-4 h-4" />} defaultOpen={true}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Naam</p>
                  <p className="text-sm text-white">{user.name || 'Niet opgegeven'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail</p>
                  <p className="text-sm text-white break-all">{user.email || 'Niet opgegeven'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Telefoon</p>
                  <p className="text-sm text-white">{user.phone || 'Niet opgegeven'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adres</p>
                  <p className="text-sm text-white">{fullAddress || 'Niet opgegeven'}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Geboortedatum</p>
                  <p className="text-sm text-white">
                    {user.date_of_birth ? formatDate(user.date_of_birth) : 'Niet opgegeven'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Aangemeld op</p>
                  <p className="text-sm text-white">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </CollapsibleSection>

            {/* Rijbewijs */}
            <CollapsibleSection
              title="Rijbewijs"
              icon={<CreditCard className="w-4 h-4" />}
              defaultOpen={false}
              badge={
                (user.driver_license?.verified || (user.driver_license && user.verification_status === 'approved'))
                  ? <span className="text-xs text-green-400 ml-2">Geverifieerd</span>
                  : user.driver_license
                    ? <span className="text-xs text-yellow-400 ml-2">In behandeling</span>
                    : <span className="text-xs text-neutral-500 ml-2">Geen</span>
              }
            >
              {!user.driver_license ? (
                <p className="text-sm text-neutral-500">Geen rijbewijs geüpload</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Rijbewijsnummer</p>
                      <p className="text-sm text-white font-mono">{user.driver_license.number || 'Niet opgegeven'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Naam</p>
                      <p className="text-sm text-white">
                        {[user.driver_license.first_name, user.driver_license.last_name].filter(Boolean).join(' ') || 'Niet opgegeven'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Vervaldatum</p>
                      <p className={`text-sm ${
                        user.driver_license.expiry_date && new Date(user.driver_license.expiry_date) < new Date()
                          ? 'text-red-400'
                          : 'text-white'
                      }`}>
                        {user.driver_license.expiry_date ? formatDate(user.driver_license.expiry_date) : 'Niet opgegeven'}
                        {user.driver_license.expiry_date && new Date(user.driver_license.expiry_date) < new Date() && ' (VERLOPEN)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Afgiftedatum</p>
                      <p className="text-sm text-white">
                        {user.driver_license.issue_date ? formatDate(user.driver_license.issue_date) : 'Niet opgegeven'}
                      </p>
                    </div>
                  </div>

                  {/* License images */}
                  {(user.driver_license.front_image_url || user.driver_license.back_image_url) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {user.driver_license.front_image_url && (
                        <div>
                          <p className="text-xs text-neutral-500 mb-2">Voorkant</p>
                          <button
                            onClick={() => setEnlargedPhoto(user.driver_license!.front_image_url!)}
                            className="w-full rounded-lg overflow-hidden border border-white/[0.06] hover:border-green-500/30 transition-colors cursor-zoom-in"
                          >
                            <img
                              src={user.driver_license.front_image_url}
                              alt="Voorkant rijbewijs"
                              className="w-full h-32 object-cover"
                            />
                          </button>
                        </div>
                      )}
                      {user.driver_license.back_image_url && (
                        <div>
                          <p className="text-xs text-neutral-500 mb-2">Achterkant</p>
                          <button
                            onClick={() => setEnlargedPhoto(user.driver_license!.back_image_url!)}
                            className="w-full rounded-lg overflow-hidden border border-white/[0.06] hover:border-green-500/30 transition-colors cursor-zoom-in"
                          >
                            <img
                              src={user.driver_license.back_image_url}
                              alt="Achterkant rijbewijs"
                              className="w-full h-32 object-cover"
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CollapsibleSection>

            {/* Loonstroken */}
            <CollapsibleSection
              title="Loonstroken"
              icon={<FileText className="w-4 h-4" />}
              defaultOpen={false}
              badge={
                user.salary_slips && user.salary_slips.length > 0
                  ? <span className={`text-xs ml-2 ${user.salary_slips.length >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {user.salary_slips.length}/3
                    </span>
                  : <span className="text-xs text-neutral-500 ml-2">Geen</span>
              }
            >
              {!user.salary_slips || user.salary_slips.length === 0 ? (
                <p className="text-sm text-neutral-500">Geen loonstroken geüpload</p>
              ) : (
                <div className="space-y-2">
                  {user.salary_slips.map((slip, index) => (
                    <a
                      key={index}
                      href={slip}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                    >
                      <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-white flex-1">Loonstrook {index + 1}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                    </a>
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* Profielfoto */}
            <CollapsibleSection title="Profielfoto" icon={<Camera className="w-4 h-4" />} defaultOpen={false}>
              {!user.profile_photo ? (
                <p className="text-sm text-neutral-500">Geen profielfoto</p>
              ) : (
                <button
                  onClick={() => setEnlargedPhoto(user.profile_photo!)}
                  className="rounded-xl overflow-hidden border border-white/[0.06] hover:border-green-500/30 transition-colors cursor-zoom-in"
                >
                  <img
                    src={user.profile_photo}
                    alt={user.name}
                    className="w-full max-w-xs h-auto object-cover rounded-xl"
                  />
                </button>
              )}
            </CollapsibleSection>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-white/[0.1]" style={{ background: 'var(--vl-bg-elevated)' }}>
            {onNavigateToVerification && user.role === 'customer' && (
              <button
                onClick={() => onNavigateToVerification(user.uid)}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 text-neutral-300 rounded-lg hover:border-white/20 hover:text-white transition-colors"
              >
                <Shield className="w-4 h-4" />
                Naar verificatie
              </button>
            )}
            <button
              onClick={onClose}
              className="vl-btn-primary"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>

      {/* Photo Lightbox (above modal) */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div className="relative max-w-2xl w-full">
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={enlargedPhoto}
              alt="Foto"
              className="w-full h-auto rounded-xl border border-white/[0.1] max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfileModal;
