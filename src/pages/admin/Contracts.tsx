import React, { useState, useEffect } from 'react';
import { FileText, Search, Eye, Download, Loader2, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { Contract } from '../../types';
import { downloadContractPDF } from '../../utils/pdf';

const AdminContracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'contracts'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const contractsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Contract[];
      setContracts(contractsData);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      contract.customer_name?.toLowerCase().includes(search) ||
      contract.customer_email?.toLowerCase().includes(search) ||
      contract.car_info?.toLowerCase().includes(search) ||
      contract.id.toLowerCase().includes(search)
    );
  });

  const handleDownloadPDF = async (contract: Contract) => {
    try {
      await downloadContractPDF(contract);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Fout bij het genereren van de PDF. Probeer het opnieuw.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return <span className="vl-badge vl-badge-green">Ondertekend</span>;
      case 'pending':
        return <span className="vl-badge vl-badge-yellow">In behandeling</span>;
      case 'expired':
        return <span className="vl-badge vl-badge-red">Verlopen</span>;
      default:
        return <span className="vl-badge vl-badge-neutral">{status}</span>;
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Contracten" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Search */}
            <div className="vl-card p-6 rounded-lg shadow-sm border border-white/[0.1] mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Zoek op klant, email, auto, contract ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="vl-input !pl-12 w-full"
                />
              </div>
            </div>

            {/* Contracts Table */}
            {loading ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400 mr-3" />
                  <span className="text-neutral-500">Contracten laden...</span>
                </div>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Geen contracten gevonden</h3>
                  <p className="text-neutral-500">
                    {searchTerm ? 'Probeer een andere zoekopdracht.' : 'Er zijn nog geen contracten in het systeem.'}
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
                          <th>Contract ID</th>
                          <th>Klant</th>
                          <th>Auto</th>
                          <th>Periode</th>
                          <th>Status</th>
                          <th>Aangemaakt</th>
                          <th className="text-right">Acties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContracts.map(contract => (
                          <tr key={contract.id}>
                            <td className="font-mono text-sm text-neutral-400">
                              {contract.id.substring(0, 8)}...
                            </td>
                            <td>
                              <div>
                                <p className="font-medium text-white">{contract.customer_name || 'Onbekende klant'}</p>
                                <p className="text-sm text-neutral-500">{contract.customer_email || 'Geen email'}</p>
                              </div>
                            </td>
                            <td className="text-neutral-300">{contract.car_info || 'Geen auto info'}</td>
                            <td className="text-sm text-neutral-400">
                              {new Date(contract.start_date).toLocaleDateString('nl-NL')} - {new Date(contract.end_date).toLocaleDateString('nl-NL')}
                              <br />
                              <span className="text-xs text-neutral-500">{contract.weeks_rented} weken</span>
                            </td>
                            <td>{getStatusBadge(contract.signed ? 'signed' : 'pending')}</td>
                            <td className="text-sm text-neutral-400">
                              {new Date(contract.created_at).toLocaleDateString('nl-NL')}
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleDownloadPDF(contract)}
                                  className="vl-btn-primary px-3 py-2 text-sm"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </button>
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
                  {filteredContracts.map(contract => {
                    const isExpanded = expandedContractId === contract.id;
                    return (
                      <div key={contract.id} className="vl-card p-4 rounded-lg shadow-sm border border-white/[0.1]">
                        {/* Header - Always Visible */}
                        <button
                          onClick={() => setExpandedContractId(isExpanded ? null : contract.id)}
                          className="w-full flex items-start justify-between mb-3 text-left"
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <FileText className="w-10 h-10 text-green-400 mr-3 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-white truncate">{contract.customer_name || 'Onbekende klant'}</p>
                              <p className="text-sm text-neutral-500 truncate">{contract.customer_email || 'Geen email'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            {getStatusBadge(contract.signed ? 'signed' : 'pending')}
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
                              <div className="flex items-center text-sm">
                                <span className="text-neutral-500 w-20 flex-shrink-0">ID:</span>
                                <span className="font-mono text-neutral-400 truncate">{contract.id.substring(0, 12)}...</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <span className="text-neutral-500 w-20 flex-shrink-0">Auto:</span>
                                <span className="text-white truncate">{contract.car_info || 'Geen auto info'}</span>
                              </div>
                              <div className="flex items-start text-sm">
                                <span className="text-neutral-500 w-20 flex-shrink-0">Periode:</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-neutral-400">
                                    {new Date(contract.start_date).toLocaleDateString('nl-NL')}
                                  </p>
                                  <p className="text-neutral-400">
                                    {new Date(contract.end_date).toLocaleDateString('nl-NL')}
                                  </p>
                                  <p className="text-xs text-neutral-500">{contract.weeks_rented} weken</p>
                                </div>
                              </div>
                              <div className="flex items-center text-xs text-neutral-500">
                                <Calendar className="w-3 h-3 mr-2" />
                                Aangemaakt: {new Date(contract.created_at).toLocaleDateString('nl-NL')}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDownloadPDF(contract)}
                              className="w-full vl-btn-primary px-3 py-2 text-sm flex items-center justify-center"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </button>
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
    </div>
  );
};

export default AdminContracts;
