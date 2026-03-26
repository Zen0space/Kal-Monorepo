"use client";

import {
  memo,
  useState,
  useCallback,
  type ComponentPropsWithoutRef,
} from "react";
import { User, Copy, Check } from "react-feather";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  role: "User" | "Assistant";
  content: string;
  createdAt?: Date;
  /** When true, shows a blinking cursor after the content (streaming in progress) */
  streaming?: boolean;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Small copy button for code blocks */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1 rounded bg-dark-elevated/80 hover:bg-dark-border text-content-muted hover:text-content-primary transition-colors opacity-0 group-hover:opacity-100"
      title="Copy code"
    >
      {copied ? (
        <Check size={12} className="text-accent" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}

/** Custom component overrides for ReactMarkdown — dark theme styling */
const markdownComponents = {
  // Headings
  h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1
      className="text-base font-bold text-content-primary mt-3 mb-1.5"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-sm font-bold text-content-primary mt-3 mb-1" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className="text-sm font-semibold text-content-primary mt-2 mb-1"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: ComponentPropsWithoutRef<"h4">) => (
    <h4
      className="text-sm font-semibold text-content-secondary mt-2 mb-0.5"
      {...props}
    >
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="mb-2 last:mb-0 leading-relaxed" {...props}>
      {children}
    </p>
  ),

  // Strong / emphasis
  strong: ({ children, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-content-primary" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: ComponentPropsWithoutRef<"em">) => (
    <em className="italic text-content-secondary" {...props}>
      {children}
    </em>
  ),

  // Links
  a: ({ children, href, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),

  // Lists
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-2 last:mb-0 space-y-0.5 ml-1 chat-md-ul" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-2 last:mb-0 space-y-0.5 ml-1 chat-md-ol" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className="chat-md-li pl-1" {...props}>
      {children}
    </li>
  ),

  // Horizontal rule
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="border-dark-border my-3" {...props} />
  ),

  // Code — inline and block
  code: ({
    children,
    className,
    ...props
  }: ComponentPropsWithoutRef<"code">) => {
    const isBlock = className?.includes("language-");

    // Inline code
    if (!isBlock) {
      return (
        <code
          className="bg-dark/60 border border-dark-border px-1.5 py-0.5 rounded text-[12px] font-mono text-accent"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Block code — rendered inside <pre> by ReactMarkdown
    return (
      <code
        className={`text-[12px] font-mono leading-relaxed ${className ?? ""}`}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: ComponentPropsWithoutRef<"pre">) => {
    // Extract text content for the copy button
    const text = extractText(children);

    return (
      <div className="relative group my-2">
        <pre
          className="bg-[#0a0a0a] border border-dark-border rounded-lg px-3 py-2.5 overflow-x-auto text-content-secondary chat-scrollbar"
          {...props}
        >
          {children}
        </pre>
        <CopyButton text={text} />
      </div>
    );
  },

  // Block quotes
  blockquote: ({
    children,
    ...props
  }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="border-l-2 border-accent/40 pl-3 my-2 text-content-secondary italic"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-2 overflow-x-auto chat-scrollbar rounded-lg border border-dark-border">
      <table className="w-full text-[12px]" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-dark-elevated" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: ComponentPropsWithoutRef<"tbody">) => (
    <tbody className="divide-y divide-dark-border" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: ComponentPropsWithoutRef<"tr">) => (
    <tr className="hover:bg-dark-elevated/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th
      className="px-2.5 py-1.5 text-left font-semibold text-content-primary border-b border-dark-border"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className="px-2.5 py-1.5 text-content-secondary" {...props}>
      {children}
    </td>
  ),
};

/** Recursively extract text content from React children (for copy button) */
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText(
      (node as { props: { children?: React.ReactNode } }).props.children
    );
  }
  return "";
}

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  createdAt,
  streaming,
}: ChatMessageProps) {
  const isUser = role === "User";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs mt-0.5 ${
          isUser
            ? "bg-accent text-dark"
            : "bg-dark-elevated border border-dark-border text-accent"
        }`}
      >
        {isUser ? (
          <User size={14} />
        ) : (
          <span className="font-bold text-[11px]">K</span>
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-accent text-dark rounded-tr-md"
            : "bg-dark-elevated border border-dark-border text-content-primary rounded-tl-md"
        }`}
      >
        {isUser ? (
          content
        ) : (
          <div className="chat-markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
        {streaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-accent/70 animate-pulse rounded-sm align-text-bottom" />
        )}

        {createdAt && !streaming && (
          <div
            className={`text-[10px] mt-1.5 ${
              isUser ? "text-dark/50" : "text-content-muted"
            }`}
          >
            {formatTime(createdAt)}
          </div>
        )}
      </div>
    </div>
  );
});

/** Animated typing indicator shown while waiting for AI response. */
export function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-dark-elevated border border-dark-border text-accent mt-0.5">
        <span className="font-bold text-[11px]">K</span>
      </div>
      <div className="bg-dark-elevated border border-dark-border rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-content-muted rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-content-muted rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-content-muted rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
