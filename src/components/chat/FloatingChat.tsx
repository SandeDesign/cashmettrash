import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Loader2, X, Minimize2, Trash2, CheckCircle, Archive } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../store/chatStore';

interface FloatingChatProps {
  isAdmin?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

const FloatingChat: React.FC<FloatingChatProps> = ({
  isAdmin = false,
  isOpen: controlledIsOpen,
  onToggle
}) => {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    activeConversationId,
    subscribeToConversations,
    subscribeToMessages,
    sendMessage,
    createConversation,
    markMessagesAsRead,
    setActiveConversation,
    deleteConversation,
    closeConversation,
    archiveConversation,
  } = useChatStore();

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.uid, !isAdmin);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, isAdmin]); // Only re-subscribe when user ID or role changes

  // Auto-create or select conversation for customers
  useEffect(() => {
    const initConversation = async () => {
      if (!user || isAdmin || hasInitialized || conversations.length > 0) return;

      try {
        setHasInitialized(true);
        const conversationId = await createConversation(
          user.uid,
          user.name,
          user.email
        );
        setActiveConversation(conversationId);
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    };

    initConversation();
  }, [user?.uid, isAdmin, conversations.length, hasInitialized]);

  // Auto-select first conversation for customers
  useEffect(() => {
    if (!user || isAdmin || activeConversationId || conversations.length === 0) return;
    setActiveConversation(conversations[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length, activeConversationId, user?.uid, isAdmin]); // Track length, not array reference

  // Subscribe to messages
  useEffect(() => {
    if (!activeConversationId) return;

    const unsubscribe = subscribeToMessages(activeConversationId);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]); // Only re-subscribe when conversation ID changes

  // Mark as read
  useEffect(() => {
    if (!activeConversationId || !user || !isOpen) return;

    const timer = setTimeout(() => {
      // IMPORTANT: markMessagesAsRead expects isCustomer, so we pass !isAdmin
      markMessagesAsRead(activeConversationId, user.uid, !isAdmin);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, user?.uid, messages.length, isOpen, isAdmin]); // Track length, not array reference

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConversationId || !user || sending) return;

    setSending(true);
    try {
      await sendMessage(
        activeConversationId,
        user.uid,
        user.name,
        user.role as 'customer' | 'admin' | 'manager',
        messageText
      );
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Fout bij verzenden bericht.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Unread count - only from non-archived conversations
  const unreadCount = isAdmin
    ? activeConversations.reduce((sum, c) => sum + c.unread_count_admin, 0)
    : activeConversations.reduce((sum, c) => sum + c.unread_count_customer, 0);

  const getRoleBadge = (role: string, senderName: string) => {
    // If viewing as customer, don't show admin/manager roles - just show VLOTTR Support
    if (!isAdmin) {
      if (role === 'admin' || role === 'manager') {
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-700 text-green-400">VLOTTR</span>;
      }
      return null; // Customer's own messages don't need a badge
    }

    // Admin/Manager view - show who responded
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-700 text-red-400">Admin</span>;
      case 'manager':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-700 text-blue-400">Manager</span>;
      case 'customer':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-700 text-green-400">Klant</span>;
      default:
        return null;
    }
  };

  const activeConversation = isAdmin
    ? activeConversations.find(c => c.id === activeConversationId)
    : activeConversations[0];

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm('Weet je zeker dat je dit gesprek wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }

    setDeletingId(conversationId);
    try {
      await deleteConversation(conversationId);
      alert('Gesprek verwijderd!');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Fout bij verwijderen gesprek.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseConversation = async (conversationId: string) => {
    try {
      await closeConversation(conversationId);
      alert('Gesprek gesloten!');
    } catch (error) {
      console.error('Error closing conversation:', error);
      alert('Fout bij sluiten gesprek.');
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    if (!window.confirm('Weet je zeker dat je dit gesprek wilt archiveren? Het verdwijnt uit deze lijst (maar blijft zichtbaar in Chat Management).')) {
      return;
    }

    try {
      await archiveConversation(conversationId);
      alert('Gesprek gearchiveerd!');
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Fout bij archiveren gesprek.');
    }
  };

  // Filter out archived conversations from the floating chat
  const activeConversations = conversations.filter(c => c.status !== 'archived');

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-400 transition-all duration-300 hover:scale-110"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {isOpen ? (
          <Minimize2 className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[60] w-[90vw] max-w-md h-[500px] bg-[#0d0d0d] border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-gradient-to-r from-green-900 to-transparent">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="font-bold text-white text-sm">
                  {isAdmin ? 'Support Chat' : 'VLOTTR Support'}
                </h3>
                {isAdmin && activeConversation && (
                  <p className="text-xs text-neutral-500">{activeConversation.customer_name}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin: Conversation List */}
          {isAdmin && activeConversations.length > 0 && (
            <div className="border-b border-white/[0.06] max-h-40 overflow-y-auto">
              {activeConversations.slice(0, 3).map((conv) => (
                <div
                  key={conv.id}
                  className={`border-b border-white/[0.06] ${
                    activeConversationId === conv.id ? 'bg-white/[0.04]' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <button
                      onClick={() => setActiveConversation(conv.id)}
                      className="flex-1 text-left p-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">{conv.customer_name}</p>
                        <div className="flex items-center gap-2">
                          {conv.status === 'closed' && (
                            <span className="bg-neutral-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              Gesloten
                            </span>
                          )}
                          {conv.unread_count_admin > 0 && (
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {conv.unread_count_admin}
                            </span>
                          )}
                        </div>
                      </div>
                      {conv.last_message && (
                        <p className="text-xs text-neutral-500 truncate mt-1">{conv.last_message}</p>
                      )}
                    </button>

                    {/* Admin Actions */}
                    <div className="flex items-center gap-1 pr-2">
                      {conv.status === 'open' && (
                        <button
                          onClick={() => handleCloseConversation(conv.id)}
                          className="p-1.5 hover:bg-green-700 rounded transition-colors"
                          title="Gesprek sluiten"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleArchiveConversation(conv.id)}
                        className="p-1.5 hover:bg-blue-700 rounded transition-colors"
                        title="Gesprek archiveren"
                      >
                        <Archive className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteConversation(conv.id)}
                        disabled={deletingId === conv.id}
                        className="p-1.5 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
                        title="Gesprek verwijderen"
                      >
                        {deletingId === conv.id ? (
                          <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-400 text-sm">Nog geen berichten</p>
                  <p className="text-neutral-600 text-xs mt-1">
                    {isAdmin ? 'Wacht op berichten' : 'Start het gesprek!'}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.sender_id === user?.uid;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl p-3 ${
                        isOwnMessage
                          ? 'bg-green-500 text-white'
                          : 'bg-white/[0.06] text-white border border-white/[0.1]'
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-bold text-green-400">
                            {isAdmin ? msg.sender_name : 'VLOTTR Support'}
                          </p>
                          {getRoleBadge(msg.sender_role, msg.sender_name)}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? 'text-white/70' : 'text-neutral-500'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/[0.06] p-3 bg-white/[0.02]">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAdmin ? "Typ uw antwoord..." : "Typ uw vraag..."}
                className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={sending || (!isAdmin && !activeConversationId)}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sending || (!isAdmin && !activeConversationId)}
                className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
