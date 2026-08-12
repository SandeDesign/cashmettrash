import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, Loader2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useContractStore } from '../../store/contractStore';
import { Contract } from '../../types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { downloadContractPDF } from '../../utils/pdf';
import { isValidDate } from '../../utils/dateHelpers';

const ManagerContracts: React.FC = () => {
  const navigate = useNavigate();
  const { contracts, loading, fetchAllContracts } = useContractStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // New: filter for extension contracts
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  // Helper to check if contract is an extension
  const isExtensionContract = (contract: Contract) => {
    return contract.id.startsWith('EXT-') || contract.booking_id !== undefined;
  };

  useEffect(() => {
    fetchAllContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch once on mount

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Wacht op ondertekening';
      case 'signed':
        return 'Ondertekend';
      case 'completed':
        return 'Voltooid';
      default:
        return status;
    }
  };

  const filteredContracts = contracts.filter(contract => {
    // Status filter
    if (statusFilter !== 'all' && contract.status !== statusFilter) {
      return false;
    }

    // Type filter (extension vs regular)
    if (typeFilter === 'extension' && !isExtensionContract(contract)) {
      return false;
    } else if (typeFilter === 'regular' && isExtensionContract(contract)) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        contract.customer_name.toLowerCase().includes(query) ||
        contract.customer_email.toLowerCase().includes(query) ||
        contract.car_info.toLowerCase().includes(query) ||
        contract.id.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleDownloadPDF = async (contract: Contract) => {
    try {
      await downloadContractPDF(contract);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Fout bij het genereren van de PDF. Probeer het opnieuw.');
    }
  };

  const handleViewContract = (contractId: string) => {
    navigate(`/manager/contract/${contractId}`);
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Contracten Overzicht" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-4 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Zoeken
                  </label>
                  <input
                    type="text"
                    placeholder="Zoek op naam, email, auto of contract ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-black/20 border border-white/[0.1] rounded-md focus:ring-2 focus:ring-green-500 text-white placeholder-neutral-500"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Type Contract
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-black/20 border border-white/[0.1] rounded-md focus:ring-2 focus:ring-green-500 text-white"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="all">Alle contracten</option>
                    <option value="extension">🔄 Alleen verlengingen</option>
                    <option value="regular">📄 Alleen regulier</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Status Filter
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-black/20 border border-white/[0.1] rounded-md focus:ring-2 focus:ring-green-500 text-white"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="all">Alle statussen</option>
                    <option value="pending">Wacht op ondertekening</option>
                    <option value="signed">Ondertekend</option>
                    <option value="completed">Voltooid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-neutral-500">
              {filteredContracts.length} contract(en) gevonden
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
              </div>
            )}

            {/* Contracts List */}
            {!loading && filteredContracts.length === 0 && (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-8 text-center">
                <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500">Geen contracten gevonden</p>
              </div>
            )}

            {!loading && filteredContracts.length > 0 && (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block vl-card rounded-lg shadow-sm border border-white/[0.1] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-[var(--vl-bg-primary)]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Contract ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Klant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Auto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Periode
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Bedrag
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            Acties
                          </th>
                        </tr>
                      </thead>
                      <tbody className="vl-card divide-y divide-gray-200">
                        {filteredContracts.map((contract) => (
                          <tr key={contract.id} className="hover:bg-[var(--vl-bg-primary)]">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">
                                  {contract.id.substring(0, 8)}...
                                </span>
                                {isExtensionContract(contract) && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    🔄 Verlenging
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">
                                {contract.customer_name}
                              </div>
                              <div className="text-sm text-neutral-500">
                                {contract.customer_email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {contract.car_info}
                            </td>
                            <td className="px-6 py-4 text-sm text-white">
                              <div>
                                {contract.start_date && isValidDate(contract.start_date) ? (
                                  <>
                                    {format(new Date(contract.start_date), 'd-M-yyyy', { locale: nl })}
                                    {contract.end_date && isValidDate(contract.end_date) ? (
                                      <> - {format(new Date(contract.end_date), 'd-M-yyyy', { locale: nl })}</>
                                    ) : contract.end_date === '' ? (
                                      <span className="text-neutral-500 ml-2">(open)</span>
                                    ) : null}
                                  </>
                                ) : (
                                  <span className="text-neutral-500">Geen datum</span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500">
                                {contract.weeks_rented > 0 ? (
                                  <>{contract.weeks_rented} {contract.weeks_rented === 1 ? 'week' : 'weken'}</>
                                ) : (
                                  <span className="text-neutral-500">Doorlopend</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                              €{contract.total_price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(contract.status)}`}>
                                {getStatusLabel(contract.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                              <div className="flex space-x-2">
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
                  {filteredContracts.map((contract) => {
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
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-white truncate">{contract.customer_name}</p>
                                {isExtensionContract(contract) && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">
                                    🔄
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-500 truncate">{contract.customer_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(contract.status)}`}>
                              {getStatusLabel(contract.status)}
                            </span>
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
                                <span className="text-white truncate">{contract.car_info}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <span className="text-neutral-500 w-20 flex-shrink-0">Periode:</span>
                                <div className="text-white">
                                  {contract.start_date && isValidDate(contract.start_date) ? (
                                    <>
                                      {format(new Date(contract.start_date), 'd-M-yyyy', { locale: nl })}
                                      {contract.end_date && isValidDate(contract.end_date) ? (
                                        <> - {format(new Date(contract.end_date), 'd-M-yyyy', { locale: nl })}</>
                                      ) : contract.end_date === '' ? (
                                        <span className="text-neutral-500 ml-2">(open)</span>
                                      ) : null}
                                    </>
                                  ) : (
                                    'Geen datum'
                                  )}
                                  <span className="text-xs text-neutral-500 ml-2">
                                    {contract.weeks_rented > 0 ? (
                                      <>({contract.weeks_rented} {contract.weeks_rented === 1 ? 'week' : 'weken'})</>
                                    ) : (
                                      '(Doorlopend)'
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <span className="text-neutral-500 w-20 flex-shrink-0">Bedrag:</span>
                                <span className="text-white font-semibold">€{contract.total_price}</span>
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

export default ManagerContracts;
