import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { logUserVerified } from '../../utils/logger';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Check,
  X,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink
} from 'lucide-react';

const UserVerification: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Checklist state
  const [checklist, setChecklist] = useState({
    photoMatch: false,
    validExpiry: false,
    licenseMinThreeYears: false,
    correctDetails: false,
    physicalCheck: false,
    noForgery: false,
    salarySlipsReceived: false
  });

  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', userId!));

      if (userDoc.exists()) {
        const data = userDoc.data() as User;
        setUserData({ ...data, uid: userDoc.id });
      } else {
        setError('Gebruiker niet gevonden');
      }
    } catch (err: any) {
      console.error('Error loading user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const allChecked = Object.values(checklist).every(v => v);

  const handleSubmit = async (status: 'approved' | 'rejected') => {
    if (status === 'approved' && !allChecked) {
      setError('Voltooi alle verificatie checks voordat je goedkeurt');
      return;
    }

    if (status === 'rejected' && !rejectionReason.trim()) {
      setError('Geef een reden op voor afwijzing');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await updateDoc(doc(db, 'users', userId!), {
        verification_status: status,
        verified_at: new Date().toISOString(),
        verified_by: currentUser?.uid,
        rejection_reason: status === 'rejected' ? rejectionReason : null,
        ...(status === 'approved' && userData?.driver_license ? { 'driver_license.verified': true } : {}),
        updated_at: new Date().toISOString()
      });

      // Log the verification
      if (currentUser && userData) {
        logUserVerified(
          currentUser.uid,
          currentUser.name,
          currentUser.email,
          userData.uid,
          userData.name,
          status
        );
      }

      // Navigate back
      navigate('/admin/users');
    } catch (err: any) {
      console.error('Error updating verification:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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

  if (error && !userData) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Fout opgetreden</h2>
              <p className="text-neutral-500 mb-4">{error}</p>
              <button onClick={() => navigate('/admin/users')} className="vl-btn-secondary">
                <ArrowLeft className="w-4 h-4" />
                Terug naar gebruikers
              </button>
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
        <Header />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/admin/users')}
                className="vl-btn-ghost mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug naar gebruikers
              </button>
              <h1 className="text-2xl font-bold text-white mb-2">
                Gebruikersverificatie
              </h1>
              <p className="text-neutral-500">
                Controleer rijbewijs en gebruikersgegevens voor verificatie
              </p>
            </div>

            {error && (
              <div className="vl-alert vl-alert-error mb-6">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Main Grid: User Info + Rijbewijs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* User Info */}
              <div className="vl-card p-4 lg:p-6">
                <h2 className="text-lg font-bold text-white mb-4">Gebruikersgegevens</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-neutral-500">Naam</p>
                    <p className="text-white font-medium">{userData?.name || 'Niet opgegeven'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Email</p>
                    <p className="text-white font-medium">{userData?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Telefoon</p>
                    <p className="text-white font-medium">{userData?.phone || 'Niet opgegeven'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Adres</p>
                    <p className="text-white font-medium">{userData?.address || 'Niet opgegeven'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Geboortedatum</p>
                    <p className="text-white font-medium">
                      {userData?.date_of_birth
                        ? new Date(userData.date_of_birth).toLocaleDateString('nl-NL')
                        : 'Niet opgegeven'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver License */}
              {userData?.driver_license && (
                <div className="vl-card p-4 lg:p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Rijbewijs
                  </h2>

                  {/* Basic Info */}
                  <div className="space-y-3 mb-4 text-sm">
                    <div>
                      <p className="text-xs text-neutral-500">Rijbewijsnummer</p>
                      <p className="text-white font-medium vl-font-mono">{userData.driver_license.number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Naam</p>
                      <p className="text-white font-medium">{userData.driver_license.first_name} {userData.driver_license.last_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Geboortedatum</p>
                      <p className="text-white font-medium">{new Date(userData.driver_license.date_of_birth).toLocaleDateString('nl-NL')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Vervaldatum</p>
                      <p className={`font-medium ${new Date(userData.driver_license.expiry_date) < new Date() ? 'text-red-500' : 'text-white'}`}>
                        {new Date(userData.driver_license.expiry_date).toLocaleDateString('nl-NL')}
                        {new Date(userData.driver_license.expiry_date) < new Date() && <span className="ml-1 text-xs">(VERLOPEN!)</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Afgiftedatum</p>
                      {userData.driver_license.issue_date ? (
                        <p className={`font-medium ${(() => {
                          const issue = new Date(userData.driver_license.issue_date);
                          const threeYearsAgo = new Date();
                          threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
                          return issue > threeYearsAgo ? 'text-red-500' : 'text-white';
                        })()}`}>
                          {new Date(userData.driver_license.issue_date).toLocaleDateString('nl-NL')}
                          {(() => {
                            const issue = new Date(userData.driver_license.issue_date);
                            const threeYearsAgo = new Date();
                            threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
                            return issue > threeYearsAgo ? <span className="ml-1 text-xs">(MINDER DAN 3 JAAR!)</span> : null;
                          })()}
                        </p>
                      ) : (
                        <p className="font-medium text-yellow-500">
                          Niet ingevuld <span className="text-xs">(VERPLICHT VOOR VERZEKERING)</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rijbewijs Images - Full Width */}
            {userData?.driver_license && (
              <div className="vl-card p-4 lg:p-6 mb-6">
                <h3 className="text-md font-bold text-white mb-4">Rijbewijs Foto's</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userData.driver_license.front_image_url && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-2">Voorkant</p>
                      <img
                        src={userData.driver_license.front_image_url}
                        alt="Voorkant rijbewijs"
                        className="w-full rounded-lg border border-white/[0.1]"
                      />
                    </div>
                  )}

                  {userData.driver_license.back_image_url && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-2">Achterkant</p>
                      <img
                        src={userData.driver_license.back_image_url}
                        alt="Achterkant rijbewijs"
                        className="w-full rounded-lg border border-white/[0.1]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Salary Slips */}
            {(() => {
              const slips: string[] = (userData as any)?.salary_slips || [];
              return (
                <div className="vl-card p-4 lg:p-6 mb-6">
                  <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Loonstroken ({slips.length}/3)
                  </h3>
                  {slips.length === 0 ? (
                    <p className="text-sm text-neutral-500">Geen loonstroken geüpload.</p>
                  ) : (
                    <div className="space-y-2">
                      {slips.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-lg border border-white/[0.1] hover:border-white/20 hover:bg-white/[0.02] transition-colors text-sm text-green-400 hover:text-green-300"
                        >
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="flex-1 truncate">Loonstrook {index + 1}</span>
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Verification Checklist */}
            <div className="vl-card p-4 lg:p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-3">Verificatie Checklist</h2>
              <p className="text-sm text-neutral-500 mb-4">
                Controleer alle punten voordat je de gebruiker goedkeurt
              </p>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.photoMatch}
                    onChange={(e) => setChecklist({ ...checklist, photoMatch: e.target.checked })}
                    className="mt-0.5 w-5 h-5 rounded border-white/[0.1] text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-transparent"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Foto komt overeen met persoon</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.validExpiry}
                    onChange={(e) => setChecklist({ ...checklist, validExpiry: e.target.checked })}
                    className="mt-0.5 w-5 h-5 rounded border-white/[0.1] text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-transparent"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Rijbewijs is geldig (niet verlopen)</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.licenseMinThreeYears}
                    onChange={(e) => setChecklist({ ...checklist, licenseMinThreeYears: e.target.checked })}
                    className="mt-0.5 w-5 h-5 rounded border-white/[0.1] text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-transparent"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Rijbewijs minimaal 3 jaar in bezit (verzekeringseis)</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.correctDetails}
                    onChange={(e) => setChecklist({ ...checklist, correctDetails: e.target.checked })}
                    className="mt-0.5 w-5 h-5 rounded border-white/[0.1] text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-transparent"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Gegevens komen overeen</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.physicalCheck}
                    onChange={(e) => setChecklist({ ...checklist, physicalCheck: e.target.checked })}
                    className="mt-0.5 w-5 h-5 rounded border-white/[0.1] text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-transparent"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Fysieke controle uitgevoerd</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.noForgery}
                    onChange={(e) => setChecklist({ ...checklist, noForgery: e.target.checked })}
                    className="mt-0.5 w-5 h-5 rounded border-white/[0.1] text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-transparent"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Geen tekenen van vervalsing</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.salarySlipsReceived}
                    onChange={(e) => setChecklist({ ...checklist, salarySlipsReceived: e.target.checked })}
                    className="mt-0.5 w-5 h-5 rounded border-white/[0.1] text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-transparent"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Loonstroken ontvangen en gecontroleerd</p>
                  </div>
                </label>
              </div>

              {!allChecked && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-500">
                    Vink alle checks aan voordat je de gebruiker kunt goedkeuren
                  </p>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {decision === 'rejected' && (
              <div className="vl-card p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4">Reden voor afwijzing</h2>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Geef een reden waarom deze gebruiker wordt afgewezen..."
                  className="vl-textarea"
                  rows={4}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setDecision('approved');
                  handleSubmit('approved');
                }}
                disabled={!allChecked || submitting}
                className="vl-btn-primary flex-1"
              >
                {submitting && decision === 'approved' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Goedkeuren...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Goedkeuren
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  if (decision === 'rejected') {
                    handleSubmit('rejected');
                  } else {
                    setDecision('rejected');
                  }
                }}
                disabled={submitting}
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-400 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 flex-1"
              >
                {submitting && decision === 'rejected' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Afwijzen...
                  </>
                ) : decision === 'rejected' ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    Bevestig afwijzing
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Afwijzen
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

export default UserVerification;
