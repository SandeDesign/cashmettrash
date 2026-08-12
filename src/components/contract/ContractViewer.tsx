import React, { useMemo } from 'react';
import { Contract } from '../../types';
import { FileText, Download } from 'lucide-react';
import { generateContractHTML, DEFAULT_CONTRACT_TEMPLATE } from '../../utils/pdf';

interface ContractViewerProps {
  contract: Contract;
  onDownloadPDF?: () => void;
  showSignatures?: boolean;
}

const ContractViewer: React.FC<ContractViewerProps> = ({
  contract,
  onDownloadPDF,
  showSignatures = true
}) => {
  const contractHtml = useMemo(() => {
    const signedDate = contract.signed_at
      ? new Date(contract.signed_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });

    return generateContractHTML(DEFAULT_CONTRACT_TEMPLATE, {
      contract_id: contract.id.substring(0, 8),
      customer_name: contract.customer_name || '',
      customer_email: contract.customer_email || '',
      customer_phone: contract.customer_phone || '',
      customer_address: contract.customer_address || '',
      customer_birth_date: contract.customer_birth_date || '',
      customer_license_number: contract.customer_license_number || '',
      customer_license_category: contract.customer_license_category || 'B',
      customer_license_expiry: contract.customer_license_expiry || '',
      customer_license_issue_date: contract.customer_license_issue_date || '',
      incasso_dag: contract.incasso_dag || 'maandag',
      car_info: contract.car_info || '',
      license_plate: contract.license_plate || 'N/A',
      start_date: new Date(contract.start_date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }),
      end_date: contract.end_date ? new Date(contract.end_date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Open contract',
      weeks_rented: String(contract.weeks_rented || 1),
      weekly_rate: String(contract.weekly_rate || 0),
      total_price: String(contract.total_price || 0),
      current_date: signedDate,
      customer_signature: contract.customer_signature_url || '',
      admin_signature: contract.admin_signature_url || '',
      logo_img: '',
      logo_img_small: '',
      inspectie_ophalen_datum: contract.inspectie?.ophalen?.datum || '',
      inspectie_ophalen_status: contract.inspectie?.ophalen?.status || 'Nog niet gedaan',
      inspectie_inleveren_datum: contract.inspectie?.inleveren?.datum || '',
      inspectie_inleveren_status: contract.inspectie?.inleveren?.status || 'Nog niet gedaan',
      km_ophalen: String(contract.km_ophalen ?? ''),
      km_inleveren: String(contract.km_inleveren ?? ''),
    });
  }, [contract]);
  return (
    <div className="vl-card rounded-lg shadow-sm border border-white/[0.1]">
      {/* Header */}
      <div className="border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-white">
            Huurcontract #{contract.id.slice(0, 8)}
          </h3>
        </div>
        {contract.pdf_url && onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </button>
        )}
      </div>

      {/* Contract Info */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-neutral-300">Klant</label>
            <p className="text-white">{contract.customer_name}</p>
            <p className="text-sm text-neutral-500">{contract.customer_email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-300">Auto</label>
            <p className="text-white">{contract.car_info}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-300">Periode</label>
            <p className="text-white">
              {new Date(contract.start_date).toLocaleDateString('nl-NL')}
              {contract.end_date && ` - ${new Date(contract.end_date).toLocaleDateString('nl-NL')}`}
            </p>
            <p className="text-sm text-neutral-500">{contract.weeks_rented} weken</p>
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-300">Totaal</label>
            <p className="text-2xl font-bold text-blue-600">€{contract.total_price}</p>
            <p className="text-sm text-neutral-500">€{contract.weekly_rate}/week</p>
          </div>
        </div>

        {/* Contract HTML */}
        <div className="border-t pt-6 mb-6">
          <h4 className="text-lg font-semibold text-white mb-4">Contract</h4>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: contractHtml }}
          />
        </div>

        {/* Signatures */}
        {showSignatures && (
          <div className="border-t pt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Handtekeningen</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Signature */}
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">
                  Klant Handtekening
                </label>
                {contract.customer_signature_url ? (
                  <div className="border-2 border-white/[0.12] rounded-lg p-4 vl-card">
                    <img
                      src={contract.customer_signature_url}
                      alt="Klant handtekening"
                      className="max-h-32 mx-auto"
                    />
                    {contract.signed_at && (
                      <p className="text-xs text-neutral-500 text-center mt-2">
                        Getekend op {new Date(contract.signed_at).toLocaleString('nl-NL')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/[0.12] rounded-lg p-4 bg-[var(--vl-bg-primary)]">
                    <p className="text-sm text-neutral-500 text-center">
                      Nog niet getekend
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Signature */}
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">
                  Vlottr Handtekening
                </label>
                {contract.admin_signature_url ? (
                  <div className="border-2 border-white/[0.12] rounded-lg p-4 vl-card">
                    <img
                      src={contract.admin_signature_url}
                      alt="Vlottr handtekening"
                      className="max-h-32 mx-auto"
                    />
                    <p className="text-xs text-neutral-500 text-center mt-2">
                      Namens OSN
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/[0.12] rounded-lg p-4 bg-[var(--vl-bg-primary)]">
                    <p className="text-sm text-neutral-500 text-center">
                      Geen handtekening
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="mt-6 flex justify-center">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            contract.status === 'completed' ? 'bg-green-100 text-green-800' :
            contract.status === 'signed' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {contract.status === 'completed' ? 'Voltooid' :
             contract.status === 'signed' ? 'Getekend' :
             'In afwachting'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContractViewer;
