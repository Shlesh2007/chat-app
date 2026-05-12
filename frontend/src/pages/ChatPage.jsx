import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore.js';
import Sidebar from '../components/Sidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import ChatInput from '../components/ChatInput.jsx';
import WelcomeScreen from '../components/WelcomeScreen.jsx';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const {
    fetchConversations,
    loadConversation,
    activeConversationId,
    createConversation,
  } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      loadConversation(conversationId);
    }
    // Focus input whenever conversation changes
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [conversationId]);

  const handleNewChat = async () => {
    const conv = await createConversation();
    navigate(`/chat/${conv.id}`);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <Sidebar onNewChat={handleNewChat} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar spacer so content doesn't hide behind hamburger */}
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
    </div>
  );
}
