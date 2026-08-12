import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatModalContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

const ChatModalContext = createContext<ChatModalContextType | undefined>(undefined);

export const ChatModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return (
    <ChatModalContext.Provider value={{ isChatOpen, openChat, closeChat }}>
      {children}
    </ChatModalContext.Provider>
  );
};

export const useChatModal = () => {
  const context = useContext(ChatModalContext);
  if (!context) {
    throw new Error('useChatModal must be used within ChatModalProvider');
  }
  return context;
};
