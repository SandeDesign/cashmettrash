import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface DeadlineTimerProps {
  endDate: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

const DeadlineTimer: React.FC<DeadlineTimerProps> = ({
  endDate,
  onCancel,
  showCancelButton = true
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    isUrgent: boolean;
  }>({ days: 0, hours: 0, minutes: 0, isUrgent: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, isUrgent: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      // Urgent if less than 3 days
      const isUrgent = days < 3;

      setTimeLeft({ days, hours, minutes, isUrgent });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endDate]);

  // Don't show if more than 7 days left
  if (timeLeft.days > 7) {
    return null;
  }

  const { days, hours, minutes, isUrgent } = timeLeft;

  return (
    <div className={`mt-3 p-3 rounded-lg border ${
      isUrgent
        ? 'bg-red-900 border-red-600'
        : 'bg-yellow-900 border-yellow-600'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
            isUrgent ? 'text-red-500' : 'text-yellow-500'
          }`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold mb-1 ${
              isUrgent ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {isUrgent ? '⚠️ URGENT: Boeking wordt binnenkort automatisch verlengd!' : 'Let op: Automatische verlenging nadert'}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className={`w-4 h-4 ${
                isUrgent ? 'text-red-400' : 'text-yellow-400'
              }`} />
              <span className={`font-medium ${
                isUrgent ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {days > 0 && `${days}d `}
                {hours}u {minutes}m
              </span>
            </div>
            <p className={`text-xs mt-1 ${
              isUrgent ? 'text-red-400/80' : 'text-yellow-400/80'
            }`}>
              {isUrgent
                ? 'Nog minder dan 3 dagen! Boeking wordt automatisch verlengd. Wilt u annuleren?'
                : 'Uw boeking wordt automatisch verlengd. U kunt deze annuleren indien gewenst.'}
            </p>
          </div>
        </div>

        {showCancelButton && onCancel && (
          <button
            onClick={onCancel}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              isUrgent
                ? 'bg-red-500 text-white hover:bg-red-400'
                : 'bg-orange-500 text-white hover:bg-orange-400'
            }`}
          >
            Annuleren
          </button>
        )}
      </div>
    </div>
  );
};

export default DeadlineTimer;
