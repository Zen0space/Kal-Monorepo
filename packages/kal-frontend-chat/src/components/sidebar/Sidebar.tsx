"use client";

import { Plus, MessageSquare, Trash2, X } from "react-feather";

interface ThreadPreview {
  _id: string;
  title: string;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

interface SidebarProps {
  threads: ThreadPreview[];
  currentThreadId?: string;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  isLoading?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  threads,
  currentThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  isLoading = false,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const handleSelectThread = (threadId: string) => {
    onSelectThread(threadId);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  const handleNewChat = () => {
    onNewChat();
    // Close sidebar on mobile after creating new chat
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-50 md:z-auto w-64 bg-dark-surface border-r border-dark-border flex flex-col h-full transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center border-b border-dark-border px-4 flex-shrink-0 gap-2 pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))]">
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 text-content-secondary hover:text-content-primary hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleNewChat}
            className="flex-1 group flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent to-accent-hover text-white rounded-xl transition-all duration-300 shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5"
          >
            <div className="p-0.5 rounded-md bg-white/20 group-hover:bg-white/30 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold tracking-wide text-sm">New Chat</span>
          </button>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {isLoading ? (
            <div className="space-y-3 px-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-white/5 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-3 text-content-muted">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-sm text-content-secondary font-medium">No conversations yet</p>
              <p className="text-xs text-content-muted mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {threads.map((thread) => (
                <div
                  key={thread._id}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${
                    currentThreadId === thread._id
                      ? "bg-white/10 border-white/5 text-white shadow-sm"
                      : "text-content-secondary hover:bg-white/5 hover:text-content-primary"
                  }`}
                  onClick={() => handleSelectThread(thread._id)}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    currentThreadId === thread._id ? "bg-accent/20 text-accent" : "bg-white/5 text-content-muted group-hover:text-content-primary"
                  }`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      currentThreadId === thread._id ? "text-white" : "text-content-secondary group-hover:text-content-primary"
                    }`}>
                      {thread.title}
                    </p>
                    <p className="text-xs text-content-muted truncate mt-0.5">
                      {thread.messageCount} messages
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-content-muted hover:text-red-400 rounded-lg transition-all absolute right-2"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border">
          <p className="text-xs text-content-muted text-center">
            Powered by Kal AI
          </p>
        </div>
      </div>
    </>
  );
}
