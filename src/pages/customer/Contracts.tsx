import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { downloadContractPDF } from '../../utils/pdf';
import { Contract } from '../../types'; // Use the FULL Contract type!

const CustomerContracts: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadContracts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const loadContracts = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, 'contracts'),
        where('customer_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );
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

  const getStatusBadge = (contract: Contract) => {
    if (contract.signed) {
      return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">Ondertekend</span>;
    }
    return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">In behandeling</span>;
  };

  const handleDownloadPDF = async (contract: Contract) => {
    try {
      await downloadContractPDF(contract);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Fout bij het genereren van de PDF. Probeer het opnieuw.');
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Mijn Contracten" />

        <main data-tour="contracts-page" className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
              </div>
            )}

            {/* Empty State */}
            {!loading && contracts.length === 0 && (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-12 text-center">
                <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Geen contracten</h3>
                <p className="text-neutral-400">Je hebt nog geen huurcontracten.</p>
              </div>
            )}

            {/* Contracts List */}
            {!loading && contracts.length > 0 && (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6 hover:border-green-400/30 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Contract Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {contract.car_info}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-400">
                              <span>Contract ID: {contract.id.slice(0, 8)}...</span>
                              <span>•</span>
                              <span>
                                Aangemaakt: {new Date(contract.created_at).toLocaleDateString('nl-NL')}
                              </span>
                              {contract.signed && contract.signed_at && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Ondertekend: {new Date(contract.signed_at).toLocaleDateString('nl-NL')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3">
                        {getStatusBadge(contract)}

                        <button
                          onClick={() => handleDownloadPDF(contract)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default CustomerContracts;
