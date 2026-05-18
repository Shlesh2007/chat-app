import { create } from 'zustand';
import api from '../lib/api.js';
import { backendUrl } from '../lib/utils.js';
import { useAuthStore } from './authStore.js';

function getToken() {
  try {
    return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token || '';
  } catch {
    return '';
  }
}

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  useRAG: false,

  setUseRAG: (val) => set({ useRAG: val }),

  fetchConversations: async () => {
    try {
      const { data } = await api.get('/conversations');
      set({ conversations: data.conversations });
    } catch {
      // interceptor handles 401/403 globally, ignore other errors silently
    }
  },

  createConversation: async () => {
    const { data } = await api.post('/conversations');
    set((s) => ({
      conversations: [data.conversation, ...s.conversations],
      activeConversationId: data.conversation.id,
      messages: [],
    }));
    return data.conversation;
  },

  loadConversation: async (id) => {
    const { data } = await api.get(`/conversations/${id}`);
    set({ activeConversationId: id, messages: data.messages });
  },

  deleteConversation: async (id) => {
    await api.delete(`/conversations/${id}`);
    set((s) => {
      const conversations = s.conversations.filter((c) => c.id !== id);
      const activeConversationId =
        s.activeConversationId === id ? (conversations[0]?.id || null) : s.activeConversationId;
      return { conversations, activeConversationId };
    });
  },

  renameConversation: async (id, title) => {
    await api.patch(`/conversations/${id}`, { title });
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
    }));
  },

  sendMessage: async (content, displayContent) => {
    const { activeConversationId, useRAG } = get();
    if (!activeConversationId) return;

    // Show clean display text in the bubble, send full content to AI
    const bubbleContent = displayContent || content;

    // Add user message immediately with clean display text
    set((s) => ({
      messages: [
        ...s.messages,
        { id: `temp-${Date.now()}`, role: 'user', content: bubbleContent, created_at: new Date().toISOString() },
      ],
      isStreaming: true,
      streamingContent: '',
    }));

    try {
      const response = await fetch(backendUrl(`/api/chat/${activeConversationId}/message`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ content, displayContent: bubbleContent, useRAG }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));

        // auto-blocked after spam strikes
        if (response.status === 403 && err.error === 'BLOCKED') {
          set({ isStreaming: false, streamingContent: '' });
          useAuthStore.getState().setBlocked(err.reason || 'You have been blocked due to policy violations.');
          return;
        }

        // spam warning — show in chat bubble
        if (err.error === 'SPAM_DETECTED') {
          set((s) => ({
            messages: [
              ...s.messages,
              {
                id: `warn-${Date.now()}`,
                role: 'assistant',
                content: `⚠️ **Message blocked:** ${err.warning}`,
                created_at: new Date().toISOString(),
              },
            ],
            isStreaming: false,
            streamingContent: '',
          }));
          return;
        }

        throw new Error(err.error || 'Request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));

            if (json.type === 'chunk') {
              accumulated += json.content;
              set({ streamingContent: accumulated });
            } else if (json.type === 'done') {
              // Add final assistant message
              set((s) => ({
                messages: [
                  ...s.messages,
                  {
                    id: json.messageId || `msg-${Date.now()}`,
                    role: 'assistant',
                    content: accumulated,
                    created_at: new Date().toISOString(),
                  },
                ],
                isStreaming: false,
                streamingContent: '',
              }));
              get().fetchConversations();
              return;
            } else if (json.type === 'error') {
              throw new Error(json.error);
            }
          } catch (parseErr) {
            // skip malformed lines
          }
        }
      }

      // Fallback: if stream ended without 'done' event but we have content
      if (accumulated) {
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: `msg-${Date.now()}`,
              role: 'assistant',
              content: accumulated,
              created_at: new Date().toISOString(),
            },
          ],
          isStreaming: false,
          streamingContent: '',
        }));
        get().fetchConversations();
      }
    } catch (err) {
      console.error('Stream error:', err.message);
      set((s) => ({
        messages: [
          ...s.messages,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `❌ Error: ${err.message}`,
            created_at: new Date().toISOString(),
          },
        ],
        isStreaming: false,
        streamingContent: '',
      }));
    }
  },
}));
