import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useBookingStore } from '../../store/bookingStore';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const BorgPaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchBookingById } = useBookingStore();

  const bookingId = searchParams.get('booking_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!bookingId) {
      setErrorMessage('Ongeldige betaallink. Ga terug naar je boekingen.');
      setStatus('error');
      return;
    }

    if (!user) return;

    const processBorgPayment = async () => {
      try {
        const booking = await fetchBookingById(bookingId);

        if (!booking) {
          throw new Error('Boeking niet gevonden.');
        }

        if (booking.customer_id !== user.uid) {
          throw new Error('Geen toegang tot deze boeking.');
        }

        if (booking.borg_confirmed) {
          setStatus('success');
          return;
        }

        await updateDoc(doc(db, 'bookings', bookingId), {
          borg_confirmed: true,
          borg_confirmed_by: 'stripe',
          borg_confirmed_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        });

        setStatus('success');
      } catch (err: any) {
        console.error('Error processing borg payment:', err);
        setErrorMessage(err.message || 'Fout bij het verwerken van de borgbetaling');
        setStatus('error');
      }
    };

    processBorgPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, user]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => navigate('/bookings'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Borgsom betaling" />
        <main className="flex-1 flex items-center justify-center p-4">
          {status === 'loading' && (
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
              <p className="text-neutral-400">Borgbetaling verwerken...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="vl-card rounded-lg border border-green-500/50 bg-green-900/20 p-8 max-w-md text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Borgsom betaald!</h2>
              <p className="text-neutral-300 mb-6">
                De borgsom is ontvangen. Een manager neemt contact op om de overdracht in te plannen.
              </p>
              <button
                onClick={() => navigate('/bookings')}
                className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Naar mijn boekingen
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="vl-card rounded-lg border border-red-500/50 bg-red-900/20 p-8 max-w-md text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Er ging iets mis</h2>
              <p className="text-neutral-300 mb-6">{errorMessage}</p>
              <button
                onClick={() => navigate('/bookings')}
                className="px-6 py-3 bg-neutral-600 text-white rounded-md hover:bg-neutral-500 transition-colors"
              >
                Naar mijn boekingen
              </button>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default BorgPaymentSuccess;
