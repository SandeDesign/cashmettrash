import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, UserCheck, Plus, Loader2, Phone, MapPin, Calendar, AlertTriangle, Send, ExternalLink, X, CheckCircle, Clock, XCircle, ChevronRight, Mail } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import UserValidation from '../../components/admin/UserValidation';
import UserProfileModal from '../../components/admin/UserProfileModal';
import { User as UserType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { sendCustomerWizardReminderEmail } from '../../utils/email';
import { logActivity } from '../../utils/activityLogger';

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const initialTab = searchParams.get('tab') === 'wizard' ? 'wizard' : searchParams.get('tab') === 'validation' ? 'validation' : 'all';
  const [activeTab, setActiveTab] = useState<'validation' | 'all' | 'wizard'>(initialTab);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Load users on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at || new Date().toISOString(),
          updated_at: doc.data().updated_at || new Date().toISOString(),
        })) as UserType[];
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Customers with incomplete wizard
  const incompleteWizardUsers = users.filter(
    u => u.role === 'customer' && !u.onboarding_completed
  );

  const handleSendWizardReminder = async (targetUser: UserType) => {
    if (!currentUser) return;
    setSendingReminder(targetUser.uid);
    setReminderError(null);

    try {
      const result = await sendCustomerWizardReminderEmail(
        targetUser.email,
        targetUser.name || 'Klant',
        currentUser.name || 'Admin'
      );
      if (!result.success) throw new Error(result.error || 'Verzenden mislukt');

      await logActivity({
        user_id: currentUser.uid,
        user_name: currentUser.name,
        user_email: currentUser.email,
        user_role: 'admin',
        action: 'send_wizard_reminder',
        description: `Wizard-herinnering verstuurd naar ${targetUser.name} (${targetUser.email})`,
        entity_type: 'user',
        entity_id: targetUser.uid,
      });

      setReminderSuccess(targetUser.uid);
      setTimeout(() => setReminderSuccess(null), 4000);
    } catch (err: any) {
      setReminderError(err.message || 'Fout bij verzenden herinnering');
    } finally {
      setSendingReminder(null);
    }
  };

  // Filter users — partners hebben een eigen sectie en worden hier niet getoond
  const filteredUsers = users.filter(user => {
    // Partners nooit tonen op de gebruikers-pagina
    if (user.role === 'partner') return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.phone?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && user.verification_status !== statusFilter) {
      return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="vl-badge vl-badge-green flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Geverifieerd
          </span>
        );
      case 'pending':
        return (
          <span className="vl-badge vl-badge-yellow flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Wacht op verificatie
          </span>
        );
      case 'rejected':
        return (
          <span className="vl-badge vl-badge-red flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Geweigerd
          </span>
        );
      default:
        return <span className="vl-badge vl-badge-neutral">Onbekend</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="vl-badge vl-badge-red">Admin</span>;
      case 'manager':
        return <span className="vl-badge vl-badge-blue">Manager</span>;
      case 'customer':
        return <span className="vl-badge vl-badge-neutral">Klant</span>;
      default:
        return <span className="vl-badge vl-badge-neutral">{role}</span>;
    }
  };

  const getUserAvatar = (user: UserType, size: 'sm' | 'md' = 'sm') => {
    const sizeClasses = size === 'md' ? 'w-12 h-12' : 'w-10 h-10';
    const textSize = size === 'md' ? 'text-sm' : 'text-xs';

    if (user.profile_photo) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEnlargedPhoto(user.profile_photo!);
          }}
          className={`${sizeClasses} rounded-lg overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-green-500 transition-all cursor-zoom-in`}
        >
          <img
            src={user.profile_photo}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </button>
      );
    }

    return (
      <div className={`${sizeClasses} rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 ${textSize} font-bold flex-shrink-0`}>
        {user.name?.substring(0, 2).toUpperCase() || 'U'}
      </div>
    );
  };

  const getLicenseStatus = (user: UserType) => {
    if (!user.driver_license) {
      return <span className="text-xs text-neutral-600">Geen rijbewijs</span>;
    }
    if (user.driver_license.verified) {
      return <span className="text-xs text-green-400">Rijbewijs geverifieerd</span>;
    }
    return <span className="text-xs text-yellow-400">Rijbewijs in behandeling</span>;
  };

  const getSalarySlipsStatus = (user: UserType) => {
    const count = user.salary_slips?.length || 0;
    if (count === 0) return null;
    return (
      <span className={`text-xs ${count >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
        Loonstroken: {count}/3
      </span>
    );
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Gebruikers Beheer" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Add User Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => alert('Gebruiker toevoegen functionaliteit wordt binnenkort geïmplementeerd. Gebruikers worden momenteel automatisch aangemaakt via registratie.')}
                className="vl-btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Gebruiker toevoegen
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-white/[0.1]">
              <div className="flex space-x-1 sm:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center gap-2 pb-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'all'
                      ? 'border-green-500 text-green-400'
                      : 'border-transparent text-neutral-500 hover:text-white hover:border-white/[0.1]'
                  }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Alle gebruikers</span>
                </button>
                <button
                  onClick={() => setActiveTab('validation')}
                  className={`flex items-center gap-2 pb-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'validation'
                      ? 'border-green-500 text-green-400'
                      : 'border-transparent text-neutral-500 hover:text-white hover:border-white/[0.1]'
                  }`}
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Validatie vereist</span>
                </button>
                <button
                  onClick={() => setActiveTab('wizard')}
                  className={`flex items-center gap-2 pb-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'wizard'
                      ? 'border-green-500 text-green-400'
                      : 'border-transparent text-neutral-500 hover:text-white hover:border-white/[0.1]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Wizard niet voltooid</span>
                  {incompleteWizardUsers.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                      {incompleteWizardUsers.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'validation' ? (
              <UserValidation />
            ) : activeTab === 'wizard' ? (
              <div className="space-y-4">
                {reminderError && (
                  <div className="rounded-xl px-4 py-3 border border-red-500/20" style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                    <span className="text-red-400 text-sm">{reminderError}</span>
                  </div>
                )}

                {loading ? (
                  <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-green-400 mr-3" />
                      <span className="text-neutral-500">Laden...</span>
                    </div>
                  </div>
                ) : incompleteWizardUsers.length === 0 ? (
                  <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-8 text-center">
                    <UserCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Alle klanten hebben de wizard voltooid</h3>
                    <p className="text-neutral-500">Er zijn geen klanten met een onvoltooide registratie.</p>
                  </div>
                ) : (
                  incompleteWizardUsers.map(u => (
                    <div key={u.uid} className="vl-card rounded-xl border border-amber-500/20 overflow-hidden">
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate">{u.name || 'Geen naam'}</h3>
                          <p className="text-neutral-500 text-sm truncate">{u.email}</p>
                          <p className="text-neutral-600 text-xs mt-0.5">
                            Aangemeld: {new Date(u.created_at).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                          <button
                            onClick={() => navigate(`/admin/users/${u.uid}/verify`)}
                            className="px-3 py-2 text-sm bg-white/[0.05] text-white rounded-lg hover:bg-white/[0.1] transition-colors flex items-center justify-center gap-2 border border-white/[0.08]"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Bekijk profiel
                          </button>
                          <button
                            onClick={() => handleSendWizardReminder(u)}
                            disabled={sendingReminder === u.uid || reminderSuccess === u.uid}
                            className={`px-3 py-2 text-sm rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                              reminderSuccess === u.uid
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
                            } disabled:opacity-60`}
                          >
                            {sendingReminder === u.uid ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Verzenden...</>
                            ) : reminderSuccess === u.uid ? (
                              <><UserCheck className="w-4 h-4" /> Verstuurd!</>
                            ) : (
                              <><Send className="w-4 h-4" /> Stuur herinnering</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Search and Filters */}
                <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none z-10" />
                      <input
                        type="text"
                        placeholder="Zoek op naam, email, telefoon..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="vl-input !pl-12 pr-4 w-full"
                      />
                    </div>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="vl-select"
                    >
                      <option value="all">Alle rollen</option>
                      <option value="customer">Klanten</option>
                      <option value="manager">Managers</option>
                      <option value="admin">Administrators</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="vl-select"
                    >
                      <option value="all">Alle statussen</option>
                      <option value="approved">Geverifieerd</option>
                      <option value="pending">Wacht op verificatie</option>
                      <option value="rejected">Geweigerd</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                {loading ? (
                  <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-green-400 mr-3" />
                      <span className="text-neutral-500">Gebruikers laden...</span>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Geen gebruikers gevonden</h3>
                      <p className="text-neutral-500">
                        {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                          ? 'Probeer andere filterinstellingen.'
                          : 'Er zijn nog geen gebruikers in het systeem.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block vl-card rounded-lg shadow-sm border border-white/[0.1] overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="vl-table">
                          <thead>
                            <tr>
                              <th>Gebruiker</th>
                              <th>Rol</th>
                              <th>Status</th>
                              <th>Acties</th>
                              <th>Aangemaakt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map(user => (
                              <tr
                                key={user.uid}
                                onClick={() => { setSelectedUser(user); setIsProfileModalOpen(true); }}
                                className="cursor-pointer hover:bg-white/[0.04] transition-colors"
                              >
                                <td>
                                  <div className="flex items-center">
                                    {getUserAvatar(user)}
                                    <div className="ml-3">
                                      <p className="font-medium text-white">{user.name || 'Geen naam'}</p>
                                      <p className="text-sm text-neutral-500">{user.email || 'Geen email'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td>{getRoleBadge(user.role)}</td>
                                <td>{getStatusBadge(user.verification_status || 'pending')}</td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    {user.email && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const name = encodeURIComponent(user.name || 'Geen naam');
                                          navigate(`/admin/email-tool?to=${encodeURIComponent(user.email)}&name=${name}`);
                                        }}
                                        className="p-2 rounded-lg text-neutral-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                                        title={`Mail sturen naar ${user.email}`}
                                      >
                                        <Mail className="w-4 h-4" />
                                      </button>
                                    )}
                                    {user.phone && (
                                      <a
                                        href={`tel:${user.phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 rounded-lg border border-white/[0.1] hover:bg-white/[0.06] hover:border-green-500/30 text-neutral-400 hover:text-green-400 transition-colors"
                                        title={`Bel ${user.phone}`}
                                      >
                                        <Phone className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="text-sm text-neutral-400">
                                  {new Date(user.created_at).toLocaleDateString('nl-NL')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                      {filteredUsers.map(user => (
                        <div
                          key={user.uid}
                          onClick={() => { setSelectedUser(user); setIsProfileModalOpen(true); }}
                          className="vl-card rounded-lg shadow-sm border border-white/[0.1] overflow-hidden cursor-pointer hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors"
                        >
                          <div className="p-4 flex items-center gap-3">
                            {getUserAvatar(user, 'md')}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate text-sm">{user.name || 'Geen naam'}</p>
                              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                {getRoleBadge(user.role)}
                                {getStatusBadge(user.verification_status || 'pending')}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                {user.email && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const name = encodeURIComponent(user.name || 'Geen naam');
                                      navigate(`/admin/email-tool?to=${encodeURIComponent(user.email)}&name=${name}`);
                                    }}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                                    title={`Mail sturen naar ${user.email}`}
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {user.phone && (
                                  <a
                                    href={`tel:${user.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg border border-white/[0.1] hover:bg-white/[0.06] text-neutral-400 hover:text-green-400 transition-colors"
                                    title="Bel"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      <BottomNav />

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedUser(null);
        }}
        onNavigateToVerification={(userId) => {
          setIsProfileModalOpen(false);
          setSelectedUser(null);
          navigate(`/admin/users/${userId}/verify`);
        }}
      />

      {/* Photo Lightbox */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={enlargedPhoto}
              alt="Profielfoto"
              className="w-full h-auto rounded-xl border border-white/[0.1] max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
