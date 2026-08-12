import React, { useEffect, useState } from 'react';
import { MessageCircle, Search, Archive, Trash2, CheckCircle, XCircle, Eye, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import BottomNav from '../../components/layout/BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { useChatStore } from '../../store/chatStore';
import { useModal } from '../../contexts/ModalContext';

const ChatManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    conversations,
    messages,
    subscribeToConversations,
    subscribeToMessages,
    deleteConversation,
    archiveConversation,
    unarchiveConversation,
    closeConversation,
    setActiveConversation,
  } = useChatStore();
  const { showConfirm, showSuccess, showError } = useModal();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'closed' | 'archived'>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  // Subscribe to conversations
  useEffect(() => {
    if (!user || !isAdmin) return;

    const unsubscribe = subscribeToConversations(user.uid, false);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, isAdmin]); // Only re-subscribe when user ID or role changes

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedConversationId) return;

    const unsubscribe = subscribeToMessages(selectedConversationId);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]); // Only re-subscribe when conversation ID changes

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch =
      conv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || conv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (conversationId: string) => {
    await showConfirm(
      'Gesprek verwijderen',
      'Weet je zeker dat je dit gesprek wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
      async () => {
        setDeletingId(conversationId);
        try {
          await deleteConversation(conversationId);
          if (selectedConversationId === conversationId) {
            setSelectedConversationId(null);
          }
          showSuccess('Gesprek verwijderd!');
        } catch (error) {
          console.error('Error deleting conversation:', error);
          showError('Fout bij verwijderen gesprek.');
        } finally {
          setDeletingId(null);
        }
      },
      'error'
    );
  };

  const handleArchive = async (conversationId: string) => {
    try {
      await archiveConversation(conversationId);
      showSuccess('Gesprek gearchiveerd!');
    } catch (error) {
      console.error('Error archiving conversation:', error);
      showError('Fout bij archiveren gesprek.');
    }
  };

  const handleUnarchive = async (conversationId: string) => {
    try {
      await unarchiveConversation(conversationId);
      showSuccess('Gesprek hersteld!');
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      showError('Fout bij herstellen gesprek.');
    }
  };

  const handleClose = async (conversationId: string) => {
    try {
      await closeConversation(conversationId);
      showSuccess('Gesprek gesloten!');
    } catch (error) {
      console.error('Error closing conversation:', error);
      showError('Fout bij sluiten gesprek.');
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">Admin</span>;
      case 'manager':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">Manager</span>;
      case 'customer':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400">Klant</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-500/20 text-green-400">Open</span>;
      case 'closed':
        return <span className="px-2 py-1 rounded-md text-xs font-bold bg-neutral-500/20 text-neutral-400">Gesloten</span>;
      case 'archived':
        return <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-400">Gearchiveerd</span>;
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return <div className="min-h-screen bg-[var(--vl-bg-primary)] flex items-center justify-center">
      <p className="text-white">Geen toegang</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[var(--vl-bg-primary)]">
      <div className="flex">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header
            title="Chat Management"
            subtitle={`Beheer alle chat gesprekken (${conversations.length} totaal)`}
            icon={MessageCircle}
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto">

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Zoek op naam of email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {(['all', 'open', 'closed', 'archived'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      selectedStatus === status
                        ? 'bg-green-500 text-white'
                        : 'bg-white/[0.06] text-neutral-400 hover:bg-white/[0.1]'
                    }`}
                  >
                    {status === 'all' ? 'Alle' : status === 'open' ? 'Open' : status === 'closed' ? 'Gesloten' : 'Gearchiveerd'}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversations List */}
              <div className="bg-white/[0.03] border border-white/[0.1] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/[0.06]">
                  <h2 className="font-bold text-white">
                    Gesprekken ({filteredConversations.length})
                  </h2>
                </div>

                <div className="overflow-y-auto max-h-[600px]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                      <p className="text-neutral-400">Geen gesprekken gevonden</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors ${
                          selectedConversationId === conv.id ? 'bg-white/[0.04]' : ''
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-sm mb-1">{conv.customer_name}</h3>
                              <p className="text-xs text-neutral-500">{conv.customer_email}</p>
                            </div>
                            {getStatusBadge(conv.status)}
                          </div>

                          {conv.last_message && (
                            <p className="text-sm text-neutral-400 mb-3 line-clamp-2">{conv.last_message}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {conv.unread_count_admin > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  {conv.unread_count_admin} nieuw
                                </span>
                              )}
                              <p className="text-xs text-neutral-600">
                                {new Date(conv.created_at).toLocaleDateString('nl-NL')}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setActiveConversation(conv.id);
                                  navigate('/admin/chat');
                                }}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded-md transition-colors text-xs font-semibold text-white"
                                title="Open gesprek"
                              >
                                Open Chat
                              </button>

                              {conv.status === 'open' && (
                                <button
                                  onClick={() => handleClose(conv.id)}
                                  className="p-1.5 hover:bg-neutral-500/20 rounded transition-colors"
                                  title="Sluiten"
                                >
                                  <CheckCircle className="w-4 h-4 text-neutral-400" />
                                </button>
                              )}

                              {conv.status !== 'archived' ? (
                                <button
                                  onClick={() => handleArchive(conv.id)}
                                  className="p-1.5 hover:bg-blue-500/20 rounded transition-colors"
                                  title="Archiveren"
                                >
                                  <Archive className="w-4 h-4 text-blue-400" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnarchive(conv.id)}
                                  className="p-1.5 hover:bg-blue-500/20 rounded transition-colors"
                                  title="Herstellen"
                                >
                                  <RotateCcw className="w-4 h-4 text-blue-400" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDelete(conv.id)}
                                disabled={deletingId === conv.id}
                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                                title="Verwijderen"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Message Log */}
              <div className="bg-white/[0.03] border border-white/[0.1] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/[0.06]">
                  <h2 className="font-bold text-white">
                    {selectedConversation ? `Gesprek met ${selectedConversation.customer_name}` : 'Selecteer een gesprek'}
                  </h2>
                </div>

                <div className="overflow-y-auto max-h-[600px] p-4">
                  {!selectedConversation ? (
                    <div className="flex items-center justify-center h-full py-20">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                        <p className="text-neutral-400">Selecteer een gesprek om berichten te bekijken</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-20">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                        <p className="text-neutral-400">Nog geen berichten</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className="bg-white/[0.03] border border-white/[0.1] rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-sm">{msg.sender_name}</p>
                              {getRoleBadge(msg.sender_role)}
                            </div>
                            <p className="text-xs text-neutral-500">
                              {new Date(msg.created_at).toLocaleString('nl-NL')}
                            </p>
                          </div>
                          <p className="text-neutral-300 text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ChatManagement;
