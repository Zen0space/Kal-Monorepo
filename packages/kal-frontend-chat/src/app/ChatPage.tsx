"use client";

import { useEffect, useState } from "react";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/Header";
import { handleSignIn, handleSignOut } from "@/lib/actions";
import { trpc } from "@/lib/trpc";
import { LogIn } from "react-feather";

interface Message {
  _id: string;
  role: "User" | "Assistant";
  content: string;
  createdAt: Date;
}

interface ThreadPreview {
  _id: string;
  title: string;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

interface ChatPageProps {
  isAuthenticated: boolean;
  user: {
    logtoId: string;
    name?: string;
    email?: string;
  } | null;
}

export function ChatPage({ isAuthenticated, user }: ChatPageProps) {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinkingStatus, setThinkingStatus] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Only fetch if authenticated
  const {
    data: threadsData,
    isLoading: threadsLoading,
    refetch: refetchThreads,
  } = trpc.chat.getThreads.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const threads: ThreadPreview[] = (threadsData ?? []).map(
    (t: { _id: string; title: string; updatedAt: string; messageCount: number; lastMessage?: string }) => ({
      ...t,
      updatedAt: new Date(t.updatedAt),
    })
  );

  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } =
    trpc.chat.getMessages.useQuery(
      { threadId: currentThreadId ?? "" },
      { enabled: !!currentThreadId && isAuthenticated }
    );

  useEffect(() => {
    if (messagesData) {
      setMessages(
        messagesData.map(
          (m: { _id: string; role: "User" | "Assistant"; content: string; createdAt: string }) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          })
        )
      );
    }
  }, [messagesData]);

  const createThreadMutation = trpc.chat.createThread.useMutation({
    onSuccess: (newThread) => {
      console.log('[Chat] Thread created:', newThread._id);
      setCurrentThreadId(newThread._id);
      setMessages([]);
      refetchThreads();
    },
    onError: (error) => {
      console.error('[Chat] createThread error:', error);
    },
  });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onMutate: async ({ content }) => {
      console.log('[Chat Stream] Sending message:', content.slice(0, 50));
      // Show thinking indicator (status cycles automatically in TypingIndicator)
      setThinkingStatus(undefined);
      // Optimistically add user message immediately
      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          _id: tempId,
          role: "User" as const,
          content,
          createdAt: new Date(),
        },
      ]);
    },
    onSuccess: () => {
      console.log('[Chat Stream] Response received');
      setThinkingStatus(undefined);
      // Refetch messages to get the updated list including assistant response
      refetchMessages();
      refetchThreads();
    },
    onError: (error) => {
      console.error('[Chat Stream] Error:', error);
      setThinkingStatus(undefined);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => !m._id.startsWith("temp-")));
    },
  });

  const deleteThreadMutation = trpc.chat.deleteThread.useMutation({
    onSuccess: () => {
      if (currentThreadId) {
        setCurrentThreadId(null);
        setMessages([]);
      }
      refetchThreads();
    },
  });

  const handleNewChat = () => {
    console.log('[Chat] Creating new thread...');
    createThreadMutation.mutate();
  };

  const handleSelectThread = (threadId: string) => {
    setCurrentThreadId(threadId);
  };

  const handleDeleteThread = (threadId: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteThreadMutation.mutate({ threadId });
    }
  };

  const handleSendMessage = (content: string) => {
    console.log('[Chat] Sending message:', content.slice(0, 50));
    if (!currentThreadId) {
      // Create new thread first
      console.log('[Chat] No thread, creating new one first...');
      createThreadMutation.mutate(undefined, {
        onSuccess: (newThread) => {
          console.log('[Chat] Thread created, now sending message to:', newThread._id);
          sendMessageMutation.mutate({
            threadId: newThread._id,
            content,
          });
        },
      });
    } else {
      sendMessageMutation.mutate({
        threadId: currentThreadId,
        content,
      });
    }
  };

  // Login required screen
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen">
        <Header 
          isAuthenticated={false}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-2xl font-semibold text-content-primary mb-4">
              Sign in to start chatting
            </h2>
            <p className="text-content-secondary mb-8">
              Connect with our AI assistant powered by GLM 4.6. Your conversations are saved and synced across devices.
            </p>
            <button
              onClick={() => handleSignIn()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl transition-colors font-medium text-lg"
            >
              <LogIn className="w-5 h-5" />
              Sign In with Logto
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        threads={threads}
        currentThreadId={currentThreadId ?? undefined}
        onSelectThread={handleSelectThread}
        onNewChat={handleNewChat}
        onDeleteThread={handleDeleteThread}
        isLoading={threadsLoading}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col relative bg-dark">
        <Header
          user={user}
          isAuthenticated={true}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <MessageList
          messages={messages}
          isLoading={sendMessageMutation.isPending || messagesLoading}
          thinkingStatus={thinkingStatus}
        />

        <ChatInput
          onSend={handleSendMessage}
          disabled={
            sendMessageMutation.isPending || createThreadMutation.isPending
          }
          placeholder={
            currentThreadId
              ? "Type a message..."
              : "Type a message to start a new chat..."
          }
        />
      </div>
    </div>
  );
}
