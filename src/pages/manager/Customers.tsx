import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, Mail, Phone, MapPin, CreditCard, Loader2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import DriverLicenseModal from '../../components/admin/DriverLicenseModal';
import { User as UserType } from '../../types';

const ManagerCustomers: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [selectedLicenseUser, setSelectedLicenseUser] = useState<UserType | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs
          .map(doc => ({
            uid: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at || new Date().toISOString(),
            updated_at: doc.data().updated_at || new Date().toISOString(),
          }))
          .filter(user => user.role === 'customer') as UserType[];
        setCustomers(usersData);
      } catch (error) {
        console.error('Error loading customers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        customer.name?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.phone?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter === 'active' && customer.verification_status !== 'approved') {
      return false;
    }
    if (statusFilter === 'inactive' && customer.verification_status === 'approved') {
      return false;
    }
    if (statusFilter === 'new') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (new Date(customer.created_at) < weekAgo) {
        return false;
      }
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="vl-badge vl-badge-green">Actief</span>;
      case 'pending':
        return <span className="vl-badge vl-badge-yellow">In behandeling</span>;
      case 'rejected':
        return <span className="vl-badge vl-badge-red">Geweigerd</span>;
      default:
        return <span className="vl-badge vl-badge-neutral">Onbekend</span>;
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Manager - Klanten"
          subtitle="Overzicht van alle geregistreerde klanten en hun activiteiten"
        />

        <main data-tour="customers-page" className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">

            {/* Search and Filters */}
            <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Zoek op naam, email, telefoon..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="vl-input !pl-12 pr-4"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black/20 border border-white/[0.1] rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="all">Alle klanten</option>
                  <option value="active">Actieve klanten</option>
                  <option value="inactive">Inactieve klanten</option>
                  <option value="new">Nieuwe klanten</option>
                </select>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 bg-black/20 border border-white/[0.1] text-white rounded-md hover:bg-black/30 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Meer filters
                </button>
              </div>
            </div>

            {/* Customers Table */}
            {loading ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400 mr-3" />
                  <span className="text-neutral-500">Klanten laden...</span>
                </div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Geen klanten gevonden</h3>
                  <p className="text-neutral-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Probeer andere filterinstellingen.'
                      : 'Geregistreerde klanten verschijnen hier zodra ze zich aanmelden.'}
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
                          <th>Klant</th>
                          <th>Status</th>
                          <th>Contact</th>
                          <th>Aangemaakt</th>
                          <th className="text-right">Acties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map(customer => (
                          <tr key={customer.uid}>
                            <td>
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-sm font-bold mr-3">
                                  {customer.name?.substring(0, 2).toUpperCase() || 'K'}
                                </div>
                                <div>
                                  <p className="font-medium text-white">{customer.name || 'Geen naam'}</p>
                                  <p className="text-sm text-neutral-500">{customer.email}</p>
                                </div>
                              </div>
                            </td>
                            <td>{getStatusBadge(customer.verification_status || 'pending')}</td>
                            <td>
                              <div className="space-y-1">
                                {customer.phone && (
                                  <div className="flex items-center text-sm text-neutral-400">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {customer.phone}
                                  </div>
                                )}
                                {customer.address && (
                                  <div className="flex items-center text-sm text-neutral-400">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {customer.address}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="text-sm text-neutral-400">
                              {new Date(customer.created_at).toLocaleDateString('nl-NL')}
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLicenseUser(customer);
                                    setLicenseModalOpen(true);
                                  }}
                                  className="vl-btn-ghost text-xs"
                                  title="Bekijk rijbewijs"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/admin/email-tool?to=${encodeURIComponent(customer.email)}&name=${encodeURIComponent(customer.name || 'Klant')}`)}
                                  className="vl-btn-ghost text-xs text-green-400 hover:text-green-300"
                                  title="Email versturen"
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                                {customer.phone && (
                                  <a
                                    href={`tel:${customer.phone}`}
                                    className="vl-btn-ghost text-xs text-purple-400 hover:text-purple-300"
                                    title={`Bel ${customer.phone}`}
                                  >
                                    <Phone className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {filteredCustomers.map(customer => {
                    const isExpanded = expandedCustomerId === customer.uid;
                    return (
                      <div key={customer.uid} className="vl-card p-4 rounded-lg shadow-sm border border-white/[0.1]">
                        {/* Header - Always Visible */}
                        <button
                          onClick={() => setExpandedCustomerId(isExpanded ? null : customer.uid)}
                          className="w-full flex items-start justify-between mb-3 text-left"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-sm font-bold mr-3 flex-shrink-0">
                              {customer.name?.substring(0, 2).toUpperCase() || 'K'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white truncate">{customer.name || 'Geen naam'}</p>
                              <p className="text-sm text-neutral-500 truncate">{customer.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            {getStatusBadge(customer.verification_status || 'pending')}
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-neutral-400" />
                            )}
                          </div>
                        </button>

                        {/* Details - Collapsible */}
                        {isExpanded && (
                          <div className="animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2 mb-3">
                              {customer.phone && (
                                <div className="flex items-center text-sm text-neutral-400">
                                  <Phone className="w-4 h-4 mr-2" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.address && (
                                <div className="flex items-center text-sm text-neutral-400">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span className="truncate">{customer.address}</span>
                                </div>
                              )}
                              <div className="flex items-center text-xs text-neutral-500">
                                <Calendar className="w-3 h-3 mr-2" />
                                Aangemaakt: {new Date(customer.created_at).toLocaleDateString('nl-NL')}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.1]">
                              <button
                                onClick={() => {
                                  setSelectedLicenseUser(customer);
                                  setLicenseModalOpen(true);
                                }}
                                className="px-3 py-2.5 text-sm bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2 font-medium"
                              >
                                <CreditCard className="w-4 h-4" />
                                <span className="truncate">Rijbewijs</span>
                              </button>
                              <button
                                onClick={() => navigate(`/admin/email-tool?to=${encodeURIComponent(customer.email)}&name=${encodeURIComponent(customer.name || 'Klant')}`)}
                                className="px-3 py-2.5 text-sm bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2 font-medium"
                              >
                                <Mail className="w-4 h-4" />
                                <span className="truncate">Email</span>
                              </button>
                            </div>
                            {customer.phone && (
                              <a
                                href={`tel:${customer.phone}`}
                                className="block mt-2 px-3 py-2.5 text-sm bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2 font-medium"
                              >
                                <Phone className="w-4 h-4" />
                                <span className="truncate">Bel {customer.phone}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <BottomNav />

      {/* Driver License Modal */}
      <DriverLicenseModal
        isOpen={licenseModalOpen}
        onClose={() => {
          setLicenseModalOpen(false);
          setSelectedLicenseUser(null);
        }}
        driverLicense={selectedLicenseUser?.driver_license}
        userName={selectedLicenseUser?.name || 'Klant'}
      />
    </div>
  );
};

export default ManagerCustomers;