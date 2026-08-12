import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';

const PaymentCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('booking_id');

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header title="Betaling" />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="vl-card rounded-lg border border-yellow-500/50 bg-yellow-900/20 p-8 max-w-md text-center">
            <XCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Betaling geannuleerd</h2>
            <p className="text-neutral-300 mb-6">
              Je betaling is geannuleerd. Je boeking staat nog open — je kunt de betaling opnieuw proberen via de contractpagina.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {bookingId && (
                <button
                  onClick={() => navigate(`/customer/contract/${bookingId}`)}
                  className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Opnieuw betalen
                </button>
              )}
              <button
                onClick={() => navigate('/bookings')}
                className="px-6 py-3 bg-neutral-600 text-white rounded-md hover:bg-neutral-500 transition-colors"
              >
                Naar mijn boekingen
              </button>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default PaymentCancel;
