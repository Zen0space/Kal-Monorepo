"use client";

import { Plus, MessageSquare, Trash2 } from "react-feather";

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
}

export function Sidebar({
  threads,
  currentThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  isLoading = false,
}: SidebarProps) {
  return (
    <div className="w-64 bg-dark-surface border-r border-dark-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-border">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-dark-elevated rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 text-content-muted text-sm">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {threads.map((thread) => (
              <div
                key={thread._id}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentThreadId === thread._id
                    ? "bg-dark-elevated"
                    : "hover:bg-dark-elevated/50"
                }`}
                onClick={() => onSelectThread(thread._id)}
              >
                <MessageSquare className="w-4 h-4 text-content-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-content-primary truncate">
                    {thread.title}
                  </p>
                  <p className="text-xs text-content-muted truncate">
                    {thread.messageCount} messages
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteThread(thread._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border">
        <p className="text-xs text-content-muted text-center">
          Powered by Kalori AI
        </p>
      </div>
    </div>
  );
}
