import { create } from 'zustand';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  getDocs,
  writeBatch,
  deleteDoc,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatMessage, ChatConversation } from '../types';

interface ChatStore {
  conversations: ChatConversation[];
  messages: ChatMessage[];
  activeConversationId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  subscribeToConversations: (userId: string, isCustomer: boolean) => () => void;
  subscribeToMessages: (conversationId: string) => () => void;
  sendMessage: (conversationId: string, senderId: string, senderName: string, senderRole: 'customer' | 'admin' | 'manager', message: string) => Promise<void>;
  createConversation: (customerId: string, customerName: string, customerEmail: string) => Promise<string>;
  markMessagesAsRead: (conversationId: string, userId: string, isCustomer: boolean) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  closeConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  unarchiveConversation: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  messages: [],
  activeConversationId: null,
  loading: false,
  error: null,

  subscribeToConversations: (userId: string, isCustomer: boolean) => {
    set({ loading: true });

    const conversationsRef = collection(db, 'chat_conversations');
    const q = isCustomer
      ? query(conversationsRef, where('customer_id', '==', userId), orderBy('updated_at', 'desc'))
      : query(conversationsRef, orderBy('updated_at', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const conversations = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            customer_id: data.customer_id,
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            status: data.status,
            last_message: data.last_message,
            last_message_at: data.last_message_at?.toDate?.()?.toISOString() || data.last_message_at,
            unread_count_customer: data.unread_count_customer || 0,
            unread_count_admin: data.unread_count_admin || 0,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
          } as ChatConversation;
        });

        set({ conversations, loading: false, error: null });
      },
      (error) => {
        console.error('Error subscribing to conversations:', error);
        set({ error: error.message, loading: false });
      }
    );

    return unsubscribe;
  },

  subscribeToMessages: (conversationId: string) => {
    const messagesRef = collection(db, 'chat_messages');
    const q = query(
      messagesRef,
      where('conversation_id', '==', conversationId),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            conversation_id: data.conversation_id,
            sender_id: data.sender_id,
            sender_name: data.sender_name,
            sender_role: data.sender_role,
            message: data.message,
            read: data.read || false,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          } as ChatMessage;
        });

        set({ messages });
      },
      (error) => {
        console.error('Error subscribing to messages:', error);
        set({ error: error.message });
      }
    );

    return unsubscribe;
  },

  sendMessage: async (conversationId: string, senderId: string, senderName: string, senderRole: 'customer' | 'admin' | 'manager', message: string) => {
    try {
      const messagesRef = collection(db, 'chat_messages');
      const conversationRef = doc(db, 'chat_conversations', conversationId);

      // Add message
      await addDoc(messagesRef, {
        conversation_id: conversationId,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        message: message.trim(),
        read: false,
        created_at: serverTimestamp(),
      });

      // Update conversation
      const isCustomer = senderRole === 'customer';
      await updateDoc(conversationRef, {
        last_message: message.trim(),
        last_message_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        // Increment unread count for the opposite party (atomic)
        ...(isCustomer
          ? { unread_count_admin: increment(1) }
          : { unread_count_customer: increment(1) }
        ),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  createConversation: async (customerId: string, customerName: string, customerEmail: string) => {
    try {
      // Check if OPEN conversation already exists (not closed/archived)
      const conversationsRef = collection(db, 'chat_conversations');
      const q = query(
        conversationsRef,
        where('customer_id', '==', customerId),
        where('status', '==', 'open')  // Only check for OPEN conversations
      );
      const existingConversations = await getDocs(q);

      if (!existingConversations.empty) {
        // Return existing OPEN conversation ID
        return existingConversations.docs[0].id;
      }

      // Create new conversation (if no open one exists)
      const docRef = await addDoc(conversationsRef, {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        status: 'open',
        unread_count_customer: 0,
        unread_count_admin: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  markMessagesAsRead: async (conversationId: string, userId: string, isCustomer: boolean) => {
    try {
      const messagesRef = collection(db, 'chat_messages');
      const q = query(
        messagesRef,
        where('conversation_id', '==', conversationId),
        where('read', '==', false),
        where('sender_id', '!=', userId)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const batch = writeBatch(db);

        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { read: true });
        });

        await batch.commit();

        // Update conversation unread count
        const conversationRef = doc(db, 'chat_conversations', conversationId);
        await updateDoc(conversationRef, {
          ...(isCustomer
            ? { unread_count_customer: 0 }
            : { unread_count_admin: 0 }
          ),
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  setActiveConversation: (conversationId: string | null) => {
    set({ activeConversationId: conversationId });
  },

  closeConversation: async (conversationId: string) => {
    try {
      const conversationRef = doc(db, 'chat_conversations', conversationId);
      await updateDoc(conversationRef, {
        status: 'closed',
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error closing conversation:', error);
      throw error;
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      // Delete all messages in conversation
      const messagesRef = collection(db, 'chat_messages');
      const q = query(messagesRef, where('conversation_id', '==', conversationId));
      const messagesSnapshot = await getDocs(q);

      const batch = writeBatch(db);

      // Delete all messages
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete conversation
      const conversationRef = doc(db, 'chat_conversations', conversationId);
      batch.delete(conversationRef);

      await batch.commit();

      // Clear active conversation if it was deleted
      if (get().activeConversationId === conversationId) {
        set({ activeConversationId: null, messages: [] });
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  archiveConversation: async (conversationId: string) => {
    try {
      const conversationRef = doc(db, 'chat_conversations', conversationId);
      await updateDoc(conversationRef, {
        status: 'archived',
        updated_at: serverTimestamp(),
      });

      // Clear active conversation if it was archived
      if (get().activeConversationId === conversationId) {
        set({ activeConversationId: null, messages: [] });
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  },

  unarchiveConversation: async (conversationId: string) => {
    try {
      const conversationRef = doc(db, 'chat_conversations', conversationId);
      await updateDoc(conversationRef, {
        status: 'open',
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      throw error;
    }
  },
}));
