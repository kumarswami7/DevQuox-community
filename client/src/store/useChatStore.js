import { create } from "zustand";
export const useChatStore = create((set) => ({
  conversations: [],
  messages: [],
  activeConversationId: null,
  setConversations: (conversations) => set({ conversations }),
  setMessages: (messages) => set({ messages }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  sendMessage: (text) => set((state) => ({
    messages: [
      ...state.messages,
      {
        id: `m-${Date.now()}`,
        senderId: "me",
        text,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isMe: true
      }
    ]
  }))
}));
