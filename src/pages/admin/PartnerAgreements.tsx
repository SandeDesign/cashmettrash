import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Handshake, FileText, Eye, Download, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { generatePartnerContractHtml } from './Partners';
import DOMPurify from 'dompurify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { db } from '../../lib/firebase';
import { PartnerContract, Contract } from '../../types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

type ActiveTab = 'contracten' | 'overeenkomsten';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending:    { label: 'In behandeling', className: 'vl-badge-yellow', icon: <Clock className="w-3 h-3" /> },
    signed:     { label: 'Getekend',       className: 'vl-badge-green',  icon: <CheckCircle className="w-3 h-3" /> },
    active:     { label: 'Actief',         className: 'vl-badge-green',  icon: <CheckCircle className="w-3 h-3" /> },
    completed:  { label: 'Afgerond',       className: 'vl-badge-blue',   icon: <CheckCircle className="w-3 h-3" /> },
    terminated: { label: 'Beëindigd',      className: 'vl-badge-red',    icon: <XCircle className="w-3 h-3" /> },
  };
  const cfg = map[status] ?? { label: status, className: 'vl-badge-blue', icon: null };
  return (
    <span className={`vl-badge ${cfg.className} flex items-center gap-1`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

const PartnerAgreements: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('contracten');
  const [partnerContracts, setPartnerContracts] = useState<PartnerContract[]>([]);
  const [partnerAgreements, setPartnerAgreements] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<{ html: string; title: string } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [contractsSnap, agreementsSnap] = await Promise.all([
          getDocs(query(collection(db, 'partner_contracts'), orderBy('created_at', 'desc'))),
          getDocs(query(collection(db, 'contracts'), where('contract_type', '==', 'partner_agreement'), orderBy('created_at', 'desc'))),
        ]);
        setPartnerContracts(contractsSnap.docs.map(d => ({ id: d.id, ...d.data() } as PartnerContract)));
        setPartnerAgreements(agreementsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Contract)));
      } catch (err) {
        console.error('Laden overeenkomsten mislukt:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: nl });
    } catch {
      return dateStr;
    }
  };

  const downloadAsPdf = async () => {
    if (!selectedContract) return;
    setDownloadingPdf(true);
    try {
      const container = document.getElementById('agreement-preview-content');
      if (!container) return;
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#000000' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgH = pageW / ratio;
      let yOffset = 0;
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pageW, imgH);
        yOffset += pageH;
      }
      pdf.save(`${selectedContract.title.replace(/\s+/g, '_')}.pdf`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'contracten', label: 'Autocontracten' },
    { id: 'overeenkomsten', label: 'Partnerovereenkomsten' },
  ];

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Overeenkomsten"
          subtitle="Partner contracten en samenwerkingsovereenkomsten"
          icon={Handshake}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-6xl mx-auto">

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl mb-6 border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-green-500 text-neutral-950'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Partnercontracten */}
                {activeTab === 'contracten' && (
                  <div className="vl-card rounded-xl overflow-hidden border border-white/[0.08]">
                    {partnerContracts.length === 0 ? (
                      <div className="text-center py-16">
                        <FileText className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                        <p className="text-neutral-400">Geen partnercontracten gevonden</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Partner</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Bedrijf</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Datum</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {partnerContracts.map(c => (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-white">{c.partner_name}</p>
                                <p className="text-xs text-neutral-500">{c.partner_email}</p>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className="text-sm text-neutral-300">{c.partner_company}</span>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-sm text-neutral-400">{formatDate(c.created_at)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={c.status} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => {
                                    const html = generatePartnerContractHtml({
                                      partner_company: c.partner_company,
                                      partner_name: c.partner_name,
                                      partner_email: c.partner_email,
                                      car_info: c.car_info,
                                      license_plate: c.license_plate,
                                      purchase_price: c.purchase_price ? String(c.purchase_price).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : undefined,
                                      current_date: c.signed_at
                                        ? new Date(c.signed_at).toLocaleDateString('nl-NL')
                                        : new Date(c.created_at).toLocaleDateString('nl-NL'),
                                      admin_signature: c.admin_signature_url
                                        ? `<img src="${c.admin_signature_url}" alt="Handtekening" style="max-height:70px;" />`
                                        : undefined,
                                      partner_signature: c.partner_signature_url
                                        ? `<img src="${c.partner_signature_url}" alt="Handtekening partner" style="max-height:70px;" />`
                                        : undefined,
                                    });
                                    setSelectedContract({ html, title: `Autocontract_${c.partner_name}` });
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors px-3 py-1.5 rounded-lg border border-green-500/20 hover:border-green-500/40"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Bekijken
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Partnerovereenkomsten */}
                {activeTab === 'overeenkomsten' && (
                  <div className="vl-card rounded-xl overflow-hidden border border-white/[0.08]">
                    {partnerAgreements.length === 0 ? (
                      <div className="text-center py-16">
                        <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                        <p className="text-neutral-400">Geen partnerovereenkomsten gevonden</p>
                        <p className="text-xs text-neutral-600 mt-1">Partnerovereenkomsten worden ondertekend tijdens het onboarding-proces</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Partner</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Datum</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {partnerAgreements.map(c => (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3">
                                <p className="text-sm font-medium text-white">{c.customer_name}</p>
                                <p className="text-xs text-neutral-500">{c.customer_email}</p>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-sm text-neutral-400">{formatDate(c.created_at)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={c.status} />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => setSelectedContract({ html: c.contract_html, title: `Overeenkomst_${c.customer_name}` })}
                                  className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors px-3 py-1.5 rounded-lg border border-green-500/20 hover:border-green-500/40"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Bekijken
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Contract Preview Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="vl-card rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-white/[0.12] shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-white text-sm">{selectedContract.title.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadAsPdf}
                  disabled={downloadingPdf}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-500 text-neutral-950 font-semibold hover:bg-green-400 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingPdf ? 'Bezig...' : 'PDF downloaden'}
                </button>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contract content */}
            <div className="flex-1 overflow-y-auto rounded-b-2xl" style={{ background: '#000000' }}>
              <div
                id="agreement-preview-content"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedContract.html) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerAgreements;
