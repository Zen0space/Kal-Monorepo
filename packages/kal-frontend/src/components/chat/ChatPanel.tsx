"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
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
import { ToolStepIndicator } from "./ToolStepIndicator";

import {
  activeThreadIdAtom,
  showThreadListAtom,
  optimisticMessagesAtom,
  streamingContentAtom,
  toolStepsAtom,
  isSendingAtom,
  inputAtom,
  resetStreamStateAtom,
  type ChatMessageLocal,
} from "@/atoms/chat";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/lib/auth-context";
import { sendChatStream } from "@/lib/chat-stream";
import { trpc } from "@/lib/trpc";

// ---------------------------------------------------------------------------
// Character-by-character reveal constants
// ---------------------------------------------------------------------------

/** Characters revealed per animation frame (~60fps → ~180 chars/sec).
 *  This gives a smooth ChatGPT-like typewriter cadence. */
const CHARS_PER_FRAME = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const [activeThreadId, setActiveThreadId] = useAtom(activeThreadIdAtom);
  const [showThreadList, setShowThreadList] = useAtom(showThreadListAtom);
  const [optimisticMessages, setOptimisticMessages] = useAtom(
    optimisticMessagesAtom
  );
  const [streamingContent, setStreamingContent] = useAtom(streamingContentAtom);
  const [toolSteps, setToolSteps] = useAtom(toolStepsAtom);
  const isSending = useAtomValue(isSendingAtom);
  const setIsSending = useSetAtom(isSendingAtom);
  const [input, setInput] = useAtom(inputAtom);
  const resetStream = useSetAtom(resetStreamStateAtom);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // When true, the next scroll-to-bottom uses "instant" (no animation).
  // Starts true so the first render after mount jumps straight to the
  // bottom, then flips false so subsequent new-message scrolls animate.
  const instantScrollRef = useRef(true);
  const toast = useToast();
  const auth = useAuth();

  // ---- Character-by-character reveal queue ----
  // Text that arrived from SSE but hasn't been revealed yet.
  const pendingTextRef = useRef("");
  // How much of the total received text has been revealed so far.
  const revealedLengthRef = useRef(0);
  // requestAnimationFrame handle for the reveal loop.
  const rafRef = useRef(0);
  // Whether the SSE stream has finished (so the reveal loop knows
  // to flush remaining text instantly on the next frame).
  const streamDoneRef = useRef(false);

  /** Drain the pending queue at CHARS_PER_FRAME characters per frame.
   *  When the SSE stream ends, flush everything remaining in one shot. */
  const revealLoop = useCallback(() => {
    const pending = pendingTextRef.current;
    const revealed = revealedLengthRef.current;

    if (revealed >= pending.length) {
      // Nothing left to reveal — stop the loop
      rafRef.current = 0;
      return;
    }

    let nextLength: number;

    if (streamDoneRef.current) {
      // Stream finished — flush all remaining text immediately so the user
      // doesn't wait for a long tail to trickle out.
      nextLength = pending.length;
    } else {
      nextLength = Math.min(revealed + CHARS_PER_FRAME, pending.length);
    }

    revealedLengthRef.current = nextLength;
    setStreamingContent(pending.slice(0, nextLength));

    if (nextLength < pending.length) {
      rafRef.current = requestAnimationFrame(revealLoop);
    } else {
      rafRef.current = 0;
    }
  }, [setStreamingContent]);

  /** Append raw delta text to the pending buffer and kick the reveal loop. */
  const enqueueDelta = useCallback(
    (delta: string) => {
      pendingTextRef.current += delta;
      // Start the reveal loop if it isn't already running
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(revealLoop);
      }
    },
    [revealLoop]
  );

  /** Stop the reveal loop and reset all reveal state. */
  const resetReveal = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    pendingTextRef.current = "";
    revealedLengthRef.current = 0;
    streamDoneRef.current = false;
  }, []);

  // ---- tRPC hooks (threads + messages CRUD) ----
  const threadsQuery = trpc.chat.getThreads.useQuery(
    { limit: 20 },
    {
      // Serve cached data for 30s on panel reopen — avoids a flash of
      // the empty state while threads re-fetch in the background.
      staleTime: 30_000,
    }
  );

  const messagesQuery = trpc.chat.getMessages.useQuery(
    { threadId: activeThreadId ?? "", limit: 50 },
    {
      enabled: !!activeThreadId,
      refetchOnWindowFocus: false,
      // Keep the previous thread's messages visible while the new thread's
      // messages are loading — prevents a blank flash on thread switch.
      placeholderData: keepPreviousData,
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

  // Derive displayed messages: server data + optimistic overlay + streaming.
  // Kept as useMemo (not a jotai derived atom) because it depends on tRPC
  // query cache data that lives outside the atom graph.
  const displayMessages = useMemo<ChatMessageLocal[]>(() => {
    const serverMessages: ChatMessageLocal[] = (messagesQuery.data ?? []).map(
      (m) => ({
        _id: m._id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt),
      })
    );

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

  // useLayoutEffect required: DOM scroll must happen synchronously after
  // render to prevent a visible flicker at the old scroll position.
  useLayoutEffect(() => {
    const behavior = instantScrollRef.current ? "instant" : "smooth";
    messagesEndRef.current?.scrollIntoView({ behavior });
    // After the first scroll (mount / thread switch), all subsequent
    // scrolls (new messages, streaming) should animate smoothly.
    instantScrollRef.current = false;
  }, [displayMessages, toolSteps]);

  // Auto-load the most recent thread on mount (synchronous ref guard —
  // avoids an extra render cycle that a useEffect would introduce)
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
      resetReveal();
      streamDoneRef.current = false;

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
            // Push into the reveal queue — the rAF loop will drip-feed
            // characters into streamingContent at CHARS_PER_FRAME pace.
            enqueueDelta(delta);
          },
          onStreamEnd: () => {
            // Mark stream as done so the reveal loop flushes all remaining
            // text on the very next animation frame.
            streamDoneRef.current = true;
            // Kick one more frame in case the loop already stopped
            if (!rafRef.current) {
              rafRef.current = requestAnimationFrame(revealLoop);
            }
            // Wait for two frames: the first paints the fully-revealed
            // text, the second swaps it for the server-fetched message.
            // Using double-rAF guarantees the flush frame paints before
            // we clear optimistic state and refetch server data.
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resetReveal();
                resetStream();
                messagesQuery.refetch();
                threadsQuery.refetch();
              });
            });
          },
          onError: (message) => {
            toast.error(message || "Failed to send message");
            resetReveal();
            resetStream();
          },
          onDone: () => {
            // Final cleanup in case onStreamEnd didn't fire
            setIsSending(false);
          },
        }
      );

      abortRef.current = controller;
    },
    [
      auth.logtoId,
      auth.email,
      auth.name,
      toast,
      messagesQuery,
      threadsQuery,
      setIsSending,
      setToolSteps,
      setStreamingContent,
      setOptimisticMessages,
      resetStream,
      resetReveal,
      enqueueDelta,
      revealLoop,
    ]
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
    [input, activeThreadId, isSending, startStream, createThread, setInput]
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
    instantScrollRef.current = true;
    resetReveal();
    resetStream();
    createThread.mutate();
  }, [createThread, resetStream, resetReveal]);

  const handleSelectThread = useCallback(
    (threadId: string) => {
      abortRef.current?.abort();
      setActiveThreadId(threadId);
      // Jump straight to the bottom of the new thread — no animation.
      instantScrollRef.current = true;
      resetReveal();
      resetStream();
      setShowThreadList(false);
    },
    [setActiveThreadId, resetStream, resetReveal, setShowThreadList]
  );

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
        {/* Initial load — spinner while threads are fetching (prevents
            a flash of the "Ask me anything!" empty state) */}
        {threadsQuery.isLoading && !activeThreadId && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Loading state for messages */}
        {messagesQuery.isLoading && activeThreadId && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state — only shown once we KNOW there are no threads,
            not while they're still loading */}
        {displayMessages.length === 0 &&
          !messagesQuery.isLoading &&
          !threadsQuery.isLoading &&
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
