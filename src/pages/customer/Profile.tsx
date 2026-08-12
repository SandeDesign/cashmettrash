import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, Loader2, LogOut, Clock, AlertCircle, CheckCircle, FileText, Camera } from 'lucide-react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import SalarySlipUpload from '../../components/profile/SalarySlipUpload';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { uploadProfilePhoto } from '../../utils/upload';

const PROXY_URL = 'https://internedata.nl/proxyvlottr.php';

const CustomerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { initializeAuth, logout } = useAuthStore();
  const { settings, loadSettings } = useSettingsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    date_of_birth: user?.date_of_birth || ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        date_of_birth: user.date_of_birth || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: formData.date_of_birth,
        updated_at: Timestamp.now(),
      });

      // Refresh user data
      await initializeAuth();

      setSuccess(true);
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Er is een fout opgetreden bij het opslaan');
    } finally {
      setLoading(false);
    }
  };

  const handleSalarySlipsChange = async (slips: string[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        salary_slips: slips,
        updated_at: Timestamp.now(),
      });
      await initializeAuth();
    } catch (err: any) {
      console.error('Error saving salary slips:', err);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Weet u zeker dat u wilt uitloggen?')) return;

    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err: any) {
      console.error('Error logging out:', err);
      setError(err.message || 'Er is een fout opgetreden bij het uitloggen');
      setLoggingOut(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Foto mag maximaal 5MB zijn');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      const result = await uploadProfilePhoto(file, user.uid, PROXY_URL);

      if (result.success && result.url) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          profile_photo: result.url,
          updated_at: Timestamp.now(),
        });
        await initializeAuth();
      } else {
        throw new Error(result.error || 'Upload mislukt');
      }
    } catch (err: any) {
      setError(err.message || 'Foto upload mislukt');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const verificationStatus = (user as any)?.verification_status;
  const rejectionReason = (user as any)?.rejection_reason;
  const proxyUrl = settings?.upload_proxy_url || 'https://internedata.nl/uploads/vlottr/upload.php';
  const existingSlips: string[] = (user as any)?.salary_slips || [];

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Mijn Profiel" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Verification Status Banner */}
            {verificationStatus === 'pending' && (
              <div className="vl-card rounded-lg border border-yellow-500/40 bg-yellow-900/10 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-400 mb-1">Aanvraag in behandeling</p>
                    <p className="text-sm text-neutral-300 mb-3">
                      Uw aanvraag is ingediend en wordt beoordeeld door een beheerder. U ontvangt bericht zodra dit is afgerond.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span>Naam: <span className="text-white">{user?.name || '—'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span>Telefoon: <span className="text-white">{user?.phone || '—'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        <span>Adres: <span className="text-white">{user?.address || '—'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400">
                        {(user as any)?.driver_license ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                        )}
                        <span>Rijbewijs: <span className="text-white">{(user as any)?.driver_license ? 'Geüpload' : 'Ontbreekt'}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400 col-span-2">
                        {existingSlips.length >= 3 ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                        )}
                        <span>Loonstroken: <span className="text-white">{existingSlips.length}/3 geüpload</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {verificationStatus === 'rejected' && (
              <div className="vl-card rounded-lg border border-red-500/40 bg-red-900/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-400 mb-1">Aanvraag afgewezen</p>
                    {rejectionReason && (
                      <p className="text-sm text-neutral-300">Reden: {rejectionReason}</p>
                    )}
                    <p className="text-sm text-neutral-400 mt-1">Neem contact op met Vlottr voor meer informatie.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded">
                Profiel succesvol opgeslagen!
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Profile Card */}
            <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                <div className="flex items-center mb-4 lg:mb-0">
                  <label className="relative w-16 h-16 rounded-full cursor-pointer group flex-shrink-0">
                    {user?.profile_photo ? (
                      <img src={user.profile_photo} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingPhoto ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </label>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-white">
                      {user?.name || 'Naam niet ingesteld'}
                    </h2>
                    <p className="text-sm text-neutral-500">{user?.email}</p>
                    {verificationStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-900/40 text-green-400 border border-green-500/30 rounded-full mt-1">
                        <CheckCircle className="w-3 h-3" /> Geverifieerd
                      </span>
                    )}
                    {verificationStatus === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-900/40 text-yellow-400 border border-yellow-500/30 rounded-full mt-1">
                        <Clock className="w-3 h-3" /> In behandeling
                      </span>
                    )}
                    {verificationStatus === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-900/40 text-red-400 border border-red-500/30 rounded-full mt-1">
                        <AlertCircle className="w-3 h-3" /> Afgewezen
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-400 transition-colors text-sm"
                >
                  {isEditing ? 'Annuleren' : 'Bewerken'}
                </button>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Volledige naam
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`vl-input !pl-12 w-full ${
                        !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      placeholder="Uw volledige naam"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    E-mailadres
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="vl-input !pl-12 w-full opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">E-mailadres kan niet worden gewijzigd</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Telefoonnummer
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`vl-input !pl-12 w-full ${
                        !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      placeholder="+31 6 12345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Adres
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`vl-input !pl-12 w-full ${
                        !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      placeholder="Straat 123, 1234 AB Stad"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    Geboortedatum
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`vl-input !pl-12 w-full ${
                        !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex flex-col lg:flex-row gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Opslaan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Opslaan
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || '',
                          phone: user?.phone || '',
                          address: user?.address || '',
                          date_of_birth: user?.date_of_birth || ''
                        });
                        setError(null);
                      }}
                      disabled={loading}
                      className="px-4 py-2 border border-white/[0.1] text-neutral-300 rounded-md hover:bg-[var(--vl-bg-primary)] transition-colors disabled:opacity-50"
                    >
                      Annuleren
                    </button>
                  </div>
                )}
              </div>

              {/* Logout Section */}
              <div className="mt-6 pt-6 border-t border-white/[0.1]">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uitloggen...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 mr-2" />
                      Uitloggen
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Salary Slips Section */}
            {user && (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-neutral-400" />
                  <h3 className="text-base font-semibold text-white">Loonstroken</h3>
                </div>
                <p className="text-sm text-neutral-500 mb-4">
                  Upload uw 3 meest recente loonstroken. Deze worden gebruikt voor verificatie van uw inkomen.
                </p>
                <SalarySlipUpload
                  userId={user.uid}
                  proxyUrl={proxyUrl}
                  initialSlips={existingSlips}
                  onSlipsChange={handleSalarySlipsChange}
                />
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default CustomerProfile;
