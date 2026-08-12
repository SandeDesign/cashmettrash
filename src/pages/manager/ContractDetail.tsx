import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, XCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import ContractViewer from '../../components/contract/ContractViewer';
import { useContractStore } from '../../store/contractStore';
import { useAuth } from '../../hooks/useAuth';

const ManagerContractDetail: React.FC = () => {
  const { contractId } = useParams<{ contractId: string}>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getContract, terminateContract } = useContractStore();

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) {
      loadContract();
    }
  }, [contractId]);

  const loadContract = async () => {
    if (!contractId) return;

    try {
      setLoading(true);
      setError(null);
      const contractData = await getContract(contractId);

      if (!contractData) {
        setError('Contract niet gevonden');
        return;
      }

      setContract(contractData);
    } catch (err: any) {
      setError(err.message || 'Contract laden gefaald');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (contract?.pdf_url) {
      window.open(contract.pdf_url, '_blank');
    }
  };

  const handleTerminate = async () => {
    if (!contractId || !user) return;

    const reason = prompt('Reden voor ontbinding:');
    if (!reason) return;

    if (!confirm('Weet je zeker dat je dit contract wilt ontbinden?')) return;

    try {
      await terminateContract(contractId, reason, user.uid);
      alert('Contract ontbonden!');
      loadContract();
    } catch (error) {
      console.error('Fout bij ontbinden:', error);
      alert('Fout bij ontbinden contract');
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

  if (error) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header />
          <main className="flex-1 flex items-center justify-center p-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
              <h2 className="font-semibold mb-2">Fout</h2>
              <p>{error}</p>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Contract Details" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => navigate('/manager/contracts')}
                className="flex items-center text-neutral-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Terug naar overzicht
              </button>

              <div className="flex gap-3">
                {contract.status !== 'terminated' && (
                  <button
                    onClick={handleTerminate}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Contract Ontbinden
                  </button>
                )}
                {contract.pdf_url && (
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                )}
              </div>
            </div>

            {/* Contract Viewer */}
            <ContractViewer contract={contract} />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default ManagerContractDetail;
