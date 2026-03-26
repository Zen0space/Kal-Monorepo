/**
 * SSE client for the chat streaming endpoint.
 *
 * Uses the browser Fetch API with ReadableStream to consume
 * Server-Sent Events from POST /api/chat/stream.
 */

import type { ChatSSEEvent, ChatToolName } from "kal-shared";

// ---- Callback types ----

export interface ChatStreamCallbacks {
  /** A tool step has started (e.g., "Searching database...") */
  onToolStart?: (tool: ChatToolName, message: string) => void;
  /** A tool step completed */
  onToolEnd?: (
    tool: ChatToolName,
    message: string,
    data?: Record<string, unknown>
  ) => void;
  /** AI streaming has begun */
  onStreamStart?: () => void;
  /** A chunk of the AI response text */
  onStreamDelta?: (delta: string) => void;
  /** AI response complete — messageId is the DB id of the saved message */
  onStreamEnd?: (messageId: string) => void;
  /** An error occurred */
  onError?: (message: string) => void;
  /** Entire flow is done */
  onDone?: () => void;
}

// ---- SSE parsing helpers ----

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

/**
 * Parse a raw SSE chunk into individual events.
 * Each event is separated by a double newline.
 * Format:  event: <type>\ndata: <json>\n\n
 */
function parseSSEEvents(raw: string): ChatSSEEvent[] {
  const events: ChatSSEEvent[] = [];
  // Split on double newline (event boundary)
  const blocks = raw.split("\n\n").filter((b) => b.trim());

  for (const block of blocks) {
    const lines = block.split("\n");
    let data = "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }

    if (data) {
      try {
        events.push(JSON.parse(data) as ChatSSEEvent);
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return events;
}

// ---- Main function ----

/**
 * Send a chat message via SSE and process the stream.
 *
 * @returns An AbortController that can be used to cancel the request.
 */
export function sendChatStream(
  params: {
    threadId: string;
    content: string;
    logtoId: string;
    email?: string | null;
    name?: string | null;
  },
  callbacks: ChatStreamCallbacks
): AbortController {
  const controller = new AbortController();

  // Fire-and-forget async IIFE
  (async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-logto-id": params.logtoId,
      };
      if (params.email) headers["x-logto-email"] = params.email;
      if (params.name) headers["x-logto-name"] = params.name;

      const response = await fetch(`${getApiUrl()}/api/chat/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          threadId: params.threadId,
          content: params.content,
        }),
        signal: controller.signal,
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.text();
        callbacks.onError?.(
          `Server error (${response.status}): ${body || "Unknown error"}`
        );
        callbacks.onDone?.();
        return;
      }

      if (!response.body) {
        callbacks.onError?.("No response body");
        callbacks.onDone?.();
        return;
      }

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete events (delimited by double newline)
        const lastDoubleNewline = buffer.lastIndexOf("\n\n");
        if (lastDoubleNewline === -1) continue;

        const complete = buffer.slice(0, lastDoubleNewline + 2);
        buffer = buffer.slice(lastDoubleNewline + 2);

        const events = parseSSEEvents(complete);

        for (const event of events) {
          switch (event.type) {
            case "tool_start":
              callbacks.onToolStart?.(event.tool, event.message);
              break;
            case "tool_end":
              callbacks.onToolEnd?.(event.tool, event.message, event.data);
              break;
            case "stream_start":
              callbacks.onStreamStart?.();
              break;
            case "stream_delta":
              callbacks.onStreamDelta?.(event.delta);
              break;
            case "stream_end":
              callbacks.onStreamEnd?.(event.messageId);
              break;
            case "error":
              callbacks.onError?.(event.message);
              break;
            case "done":
              callbacks.onDone?.();
              break;
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const events = parseSSEEvents(buffer);
        for (const event of events) {
          switch (event.type) {
            case "tool_start":
              callbacks.onToolStart?.(event.tool, event.message);
              break;
            case "tool_end":
              callbacks.onToolEnd?.(event.tool, event.message, event.data);
              break;
            case "stream_start":
              callbacks.onStreamStart?.();
              break;
            case "stream_delta":
              callbacks.onStreamDelta?.(event.delta);
              break;
            case "stream_end":
              callbacks.onStreamEnd?.(event.messageId);
              break;
            case "error":
              callbacks.onError?.(event.message);
              break;
            case "done":
              callbacks.onDone?.();
              break;
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // User cancelled — not an error
        return;
      }
      callbacks.onError?.((error as Error).message || "Network error");
      callbacks.onDone?.();
    }
  })();

  return controller;
}
