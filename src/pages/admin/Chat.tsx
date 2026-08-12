import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Loader2, Users, X } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../store/chatStore';

const AdminChat: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    activeConversationId,
    loading,
    subscribeToConversations,
    subscribeToMessages,
    sendMessage,
    markMessagesAsRead,
    setActiveConversation,
    closeConversation,
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to all conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.uid, false);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only re-subscribe when user ID changes

  // Subscribe to messages when conversation is active
  useEffect(() => {
    if (!activeConversationId) return;

    const unsubscribe = subscribeToMessages(activeConversationId);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]); // Only re-subscribe when conversation ID changes

  // Mark messages as read when viewing
  useEffect(() => {
    if (!activeConversationId || !user) return;

    const timer = setTimeout(() => {
      markMessagesAsRead(activeConversationId, user.uid, false);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, user?.uid, messages.length]); // Track length, not array reference

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConversationId || !user || sending) return;

    setSending(true);
    try {
      await sendMessage(
        activeConversationId,
        user.uid,
        user.name,
        user.role as 'admin' | 'manager',
        messageText
      );
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Fout bij verzenden bericht. Probeer opnieuw.');
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

  const handleCloseConversation = async (conversationId: string) => {
    if (!confirm('Weet u zeker dat u dit gesprek wilt sluiten?')) return;

    try {
      await closeConversation(conversationId);
      if (activeConversationId === conversationId) {
        setActiveConversation(null);
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
      alert('Fout bij sluiten gesprek.');
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Admin Chat"
          subtitle="Beheer klant support gesprekken"
        />

        <main className="flex-1 flex overflow-hidden p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-7xl mx-auto w-full flex gap-4 h-full">
            {/* Conversations List */}
            <div className="w-80 vl-card flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-bold text-white">Gesprekken</h2>
                </div>
                <p className="text-xs text-neutral-500">
                  {conversations.filter(c => c.status === 'open').length} actief
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading && conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-500 text-sm">Nog geen gesprekken</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversation(conv.id)}
                      className={`w-full text-left p-4 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors ${
                        activeConversationId === conv.id ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-white text-sm">
                          {conv.customer_name}
                        </p>
                        {conv.unread_count_admin > 0 && (
                          <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {conv.unread_count_admin}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mb-1">
                        {conv.customer_email}
                      </p>
                      {conv.last_message && (
                        <p className="text-sm text-neutral-400 truncate">
                          {conv.last_message}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-neutral-600">
                          {conv.last_message_at
                            ? new Date(conv.last_message_at).toLocaleDateString('nl-NL', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : new Date(conv.created_at).toLocaleDateString('nl-NL', {
                                day: '2-digit',
                                month: 'short',
                              })}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            conv.status === 'open'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-neutral-500/10 text-neutral-500'
                          }`}
                        >
                          {conv.status === 'open' ? 'Actief' : 'Gesloten'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 vl-card flex flex-col overflow-hidden">
              {!activeConversationId ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">Selecteer een gesprek</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white">
                        {activeConversation?.customer_name}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {activeConversation?.customer_email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCloseConversation(activeConversationId)}
                      className="text-neutral-500 hover:text-red-500 transition-colors"
                      title="Gesprek sluiten"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.sender_id === user?.uid;

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwnMessage
                                ? 'bg-green-500 text-white'
                                : 'bg-white/[0.06] text-white border border-white/[0.1]'
                            }`}
                          >
                            {!isOwnMessage && (
                              <p className="text-xs font-semibold mb-1 text-green-400">
                                {msg.sender_name}
                              </p>
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
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="border-t border-white/[0.06] p-4">
                    <div className="flex gap-2">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Typ uw antwoord..."
                        className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        rows={2}
                        disabled={sending}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sending}
                        className="bg-green-500 text-white px-6 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {sending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">
                      Druk op Enter om te verzenden, Shift+Enter voor een nieuwe regel
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default AdminChat;
