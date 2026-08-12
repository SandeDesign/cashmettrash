import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import ContractViewer from '../../components/contract/ContractViewer';
import SignaturePad from '../../components/contract/SignaturePad';
import ContractSignedModal from '../../components/contract/ContractSignedModal';
import { useAuth } from '../../hooks/useAuth';
import { useContractStore } from '../../store/contractStore';
import { useBookingStore } from '../../store/bookingStore';
import { useSettingsStore } from '../../store/settingsStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { downloadContractPDF } from '../../utils/pdf';
import { createSubscriptionCheckout } from '../../utils/stripe';

const CustomerContractSigning: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getContractByBooking, getContract, signContract } = useContractStore();
  const { fetchBookingById, extendBooking } = useBookingStore();
  const { settings, loadSettings } = useSettingsStore();

  // Check if this is an extension contract
  const extensionContractId = searchParams.get('extensionContractId');

  const [contract, setContract] = useState<any>(null);
  const [bookingPlanType, setBookingPlanType] = useState<string>('basic');
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Load contract and settings
  useEffect(() => {
    loadSettings();
    if (bookingId) {
      loadContract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const loadContract = async (retries = 5) => {
    if (!bookingId) {
      setError('Geen booking ID');
      setLoading(false);
      return;
    }

    let retrying = false;

    try {
      setLoading(true);
      setError(null);

      // Load extension contract if specified, otherwise load regular contract
      const contractData = extensionContractId
        ? await getContract(extensionContractId)
        : await getContractByBooking(bookingId);

      if (!contractData) {
        // Contract may not be indexed in Firestore yet (race condition after booking creation)
        if (retries > 0) {
          retrying = true;
          setTimeout(() => loadContract(retries - 1), 1000);
          return; // stay in loading state, finally will not clear it
        }
        setError('Contract niet gevonden. Probeer de pagina te verversen.');
        return;
      }

      // Check authorization
      if (user && contractData.customer_id !== user.uid) {
        setError('Geen toegang tot dit contract');
        return;
      }

      setContract(contractData);

      // Fetch booking to get plan_type for correct Stripe price ID
      if (bookingId) {
        const bookingData = await fetchBookingById(bookingId);
        if (bookingData?.plan_type) {
          setBookingPlanType(bookingData.plan_type);
        }
      }
    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError('Fout bij laden contract');
    } finally {
      if (!retrying) {
        setLoading(false);
      }
    }
  };

  const handleSignatureSave = async (signatureDataUrl: string) => {
    if (!contract || !bookingId || !user) return;

    try {
      setSigning(true);

      await signContract(contract.id, signatureDataUrl);

      // Update local state directly — no full reload needed (avoids loading flash)
      setContract((prev: any) => prev ? { ...prev, signed: true, signed_at: new Date().toISOString() } : prev);
      setShowSignaturePad(false);
      setSigning(false);

      if (extensionContractId) {
        await extendBooking(bookingId);
        setShowSuccessModal(true);
      } else {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'pending',
          updated_at: new Date().toISOString()
        });

        const checkoutProxyUrl = settings?.stripe_checkout_proxy_url || 'https://internedata.nl/uploads/vlottr/checkout.php';
        const weeklyRate = settings?.weekly_rental_rate || 140;
        const minWeeks = settings?.minimum_rental_weeks || 4;

        const priceIdMap: Record<string, string> = {
          basic: settings?.stripe_price_id_basic || settings?.stripe_price_id || '',
          half_year: settings?.stripe_price_id_half_year || '',
          year: settings?.stripe_price_id_year || '',
        };
        const priceId = priceIdMap[bookingPlanType] || '';

        setRedirecting(true);

        const result = await createSubscriptionCheckout({
          priceAmount: weeklyRate,
          priceId,
          productName: 'Vlottr Auto Abonnement',
          productDescription: `Wekelijks autohuur abonnement - minimaal ${minWeeks} weken`,
          customerEmail: user.email || '',
          bookingId: bookingId,
          carId: contract.car_id || '',
          successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
          cancelUrl: `${window.location.origin}/payment/cancel?booking_id=${bookingId}`,
          proxyUrl: checkoutProxyUrl
        });

        if (result.error) {
          setRedirecting(false);
          throw new Error(result.error);
        }

        if (result.url) {
          window.location.href = result.url;
        } else {
          setRedirecting(false);
          throw new Error('Geen betaal-URL ontvangen van Stripe');
        }
      }
    } catch (err: any) {
      console.error('Error signing contract:', err);
      setError(err.message || 'Handtekening opslaan gefaald');
      setSigning(false);
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
              <p className="text-neutral-400">Contract laden...</p>
            </div>
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
            <div className="vl-card rounded-lg shadow-sm border border-red-500/50 bg-red-900/20 p-6 max-w-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="font-semibold text-red-400 mb-2">Fout</h2>
                  <p className="text-neutral-300">{error}</p>
                  <button
                    onClick={() => navigate('/bookings')}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Terug naar Boekingen
                  </button>
                </div>
              </div>
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
        <Header
          title="Contract Ondertekenen"
          subtitle="Lees het contract zorgvuldig door en onderteken"
          icon={FileText}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-4xl mx-auto">

            {/* Success Message */}
            {contract.signed && (
              <div className="vl-card rounded-lg shadow-sm border border-green-500/50 bg-green-900/20 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-green-400">Contract ondertekend!</p>
                    <p className="text-sm text-neutral-300 mt-1">
                      Contract ondertekend. U wordt doorgestuurd naar de betaling.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Viewer */}
            <div className="mb-6">
              <ContractViewer contract={contract} showSignatures={true} />
            </div>

            {/* Signature Section */}
            {!contract.signed && (
              <div className="vl-card rounded-lg shadow-sm border border-white/[0.1] p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Ondertekening
                </h2>
                <p className="text-neutral-400 mb-6">
                  Door dit contract te ondertekenen gaat u akkoord met alle bovenstaande voorwaarden
                  en bevestigt u dat u de algemene voorwaarden heeft gelezen en begrepen.
                </p>
                <button
                  onClick={() => setShowSignaturePad(true)}
                  disabled={signing}
                  className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
                >
                  {signing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Bezig met opslaan...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Contract Ondertekenen
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav />

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSignatureSave}
          onCancel={() => setShowSignaturePad(false)}
          loading={signing}
        />
      )}

      {/* Redirecting to payment overlay */}
      {redirecting && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
            <p className="text-white text-lg font-medium">Doorsturen naar betaling...</p>
            <p className="text-neutral-400 text-sm mt-2">Even geduld, u wordt doorgestuurd naar Stripe.</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && contract && (
        <ContractSignedModal
          contractId={contract.contract_id || contract.id}
          isExtension={!!extensionContractId}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/bookings');
          }}
          onDownloadPDF={async () => {
            try {
              await downloadContractPDF(contract);
            } catch (error) {
              console.error('Failed to download PDF:', error);
              setError('Fout bij het genereren van de PDF. Probeer het opnieuw.');
            }
          }}
        />
      )}
    </div>
  );
};

export default CustomerContractSigning;
