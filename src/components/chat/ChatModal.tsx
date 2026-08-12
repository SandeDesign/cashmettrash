import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Loader2, X, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../store/chatStore';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
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
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  // Subscribe to conversations
  useEffect(() => {
    if (!user || !isOpen) return;

    const unsubscribe = subscribeToConversations(user.uid, !isAdmin);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, isAdmin, isOpen]); // Only re-subscribe when user ID or role changes

  // Auto-create or select conversation for customers
  useEffect(() => {
    const initConversation = async () => {
      // Only create if NO OPEN conversations exist
      const activeConvs = conversations.filter(c => c.status === 'open');
      if (!user || isAdmin || hasInitialized || !isOpen || activeConvs.length > 0) return;

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
  }, [user?.uid, isAdmin, conversations.length, hasInitialized, isOpen]);

  // Auto-select first ACTIVE conversation for customers + DESELECT if archived/closed
  useEffect(() => {
    if (!user || isAdmin || !isOpen) return;

    // ALWAYS filter to only OPEN conversations
    const activeConvs = conversations.filter(c => c.status === 'open');

    // If current active conversation is archived/closed, DESELECT IT
    if (activeConversationId) {
      const current = conversations.find(c => c.id === activeConversationId);
      if (current && current.status !== 'open') {
        setActiveConversation(null); // FORCE deselect
      }
    }

    // Select first active conversation if none selected
    if (!activeConversationId && activeConvs.length > 0) {
      setActiveConversation(activeConvs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length, activeConversationId, user?.uid, isAdmin, isOpen]); // Track length, not array reference

  // Subscribe to messages
  useEffect(() => {
    if (!activeConversationId || !isOpen) return;

    const unsubscribe = subscribeToMessages(activeConversationId);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, isOpen]); // Only re-subscribe when conversation ID changes

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
    if (!messageText.trim() || !user || sending) return;

    // Check if current conversation is archived OR closed
    const currentConv = conversations.find(c => c.id === activeConversationId);
    const isClosedOrArchived = currentConv?.status === 'archived' || currentConv?.status === 'closed' || !currentConv;

    // If customer tries to send message in archived/closed chat, create new conversation
    if (!isAdmin && isClosedOrArchived) {
      setSending(true);
      try {
        const newConvId = await createConversation(
          user.uid,
          user.name,
          user.email
        );
        setActiveConversation(newConvId);

        // Send message to new conversation
        await sendMessage(
          newConvId,
          user.uid,
          user.name,
          user.role as 'customer' | 'admin' | 'manager',
          messageText
        );
        setMessageText('');
        setActiveTab('active'); // Switch to active tab
      } catch (error) {
        console.error('Error creating new conversation:', error);
        alert('Fout bij starten nieuwe chat.');
      } finally {
        setSending(false);
      }
      return;
    }

    if (!activeConversationId) return;

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

  const getRoleBadge = (role: string) => {
    if (!isAdmin) {
      if (role === 'admin' || role === 'manager') {
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-700 text-green-400">VLOTTR</span>;
      }
      return null;
    }

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

  // ONLY 'open' status is active, everything else is archived/history
  const activeConversations = conversations.filter(c => c.status === 'open');
  const archivedConversations = conversations.filter(c => c.status === 'archived' || c.status === 'closed');
  const displayConversations = activeTab === 'active' ? activeConversations : archivedConversations;

  const activeConversation = isAdmin
    ? displayConversations.find(c => c.id === activeConversationId)
    : displayConversations[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
      <div className="w-full max-w-3xl h-[85vh] bg-[#0d0d0d] border border-neutral-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="border-b border-neutral-700 bg-gradient-to-r from-green-900 to-green-950">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="font-bold text-white">
                  {isAdmin ? 'Support Chat' : 'VLOTTR Support'}
                </h3>
                {isAdmin && activeConversation && (
                  <p className="text-xs text-neutral-500">{activeConversation.customer_name}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs - Only for customers */}
          {!isAdmin && (
            <div className="flex border-t border-neutral-700">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === 'active'
                    ? 'text-white bg-neutral-800 border-b-2 border-green-500'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Actief</span>
                  {activeConversations.length > 0 && (
                    <span className="bg-green-700 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {activeConversations.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === 'history'
                    ? 'text-white bg-neutral-800 border-b-2 border-green-500'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Geschiedenis</span>
                  {archivedConversations.length > 0 && (
                    <span className="bg-neutral-600 text-neutral-300 text-xs font-bold px-2 py-0.5 rounded-full">
                      {archivedConversations.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Admin: Conversation List */}
        {isAdmin && displayConversations.length > 0 && (
          <div className="border-b border-white/[0.06] max-h-32 overflow-y-auto">
            {displayConversations.slice(0, 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`w-full text-left p-3 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors ${
                  activeConversationId === conv.id ? 'bg-white/[0.04]' : ''
                }`}
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
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {conv.unread_count_admin}
                      </span>
                    )}
                  </div>
                </div>
                {conv.last_message && (
                  <p className="text-xs text-neutral-500 truncate mt-1">{conv.last_message}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {activeTab === 'history' ? (
                  <>
                    <Clock className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                    <p className="text-neutral-400 text-sm">Geen gearchiveerde chats</p>
                    <p className="text-neutral-600 text-xs mt-1">
                      Gearchiveerde gesprekken verschijnen hier
                    </p>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto mb-2" />
                    <p className="text-neutral-400 text-sm">Geen actieve chats</p>
                    <p className="text-neutral-600 text-xs mt-1">
                      Start een gesprek met support!
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : messages.length === 0 ? (
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
                        {getRoleBadge(msg.sender_role)}
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

        {/* Input - Disabled for archived chats */}
        <div className="border-t border-neutral-700 p-4 bg-neutral-900">
          {activeTab === 'history' && !isAdmin ? (
            <div className="text-center py-2">
              <p className="text-xs text-neutral-500">
                Deze chat is gearchiveerd. Je kunt geen nieuwe berichten sturen.
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isAdmin ? "Typ uw antwoord..." : "Typ uw vraag..."}
                className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sending}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
