import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle, Clock, Eye, X, Download, Loader2 } from 'lucide-react';
import { generatePartnerContractHtml } from '../admin/Partners';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import SignaturePad from '../../components/contract/SignaturePad';
import { useAuth } from '../../hooks/useAuth';
import { usePartnerStore } from '../../store/partnerStore';
import { PartnerContract, Contract } from '../../types';
import { downloadPartnerAgreementPDF, downloadDealerAgreementPDF, downloadGarageAgreementPDF } from '../../utils/pdf';

const PartnerDocuments: React.FC = () => {
  const { user } = useAuth();
  const { partnerContracts, fetchPartnerContracts, signPartnerContract, loading } = usePartnerStore();
  const [selectedContract, setSelectedContract] = useState<PartnerContract | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signingContract, setSigningContract] = useState<string | null>(null);
  const [partnerAgreement, setPartnerAgreement] = useState<Contract | null>(null);
  const [dealerAgreement, setDealerAgreement] = useState<Contract | null>(null);
  const [garageAgreement, setGarageAgreement] = useState<Contract | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [viewingAgreement, setViewingAgreement] = useState(false);
  const [viewingDealerAgreement, setViewingDealerAgreement] = useState(false);
  const [viewingGarageAgreement, setViewingGarageAgreement] = useState(false);
  const [unsignedAgreements, setUnsignedAgreements] = useState<Contract[]>([]);
  const [signingAgreementId, setSigningAgreementId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPartnerContracts(user.uid);
      fetchAllAgreements(user.uid);
    }
  }, [user, fetchPartnerContracts]);

  const fetchAllAgreements = async (userId: string) => {
    try {
      // Fetch all agreement types
      const q = query(
        collection(db, 'contracts'),
        where('customer_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      const unsigned: Contract[] = [];
      for (const d of snapshot.docs) {
        const data = d.data() as Contract;
        if (data.contract_type === 'partner_agreement' && !partnerAgreement) {
          setPartnerAgreement(data);
        } else if (data.contract_type === 'dealer_agreement' && !dealerAgreement) {
          setDealerAgreement(data);
        } else if (data.contract_type === 'garage_agreement' && !garageAgreement) {
          setGarageAgreement(data);
        }
        if (!data.signed && (data.contract_type === 'dealer_agreement' || data.contract_type === 'garage_agreement')) {
          unsigned.push(data);
        }
      }
      setUnsignedAgreements(unsigned);
    } catch (err) {
      console.error('Error fetching agreements:', err);
    }
  };

  const handleSign = async (signatureDataUrl: string) => {
    if (!signingContract) return;

    try {
      await signPartnerContract(signingContract, signatureDataUrl);
      setShowSignature(false);
      setSigningContract(null);
      if (user) {
        await fetchPartnerContracts(user.uid);
      }
    } catch (err) {
      console.error('Error signing contract:', err);
    }
  };

  const handleSignAgreement = async (signatureDataUrl: string) => {
    if (!signingAgreementId) return;
    try {
      const contractRef = doc(db, 'contracts', signingAgreementId);
      await updateDoc(contractRef, {
        customer_signature_url: signatureDataUrl,
        signed: true,
        signed_at: new Date().toISOString(),
        status: 'signed',
        updated_at: new Date().toISOString(),
      });
      if (user) await fetchAllAgreements(user.uid);
      setShowSignature(false);
      setSigningAgreementId(null);
    } catch (err) {
      console.error('Error signing agreement:', err);
    }
  };

  const handleDownloadAgreement = async (type: 'partner' | 'dealer' | 'garage' = 'partner') => {
    const agreement = type === 'dealer' ? dealerAgreement : type === 'garage' ? garageAgreement : partnerAgreement;
    if (!agreement) return;
    setDownloadingPdf(true);
    try {
      if (type === 'dealer') {
        await downloadDealerAgreementPDF(agreement);
      } else if (type === 'garage') {
        await downloadGarageAgreementPDF(agreement);
      } else {
        await downloadPartnerAgreementPDF(agreement);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
      case 'active':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <CheckCircle className="w-3 h-3" />
            {status === 'signed' ? 'Getekend' : status === 'active' ? 'Actief' : 'Afgerond'}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <Clock className="w-3 h-3" /> Wacht op handtekening
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
            {status}
          </span>
        );
    }
  };

  const hasDocuments = partnerAgreement || dealerAgreement || garageAgreement || partnerContracts.length > 0 || unsignedAgreements.length > 0;

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Documenten"
          subtitle="Je contracten en partnerovereenkomsten"
          icon={FileText}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-4xl mx-auto">

            {/* Pending contracts that need signing */}
            {partnerContracts.filter(c => c.status === 'pending' && !c.signed).length > 0 && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-yellow-500/20 flex items-center gap-3" style={{ background: 'rgba(234, 179, 8, 0.08)' }}>
                <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-yellow-400 text-sm font-medium">
                  Je hebt {partnerContracts.filter(c => c.status === 'pending' && !c.signed).length} contract(en) die getekend moeten worden.
                </span>
              </div>
            )}

            {/* Unsigned agreements that need signing */}
            {unsignedAgreements.length > 0 && (
              <div className="rounded-xl px-4 py-3 mb-4 border border-yellow-500/20 flex items-center gap-3" style={{ background: 'rgba(234, 179, 8, 0.08)' }}>
                <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-yellow-400 text-sm font-medium">
                  Je hebt {unsignedAgreements.length} overeenkomst(en) die getekend moeten worden.
                </span>
              </div>
            )}

            {/* Unsigned agreement cards */}
            {unsignedAgreements.map(agreement => (
              <div key={agreement.id} className="vl-card rounded-xl p-5 mb-4 border border-yellow-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">
                      {agreement.contract_type === 'dealer_agreement' ? 'Dealer Overeenkomst' : 'Garage Overeenkomst'}
                    </h3>
                    <p className="text-neutral-500 text-sm">
                      Aangemaakt op {new Date(agreement.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    <Clock className="w-3 h-3" /> Wacht op handtekening
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSigningAgreementId(agreement.id);
                      setShowSignature(true);
                    }}
                    className="px-4 py-2 text-sm font-bold text-neutral-950 bg-green-500 rounded-lg hover:bg-green-400 transition-colors"
                  >
                    Ondertekenen
                  </button>
                </div>
              </div>
            ))}

            {!hasDocuments ? (
              <div className="vl-card rounded-xl p-12 text-center">
                <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Nog geen documenten</h3>
                <p className="text-neutral-500 text-sm">
                  Zodra je partneraanmelding is goedgekeurd ontvang je hier je contracten.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Partner Agreement (from contracts collection) */}
                {partnerAgreement && (
                  <div className="vl-card rounded-xl p-5 border border-green-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">
                          Partnerovereenkomst
                        </h3>
                        <p className="text-neutral-500 text-sm">
                          Getekend op {new Date(partnerAgreement.signed_at || partnerAgreement.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      {getStatusBadge(partnerAgreement.status)}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setViewingAgreement(true)}
                        className="px-4 py-2 text-sm font-medium text-white rounded-lg border border-white/[0.1] hover:bg-white/[0.05] transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Bekijken
                      </button>
                      <button
                        onClick={() => handleDownloadAgreement('partner')}
                        disabled={downloadingPdf}
                        className="px-4 py-2 text-sm font-bold text-neutral-950 bg-green-500 rounded-lg hover:bg-green-400 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {downloadingPdf ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        PDF downloaden
                      </button>
                    </div>
                  </div>
                )}

                {/* Dealer Agreement */}
                {dealerAgreement && (
                  <div className="vl-card rounded-xl p-5 border border-green-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">Dealer Overeenkomst</h3>
                        <p className="text-neutral-500 text-sm">
                          Getekend op {new Date(dealerAgreement.signed_at || dealerAgreement.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      {getStatusBadge(dealerAgreement.status)}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setViewingDealerAgreement(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg border border-white/[0.1] hover:bg-white/[0.05] transition-colors flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Bekijken
                      </button>
                      <button onClick={() => handleDownloadAgreement('dealer')} disabled={downloadingPdf} className="px-4 py-2 text-sm font-bold text-neutral-950 bg-green-500 rounded-lg hover:bg-green-400 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF downloaden
                      </button>
                    </div>
                  </div>
                )}

                {/* Garage Agreement */}
                {garageAgreement && (
                  <div className="vl-card rounded-xl p-5 border border-green-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">Garage Overeenkomst</h3>
                        <p className="text-neutral-500 text-sm">
                          Getekend op {new Date(garageAgreement.signed_at || garageAgreement.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      {getStatusBadge(garageAgreement.status)}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setViewingGarageAgreement(true)} className="px-4 py-2 text-sm font-medium text-white rounded-lg border border-white/[0.1] hover:bg-white/[0.05] transition-colors flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Bekijken
                      </button>
                      <button onClick={() => handleDownloadAgreement('garage')} disabled={downloadingPdf} className="px-4 py-2 text-sm font-bold text-neutral-950 bg-green-500 rounded-lg hover:bg-green-400 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF downloaden
                      </button>
                    </div>
                  </div>
                )}

                {/* Partner Contracts (from partner_contracts collection) */}
                {partnerContracts.map(contract => (
                  <div key={contract.id} className="vl-card rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">
                          Contract #{contract.id.slice(0, 8)}
                        </h3>
                        {contract.car_info && (
                          <p className="text-neutral-500 text-sm">{contract.car_info} - {contract.license_plate}</p>
                        )}
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-neutral-500">Inkoopprijs</span>
                        <p className="text-white font-semibold">{contract.purchase_price ? `€${contract.purchase_price.toLocaleString('nl-NL')}` : 'Nog vast te stellen'}</p>
                      </div>
                      {contract.repayment_percentage ? (
                        <div>
                          <span className="text-neutral-500">Aflossing</span>
                          <p className="text-white font-semibold">{contract.repayment_percentage}% van verhuurinkomsten</p>
                        </div>
                      ) : null}
                      <div>
                        <span className="text-neutral-500">Betaalwijze</span>
                        <p className="text-white">{contract.payment_terms || 'Termijnen'}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Datum</span>
                        <p className="text-white">{new Date(contract.created_at).toLocaleDateString('nl-NL')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Regenereer HTML vanuit nieuw dark template
                          const refreshed = { ...contract, contract_html: generatePartnerContractHtml({
                            partner_company: contract.partner_company,
                            partner_name: contract.partner_name,
                            partner_email: contract.partner_email,
                            car_info: contract.car_info,
                            license_plate: contract.license_plate,
                            purchase_price: contract.purchase_price ? String(contract.purchase_price).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : undefined,
                            current_date: contract.signed_at
                              ? new Date(contract.signed_at).toLocaleDateString('nl-NL')
                              : new Date(contract.created_at).toLocaleDateString('nl-NL'),
                            admin_signature: contract.admin_signature_url
                              ? `<img src="${contract.admin_signature_url}" alt="Handtekening" style="max-height:70px;" />`
                              : undefined,
                            partner_signature: contract.partner_signature_url
                              ? `<img src="${contract.partner_signature_url}" alt="Handtekening partner" style="max-height:70px;" />`
                              : undefined,
                          })};
                          setSelectedContract(refreshed);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white rounded-lg border border-white/[0.1] hover:bg-white/[0.05] transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Bekijken
                      </button>

                      {contract.status === 'pending' && !contract.signed && (
                        <button
                          onClick={() => {
                            setSigningContract(contract.id);
                            setShowSignature(true);
                          }}
                          className="px-4 py-2 text-sm font-bold text-neutral-950 bg-green-500 rounded-lg hover:bg-green-400 transition-colors"
                        >
                          Ondertekenen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Partner Agreement Viewer Modal */}
      {viewingAgreement && partnerAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
          <div className="relative w-full max-w-3xl mx-4 rounded-2xl shadow-2xl border border-white/[0.08] max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(18,18,18,0.98)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] sticky top-0 z-10" style={{ background: 'rgba(18,18,18,0.98)' }}>
              <h2 className="text-lg font-semibold text-white">Partnerovereenkomst</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAgreement}
                  disabled={downloadingPdf}
                  className="px-3 py-1.5 text-sm font-semibold text-neutral-950 bg-green-500 rounded-lg hover:bg-green-400 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  PDF
                </button>
                <button onClick={() => setViewingAgreement(false)} className="text-neutral-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: partnerAgreement.contract_html }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dealer Agreement Viewer Modal */}
      {viewingDealerAgreement && dealerAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
          <div className="relative w-full max-w-3xl mx-4 rounded-2xl shadow-2xl border border-white/[0.08] max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(18,18,18,0.98)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] sticky top-0 z-10" style={{ background: 'rgba(18,18,18,0.98)' }}>
              <h2 className="text-lg font-semibold text-white">Dealer Overeenkomst</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadAgreement('dealer')} disabled={downloadingPdf} className="px-3 py-1.5 text-sm font-semibold text-neutral-950 bg-green-500 rounded-lg hover:bg-green-400 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                </button>
                <button onClick={() => setViewingDealerAgreement(false)} className="text-neutral-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: dealerAgreement.contract_html }} />
            </div>
          </div>
        </div>
      )}

      {/* Garage Agreement Viewer Modal */}
      {viewingGarageAgreement && garageAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
          <div className="relative w-full max-w-3xl mx-4 rounded-2xl shadow-2xl border border-white/[0.08] max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(18,18,18,0.98)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] sticky top-0 z-10" style={{ background: 'rgba(18,18,18,0.98)' }}>
              <h2 className="text-lg font-semibold text-white">Garage Overeenkomst</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadAgreement('garage')} disabled={downloadingPdf} className="px-3 py-1.5 text-sm font-semibold text-neutral-950 bg-green-500 rounded-lg hover:bg-green-400 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                  {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                </button>
                <button onClick={() => setViewingGarageAgreement(false)} className="text-neutral-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: garageAgreement.contract_html }} />
            </div>
          </div>
        </div>
      )}

      {/* Contract Viewer Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}>
          <div className="relative w-full max-w-3xl mx-4 rounded-2xl shadow-2xl border border-white/[0.08] max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(18,18,18,0.98)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] sticky top-0 z-10" style={{ background: 'rgba(18,18,18,0.98)' }}>
              <h2 className="text-lg font-semibold text-white">
                Contract #{selectedContract.id.slice(0, 8)}
              </h2>
              <button onClick={() => setSelectedContract(null)} className="text-neutral-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ background: '#000000' }}>
              <div
                dangerouslySetInnerHTML={{ __html: selectedContract.contract_html }}
              />

              {/* Signatures */}
              {selectedContract.signed && (
                <div className="mt-8 pt-6 border-t border-white/[0.08]">
                  <h4 className="text-white font-semibold mb-4">Handtekeningen</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-neutral-500 mb-2">Partner</p>
                      {selectedContract.partner_signature_url ? (
                        <div className="border border-white/[0.08] rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <img src={selectedContract.partner_signature_url} alt="Partner handtekening" className="max-h-20 mx-auto" />
                        </div>
                      ) : (
                        <p className="text-neutral-600 text-sm">Nog niet getekend</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 mb-2">Vlottr (Buddy BV)</p>
                      {selectedContract.admin_signature_url ? (
                        <div className="border border-white/[0.08] rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <img src={selectedContract.admin_signature_url} alt="Admin handtekening" className="max-h-20 mx-auto" />
                        </div>
                      ) : (
                        <p className="text-neutral-600 text-sm">Nog niet getekend</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad */}
      {showSignature && (
        <SignaturePad
          onSave={signingAgreementId ? handleSignAgreement : (signingContract ? handleSign : () => {})}
          onCancel={() => {
            setShowSignature(false);
            setSigningContract(null);
            setSigningAgreementId(null);
          }}
          loading={loading}
          backgroundColor="#000000"
          penColor="#22c55e"
          title={signingAgreementId ? 'Overeenkomst ondertekenen' : 'Contract ondertekenen'}
        />
      )}
    </div>
  );
};

export default PartnerDocuments;
