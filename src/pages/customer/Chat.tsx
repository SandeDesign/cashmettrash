import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Loader2, Plus } from 'lucide-react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../store/chatStore';

const CustomerChat: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    activeConversationId,
    loading,
    subscribeToConversations,
    subscribeToMessages,
    sendMessage,
    createConversation,
    markMessagesAsRead,
    setActiveConversation,
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [creatingNewChat, setCreatingNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to conversations
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToConversations(user.uid, true);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]); // Only re-subscribe when user ID changes

  // Auto-select or create conversation
  useEffect(() => {
    if (!user || conversations.length === 0) return;

    // If no active conversation, select the first one
    if (!activeConversationId) {
      setActiveConversation(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length, activeConversationId, user?.uid]); // Track length, not array reference

  // Create conversation if none exists
  useEffect(() => {
    const initConversation = async () => {
      if (!user || loading || conversations.length > 0) return;

      try {
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
  }, [user?.uid, conversations.length, loading]); // Fixed: only depend on values, not functions

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
      markMessagesAsRead(activeConversationId, user.uid, true);
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
        'customer',
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

  const handleStartNewChat = async () => {
    if (!user || creatingNewChat) return;

    try {
      setCreatingNewChat(true);
      // Force create a new conversation
      const conversationId = await createConversation(
        user.uid,
        user.name,
        user.email
      );
      setActiveConversation(conversationId);
    } catch (error) {
      console.error('Error starting new chat:', error);
      alert('Fout bij aanmaken nieuwe chat');
    } finally {
      setCreatingNewChat(false);
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--vl-bg-primary)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        <Header
          title="Support Chat"
          subtitle="Stel uw vraag en onze support helpt u direct"
          icon={MessageCircle}
          action={
            <button
              onClick={handleStartNewChat}
              disabled={creatingNewChat}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creatingNewChat ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Bezig...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nieuwe Chat</span>
                </>
              )}
            </button>
          }
        />

        <main className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6 pb-28 lg:pb-6">
          <div className="max-w-4xl mx-auto w-full flex flex-col h-full">

            {/* Chat Container */}
            <div className="flex-1 vl-card flex flex-col overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-green-400 mr-3" />
                    <span className="text-neutral-500">Chat laden...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-400 mb-2">Nog geen berichten</p>
                      <p className="text-neutral-600 text-sm">
                        Start het gesprek door hieronder een bericht te sturen
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
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwnMessage
                              ? 'bg-green-500 text-white'
                              : 'bg-white/[0.06] text-white border border-white/[0.1]'
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-semibold mb-1 text-green-400">
                              {msg.sender_name} ({msg.sender_role})
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
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-white/[0.06] p-4">
                <div className="flex gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Typ uw bericht..."
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
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default CustomerChat;
