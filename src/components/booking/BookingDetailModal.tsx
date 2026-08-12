import React from 'react';
import { X, Calendar, Clock, Car as CarIcon, User, DollarSign, MapPin, Phone, Mail, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Booking, Car } from '../../types';

interface BookingDetailModalProps {
  booking: Booking;
  car?: Car | null;
  isOpen: boolean;
  onClose: () => void;
  onExtend?: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, car, isOpen, onClose, onExtend }) => {
  if (!isOpen) return null;

  // Show extend button only for active or confirmed bookings
  const canExtend = booking.status === 'active' || booking.status === 'confirmed';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'confirmed': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-neutral-700/50 text-neutral-300 border-white/[0.1]';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-neutral-700/50 text-neutral-300 border-white/[0.1]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actief';
      case 'confirmed': return 'Bevestigd';
      case 'pending': return 'In afwachting';
      case 'completed': return 'Voltooid';
      case 'cancelled': return 'Geannuleerd';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'failed': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-neutral-700/50 text-neutral-300 border-white/[0.1]';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Betaald';
      case 'pending': return 'In afwachting';
      case 'failed': return 'Mislukt';
      case 'refunded': return 'Terugbetaald';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
      <div className="bg-[var(--vl-bg-primary)] rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/[0.1]">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--vl-bg-primary)] border-b border-white/[0.1] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Boeking Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.08] rounded-full transition-colors text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Car Details */}
          <div className="border border-white/[0.1] rounded-lg p-4">
            <div className="flex items-center mb-4">
              <CarIcon className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="font-semibold text-white">Auto Informatie</h3>
            </div>
            {car ? (
              <div className="flex items-start gap-4">
                {car.images && car.images.length > 0 && (
                  <img
                    src={car.images[0]}
                    alt={`${car.brand} ${car.model}`}
                    className="w-28 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg text-white">{car.brand} {car.model}</h4>
                  <p className="text-neutral-400 text-sm mb-3">{car.year} • {car.license_plate}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    {car.specs?.transmission && (
                      <div className="flex gap-1">
                        <span className="text-neutral-500">Transmissie:</span>
                        <span className="text-white font-medium">{car.specs.transmission}</span>
                      </div>
                    )}
                    {car.specs?.fuel_type && (
                      <div className="flex gap-1">
                        <span className="text-neutral-500">Brandstof:</span>
                        <span className="text-white font-medium">{car.specs.fuel_type}</span>
                      </div>
                    )}
                    {car.specs?.seats && (
                      <div className="flex gap-1">
                        <span className="text-neutral-500">Stoelen:</span>
                        <span className="text-white font-medium">{car.specs.seats}</span>
                      </div>
                    )}
                    {car.specs?.color && (
                      <div className="flex gap-1">
                        <span className="text-neutral-500">Kleur:</span>
                        <span className="text-white font-medium">{car.specs.color}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">Auto informatie niet beschikbaar</p>
            )}
          </div>

          {/* Rental Period */}
          <div className="border border-white/[0.1] rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="font-semibold text-white">Huurperiode</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Startdatum</p>
                <p className="font-medium text-white text-sm">{formatDate(booking.start_date)}</p>
              </div>
              {booking.end_date && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Einddatum</p>
                  <p className="font-medium text-white text-sm">{formatDate(booking.end_date)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-neutral-500 mb-1">Duur</p>
                <p className="font-medium text-white text-sm">{booking.weeks_rented} {booking.weeks_rented === 1 ? 'week' : 'weken'}</p>
              </div>
              {booking.pickup_type && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Ophaaltype</p>
                  <p className="font-medium text-white text-sm capitalize">{booking.pickup_type}</p>
                </div>
              )}
            </div>
          </div>

          {/* Inspection Status */}
          {(booking.pickup_inspection_form_id || booking.return_inspection_form_id) && (
            <div className="border border-white/[0.1] rounded-lg p-4">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-green-400 mr-2" />
                <h3 className="font-semibold text-white">Inspectie Status</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {booking.pickup_inspection_form_id ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-500" />
                  )}
                  <span className={`text-sm ${booking.pickup_inspection_form_id ? 'text-green-400' : 'text-neutral-500'}`}>
                    Ophaal inspectie
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {booking.return_inspection_form_id ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-500" />
                  )}
                  <span className={`text-sm ${booking.return_inspection_form_id ? 'text-green-400' : 'text-neutral-500'}`}>
                    Inlever inspectie
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Lock Period Badge */}
          {booking.lock_period && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-400 mb-1">🔒 VASTZETPERIODE</p>
                  <p className="text-white font-bold mb-2">
                    {booking.lock_period === '6_months' ? '6 Maanden' : '12 Maanden'} Commitment
                  </p>
                  {booking.lock_period_start_date && booking.lock_period_end_date && (
                    <div className="text-sm text-green-300 space-y-1">
                      <div>
                        <span className="text-neutral-400">Start:</span> {formatDate(booking.lock_period_start_date)}
                      </div>
                      <div>
                        <span className="text-neutral-400">Einde:</span> {formatDate(booking.lock_period_end_date)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="border border-white/[0.1] rounded-lg p-4">
            <div className="flex items-center mb-4">
              <DollarSign className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="font-semibold text-white">Prijsinformatie</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Weekprijs</span>
                <span className="font-medium text-white">€{booking.weekly_rate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Aantal weken</span>
                <span className="font-medium text-white">{booking.weeks_rented}</span>
              </div>
              <div className="border-t border-white/[0.08] pt-2 flex justify-between">
                <span className="font-semibold text-white">Totaal</span>
                <span className="font-bold text-xl text-green-400">€{booking.total_price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border border-white/[0.1] rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="font-semibold text-white">Status</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <p className="text-xs text-neutral-500 mb-1">Boeking</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1">Betaling</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(booking.payment_status)}`}>
                  {getPaymentStatusText(booking.payment_status)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border border-white/[0.1] rounded-lg p-4">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-green-400 mr-2" />
              <h3 className="font-semibold text-white">Contact Informatie</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <span className="text-white">{booking.customer_snapshot?.name || booking.customer_name || 'Onbekende klant'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <span className="text-white">{booking.customer_snapshot?.email || booking.customer_email || 'Geen email'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <span className="text-white">{booking.customer_snapshot?.phone || booking.customer_phone || 'Geen telefoon'}</span>
              </div>
              {booking.delivery_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{booking.delivery_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking ID */}
          <div className="text-xs text-neutral-600 text-center">
            Boeking ID: {booking.id}
          </div>

          {/* Cancellation Reason */}
          {booking.cancellation_reason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-300 mb-1">Reden van annulering</p>
              <p className="text-sm text-red-400">{booking.cancellation_reason}</p>
              {booking.cancelled_at && (
                <p className="text-xs text-red-500 mt-2">
                  Geannuleerd op: {formatDate(booking.cancelled_at)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--vl-bg-primary)] border-t border-white/[0.1] px-6 py-4">
          <div className={`flex gap-3 ${canExtend && onExtend ? 'flex-col sm:flex-row' : ''}`}>
            {canExtend && onExtend && (
              <button
                onClick={onExtend}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Verlengen (6 mnd + 1 mnd korting)
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors font-medium"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
