"use client";

import {
  useState,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Send,
  ChevronRight,
  Plus,
  Trash2,
  ChevronLeft,
  Menu,
  MessageCircle,
} from "react-feather";

import { ChatMessage } from "./ChatMessage";
import { ToolStepIndicator, type ToolStep } from "./ToolStepIndicator";

import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/lib/auth-context";
import { sendChatStream } from "@/lib/chat-stream";
import { trpc } from "@/lib/trpc";

interface Message {
  _id: string;
  role: "User" | "Assistant";
  content: string;
  createdAt: Date;
  streaming?: boolean;
}

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [showThreadList, setShowThreadList] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const toast = useToast();
  const auth = useAuth();

  // ---- tRPC hooks (threads + messages CRUD, no more sendMessage) ----
  const threadsQuery = trpc.chat.getThreads.useQuery(
    { limit: 20 },
    { enabled: true }
  );

  const messagesQuery = trpc.chat.getMessages.useQuery(
    { threadId: activeThreadId ?? "", limit: 50 },
    {
      enabled: !!activeThreadId,
      refetchOnWindowFocus: false,
    }
  );

  const createThread = trpc.chat.createThread.useMutation({
    onSuccess: (thread) => {
      setActiveThreadId(thread._id);
      setShowThreadList(false);
      threadsQuery.refetch();
    },
    onError: () => {
      toast.error("Failed to create conversation");
    },
  });

  const deleteThread = trpc.chat.deleteThread.useMutation({
    onSuccess: () => {
      if (activeThreadId) {
        setActiveThreadId(null);
      }
      threadsQuery.refetch();
    },
    onError: () => {
      toast.error("Failed to delete conversation");
    },
  });

  // Derive displayed messages: server data + optimistic overlay + streaming
  const displayMessages = useMemo<Message[]>(() => {
    const serverMessages: Message[] = (messagesQuery.data ?? []).map((m) => ({
      _id: m._id,
      role: m.role,
      content: m.content,
      createdAt: new Date(m.createdAt),
    }));

    const messages = [...serverMessages, ...optimisticMessages];

    // If we're streaming, append the in-progress assistant message
    if (streamingContent) {
      messages.push({
        _id: "streaming",
        role: "Assistant",
        content: streamingContent,
        createdAt: new Date(),
        streaming: true,
      });
    }

    return messages;
  }, [messagesQuery.data, optimisticMessages, streamingContent]);

  // Auto-scroll to bottom when messages change or streaming updates
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, toolSteps]);

  // Auto-load the most recent thread on mount
  const hasAutoLoaded = useRef(false);
  if (threadsQuery.data && !hasAutoLoaded.current && !activeThreadId) {
    hasAutoLoaded.current = true;
    if (threadsQuery.data.length > 0) {
      setActiveThreadId(threadsQuery.data[0]._id);
    }
  }

  // ---- SSE send handler ----
  const startStream = useCallback(
    (threadId: string, content: string) => {
      if (!auth.logtoId) {
        toast.error("Not authenticated");
        return;
      }

      setIsSending(true);
      setToolSteps([]);
      setStreamingContent("");

      // Show optimistic user message
      setOptimisticMessages([
        {
          _id: `optimistic-${Date.now()}`,
          role: "User",
          content,
          createdAt: new Date(),
        },
      ]);

      const controller = sendChatStream(
        {
          threadId,
          content,
          logtoId: auth.logtoId,
          email: auth.email,
          name: auth.name,
        },
        {
          onToolStart: (tool, message) => {
            setToolSteps((prev) => [
              ...prev,
              { tool, message, status: "running" },
            ]);
          },
          onToolEnd: (tool, message) => {
            setToolSteps((prev) =>
              prev.map((s) =>
                s.tool === tool && s.status === "running"
                  ? { ...s, message, status: "done" }
                  : s
              )
            );
          },
          onStreamStart: () => {
            // Clear tool steps for generate_response since we're now streaming
            setToolSteps((prev) =>
              prev.filter((s) => s.tool !== "generate_response")
            );
          },
          onStreamDelta: (delta) => {
            setStreamingContent((prev) => prev + delta);
          },
          onStreamEnd: () => {
            // Streaming complete — refetch real messages from server
            setStreamingContent("");
            setOptimisticMessages([]);
            setToolSteps([]);
            setIsSending(false);
            messagesQuery.refetch();
            threadsQuery.refetch();
          },
          onError: (message) => {
            toast.error(message || "Failed to send message");
            setStreamingContent("");
            setOptimisticMessages([]);
            setToolSteps([]);
            setIsSending(false);
          },
          onDone: () => {
            // Final cleanup in case onStreamEnd didn't fire
            setIsSending(false);
          },
        }
      );

      abortRef.current = controller;
    },
    [auth.logtoId, auth.email, auth.name, toast, messagesQuery, threadsQuery]
  );

  const handleSend = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isSending) return;

      setInput("");

      if (activeThreadId) {
        startStream(activeThreadId, trimmed);
      } else {
        // Auto-create thread on first message
        createThread.mutate(undefined, {
          onSuccess: (thread) => {
            startStream(thread._id, trimmed);
          },
        });
      }
    },
    [input, activeThreadId, isSending, startStream, createThread]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleNewChat = useCallback(() => {
    // Abort any in-progress stream
    abortRef.current?.abort();
    setStreamingContent("");
    setOptimisticMessages([]);
    setToolSteps([]);
    setIsSending(false);
    createThread.mutate();
  }, [createThread]);

  const handleSelectThread = useCallback((threadId: string) => {
    abortRef.current?.abort();
    setActiveThreadId(threadId);
    setOptimisticMessages([]);
    setStreamingContent("");
    setToolSteps([]);
    setIsSending(false);
    setShowThreadList(false);
  }, []);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      deleteThread.mutate({ threadId });
    },
    [deleteThread]
  );

  // ---- Thread list view ----
  if (showThreadList) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0">
          <button
            onClick={() => setShowThreadList(false)}
            className="p-1.5 rounded-lg hover:bg-dark-elevated text-content-secondary hover:text-content-primary transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-semibold text-content-primary">
            Conversations
          </h3>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg hover:bg-dark-elevated text-accent transition-colors"
            title="New chat"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto chat-scrollbar">
          {threadsQuery.isLoading && (
            <div className="p-4 text-center text-content-muted text-sm">
              Loading...
            </div>
          )}
          {threadsQuery.data?.length === 0 && (
            <div className="p-6 text-center text-content-muted text-sm">
              No conversations yet.
              <br />
              Start a new chat!
            </div>
          )}
          {threadsQuery.data?.map((thread) => (
            <div
              key={thread._id}
              className={`flex items-center gap-2 px-4 py-3 border-b border-dark-border/50 cursor-pointer hover:bg-dark-elevated transition-colors group ${
                thread._id === activeThreadId ? "bg-dark-elevated" : ""
              }`}
            >
              <button
                onClick={() => handleSelectThread(thread._id)}
                className="flex-1 text-left min-w-0"
              >
                <div className="text-sm text-content-primary truncate">
                  {thread.title}
                </div>
                {thread.lastMessage && (
                  <div className="text-xs text-content-muted truncate mt-0.5">
                    {thread.lastMessage}
                  </div>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteThread(thread._id);
                }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-dark-surface text-content-muted hover:text-red-400 transition-all"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- Main chat view ----
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThreadList(true)}
            className="p-1.5 rounded-lg hover:bg-dark-elevated text-content-secondary hover:text-content-primary transition-colors"
            title="Conversations"
          >
            <Menu size={16} />
          </button>
          <div>
            <h3 className="text-sm font-semibold text-content-primary">
              Kal Assistant
            </h3>
            <p className="text-[10px] text-content-muted leading-tight">
              Malaysian food nutrition AI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg hover:bg-dark-elevated text-content-secondary hover:text-accent transition-colors"
            title="New chat"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-dark-elevated text-content-secondary hover:text-content-primary transition-colors"
            title="Close panel"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-scrollbar">
        {/* Loading state */}
        {messagesQuery.isLoading && activeThreadId && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {displayMessages.length === 0 &&
          !messagesQuery.isLoading &&
          !isSending && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <MessageCircle size={24} className="text-accent" />
              </div>
              <h4 className="text-sm font-semibold text-content-primary mb-1">
                Ask me anything!
              </h4>
              <p className="text-xs text-content-muted max-w-[200px]">
                I can help with Malaysian food nutrition, calories, recipes, and
                healthy eating tips.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                {[
                  "Calories in nasi lemak?",
                  "Healthy roti canai recipe",
                  "Protein in ayam goreng",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="text-[11px] px-2.5 py-1.5 rounded-full border border-dark-border text-content-secondary hover:border-accent hover:text-accent transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Message bubbles */}
        {displayMessages.map((msg) => (
          <ChatMessage
            key={msg._id}
            role={msg.role}
            content={msg.content}
            createdAt={msg.createdAt}
            streaming={msg.streaming}
          />
        ))}

        {/* Tool step indicators (shown while workflow is running) */}
        {toolSteps.length > 0 && !streamingContent && (
          <ToolStepIndicator steps={toolSteps} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="px-3 py-3 border-t border-dark-border shrink-0"
      >
        <div className="flex items-end gap-2 bg-dark-elevated border border-dark-border rounded-xl px-3 py-2 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize up to 5 lines, then scroll
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 100) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about food nutrition..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-content-primary placeholder:text-content-muted resize-none outline-none focus-visible:outline-none max-h-[100px] overflow-y-auto chat-scrollbar"
            disabled={isSending || createThread.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending || createThread.isPending}
            className="shrink-0 p-1.5 rounded-lg bg-accent text-dark disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
