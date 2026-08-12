import React, { useState } from 'react';
import { MessageCircle, HelpCircle, X, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../../store/chatStore';
import { useBookingStore } from '../../store/bookingStore';
import { useAuth } from '../../hooks/useAuth';

interface SupportMenuProps {
  onChatOpen: () => void;
}

const SupportMenu: React.FC<SupportMenuProps> = ({ onChatOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations } = useChatStore();
  const { bookings } = useBookingStore();

  // Unread count - ONLY from OPEN conversations
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const activeConversations = conversations.filter(c => c.status === 'open');
  const unreadCount = isAdmin
    ? activeConversations.reduce((sum, c) => sum + c.unread_count_admin, 0)
    : activeConversations.reduce((sum, c) => sum + c.unread_count_customer, 0);

  const handleChatClick = () => {
    setIsOpen(false);
    onChatOpen();
  };

  const handleFAQClick = () => {
    setIsOpen(false);
    navigate('/faq');
  };

  const handleGarageClick = () => {
    setIsOpen(false);
    navigate('/garage');
  };

  // Check if customer has active booking (for garage option)
  const hasActiveBooking = user?.role === 'customer' && bookings.some(
    b => b.customer_id === user.uid && (b.status === 'active' || b.status === 'confirmed')
  );

  return (
    <div className="relative" data-tour="support">
      {/* Support Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
        aria-label="Support menu"
      >
        <HelpCircle className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg shadow-green-500/50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-12 z-50 w-64 bg-[#0d0d0d] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-green-900 to-transparent">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Support</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Chat */}
              <button
                onClick={handleChatClick}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors text-left"
              >
                <div className="relative">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">Live Chat</p>
                  <p className="text-xs text-neutral-500">Chat met support</p>
                </div>
              </button>

              {/* Garage - Only for customers with active booking */}
              {hasActiveBooking && (
                <button
                  onClick={handleGarageClick}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors text-left"
                >
                  <Wrench className="w-5 h-5 text-amber-400" />
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">Garage</p>
                    <p className="text-xs text-neutral-500">Onderhoud afspraak maken</p>
                  </div>
                </button>
              )}

              {/* FAQ */}
              <button
                onClick={handleFAQClick}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors text-left"
              >
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">FAQ</p>
                  <p className="text-xs text-neutral-500">Veelgestelde vragen</p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/[0.06] bg-white/[0.02]">
              <p className="text-xs text-neutral-600 text-center">
                Hulp nodig? We helpen je graag!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupportMenu;
