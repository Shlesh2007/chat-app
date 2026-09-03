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
    <div className="flex h-screen h-[100dvh] theme-app-bg overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar onNewChat={handleNewChat} />

      {/* Main Chat Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-grid-pattern relative justify-between">
        {/* Ambient Top Glow */}
        <div className="hidden sm:block absolute top-0 right-1/4 w-96 h-32 bg-indigo-600/10 blur-[100px] pointer-events-none" />

        {/* Main View Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {activeConversationId ? <ChatWindow /> : <WelcomeScreen onNewChat={handleNewChat} />}
        </div>

        {/* Always Sticky Bottom Input Bar */}
        <div className="shrink-0 z-20 w-full">
          <ChatInput inputRef={inputRef} />
        </div>
      </main>

      {showBuyCredits && <BuyCreditsModal />}
    </div>
  );
}
