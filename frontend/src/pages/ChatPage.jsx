import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore.js';
import Sidebar from '../components/Sidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import ChatInput from '../components/ChatInput.jsx';
import WelcomeScreen from '../components/WelcomeScreen.jsx';
import BuyCreditsModal from '../components/BuyCreditsModal.jsx';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const {
    fetchConversations,
    loadConversation,
    activeConversationId,
    createConversation,
    showBuyCredits,
  } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      loadConversation(conversationId);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [conversationId]);

  const handleNewChat = async () => {
    const conv = await createConversation();
    navigate(`/chat/${conv.id}`);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex h-screen theme-app-bg overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar onNewChat={handleNewChat} />

      {/* Main Chat Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-grid-pattern relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-600/10 blur-[100px] pointer-events-none" />

        {/* Mobile Spacer */}
        <div className="md:hidden h-14 shrink-0" />

        {activeConversationId ? (
          <>
            <ChatWindow />
            <ChatInput inputRef={inputRef} />
          </>
        ) : (
          <WelcomeScreen onNewChat={handleNewChat} />
        )}
      </main>

      {showBuyCredits && <BuyCreditsModal />}
    </div>
  );
}
