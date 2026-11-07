import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConversationList } from '../components/chat/ConversationList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { chatService } from '../services/chatService';
import { useAuthStore } from '../store';
import { ArrowLeft, ShieldAlert, X } from 'lucide-react';

export const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const invitedUserId = searchParams.get('userId') || searchParams.get('user');
  const targetProjectId = searchParams.get('projectId');

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [accessError, setAccessError] = useState('');

  // Deduplicate conversations so that each partner and project appears exactly once
  const deduplicateConversations = (list) => {
    if (!Array.isArray(list)) return [];
    const seenDirect = new Set();
    const seenProject = new Set();
    const result = [];

    for (const c of list) {
      if (!c) continue;
      const isProj = c.type === 'project' || Boolean(c.project);
      if (isProj) {
        const pId = String(c.project?._id || c.project || c._id || '');
        if (pId && seenProject.has(pId)) continue;
        if (pId) seenProject.add(pId);
      } else {
        const partner =
          c.user ||
          (Array.isArray(c.participants)
            ? c.participants.find((p) => String(p._id || p) !== currentUserId)
            : null);
        const partnerId = String(partner?._id || partner || c._id || '');
        if (partnerId && seenDirect.has(partnerId)) continue;
        if (partnerId) seenDirect.add(partnerId);
      }
      result.push(c);
    }
    return result;
  };

  // 1. Fetch conversations
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setConversations([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const loadConversations = async () => {
      try {
        const res = await chatService.getConversations();
        const data = res.data?.data || res.data || [];
        if (isMounted && Array.isArray(data)) {
          const cleanData = deduplicateConversations(data);
          setConversations(cleanData);

          // If projectId passed in query, try to select that project conversation
          if (targetProjectId) {
            const projConv = cleanData.find(
              (c) => String(c.project?._id || c.project) === String(targetProjectId)
            );
            if (projConv) {
              setActiveConversation(projConv);
              setShowMobileChat(true);
              return;
            } else {
              // Try to fetch/create project conversation
              chatService
                .getProjectConversation(targetProjectId)
                .then((pRes) => {
                  if (pRes.data?.conversation && isMounted) {
                    const newConv = pRes.data.conversation;
                    setConversations((prev) => deduplicateConversations([newConv, ...prev]));
                    setActiveConversation(newConv);
                    setShowMobileChat(true);
                  }
                })
                .catch((err) => {
                  if (err.response?.status === 403 && isMounted) {
                    setAccessError(
                      'Access Restricted: Only accepted team members and the project owner can access this project conversation.'
                    );
                  }
                });
            }
          }

          // If recipient user ID passed in query
          if (invitedUserId) {
            const existingDirect = cleanData.find(
              (c) =>
                c.type === 'direct' &&
                c.participants?.some(
                  (p) => String(p._id || p) === String(invitedUserId)
                )
            );
            if (existingDirect) {
              setActiveConversation(existingDirect);
              setShowMobileChat(true);
              return;
            } else {
              chatService
                .getDirectConversation(invitedUserId)
                .then((dRes) => {
                  if (dRes.data?.conversation && isMounted) {
                    const newConv = dRes.data.conversation;
                    setConversations((prev) => deduplicateConversations([newConv, ...prev]));
                    setActiveConversation(newConv);
                    setShowMobileChat(true);
                  }
                })
                .catch(() => {});
            }
          }

          // Default select the first conversation if none selected
          if (cleanData.length > 0 && !activeConversation) {
            setActiveConversation(cleanData[0]);
          }
        }
      } catch (err) {
        if (err?.response?.status !== 401) {
          console.warn('[ChatPage] Conversation fetch notice:', err?.message || err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadConversations();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token, targetProjectId, invitedUserId, currentUserId]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    setShowMobileChat(true);
  };

  const handleConversationUpdated = (savedMessage) => {
    setConversations((prev) =>
      prev.map((c) => {
        const cId = String(c._id || c.id);
        const mConvId = String(
          savedMessage.conversation?._id || savedMessage.conversation
        );
        if (cId === mConvId) {
          return {
            ...c,
            lastMessage: savedMessage.content || savedMessage.text,
            updatedAt: savedMessage.createdAt || new Date(),
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0c1319]">
      {/* Access Denied Warning Banner if outsider tries to access a project chat */}
      {accessError && (
        <div className="p-3 px-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-semibold">{accessError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAccessError('')}
            className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile Back Header Bar */}
      {showMobileChat && (
        <div className="md:hidden h-12 px-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center shrink-0">
          <button
            onClick={() => setShowMobileChat(false)}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Conversations</span>
          </button>
        </div>
      )}

      {/* Split Pane Container */}
      <div className="flex-1 flex overflow-hidden h-full">
        {/* 1. Left Sidebar */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-r border-slate-200/80 dark:border-slate-800 h-full overflow-hidden ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversation?._id || activeConversation?.id}
            onSelectConversation={handleSelectConversation}
            isLoading={loading}
            className="h-full"
          />
        </div>

        {/* 2. Main Chat Pane */}
        <div
          className={`flex-1 flex flex-col h-full min-w-0 overflow-hidden ${
            showMobileChat ? 'flex' : 'hidden md:flex'
          }`}
        >
          <ChatWindow
            conversation={activeConversation}
            onConversationUpdated={handleConversationUpdated}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
