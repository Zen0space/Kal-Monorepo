"use client";

import { FileText, Gift, Tool, Zap } from "react-feather";

import type { ChangelogEntry } from "./page";

const CATEGORY_CONFIG: Record<
  string,
  { icon: typeof Gift; color: string; bg: string; border: string; glow: string }
> = {
  Added: {
    icon: Gift,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    glow: "shadow-[0_0_8px_rgba(52,211,153,0.15)]",
  },
  Fixed: {
    icon: Tool,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    glow: "shadow-[0_0_8px_rgba(251,191,36,0.15)]",
  },
  Changed: {
    icon: Zap,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    glow: "shadow-[0_0_8px_rgba(56,189,248,0.15)]",
  },
};

const DEFAULT_CATEGORY = {
  icon: Zap,
  color: "text-purple-400",
  bg: "bg-purple-400/10",
  border: "border-purple-400/20",
  glow: "shadow-[0_0_8px_rgba(192,132,252,0.15)]",
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function VersionCard({
  entry,
  isLatest,
  index,
}: {
  entry: ChangelogEntry;
  isLatest: boolean;
  index: number;
}) {
  return (
    <div
      className="relative pl-8 md:pl-12 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      {/* Timeline dot */}
      <div className="absolute left-0 md:left-[7px] top-[22px] z-10">
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 ${
            isLatest
              ? "bg-accent border-accent shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              : "bg-dark-elevated border-dark-border"
          }`}
        />
      </div>

      {/* Card */}
      <div
        className={`
          rounded-xl border p-5 md:p-6 transition-all duration-300
          hover:border-accent/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]
          ${
            isLatest
              ? "bg-gradient-to-br from-dark-surface to-dark-elevated border-accent/20 shadow-[0_0_30px_rgba(16,185,129,0.06)]"
              : "bg-dark-surface border-dark-border"
          }
        `}
      >
        {/* Version header */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span
            className={`
              text-lg md:text-xl font-bold font-mono tracking-tight
              ${isLatest ? "text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "text-content-primary"}
            `}
          >
            v{entry.version}
          </span>
          {isLatest && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-accent/15 text-accent border border-accent/30 animate-neon-pulse tracking-wider">
              latest
            </span>
          )}
          <span className="text-xs text-content-muted ml-auto">
            {formatDate(entry.date)}
          </span>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {entry.categories.map((category) => {
            const config = CATEGORY_CONFIG[category.name] ?? DEFAULT_CATEGORY;
            const Icon = config.icon;

            return (
              <div key={category.name}>
                {/* Category badge */}
                <div
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
                    border mb-3
                    ${config.color} ${config.bg} ${config.border} ${config.glow}
                  `}
                >
                  <Icon size={12} />
                  {category.name}
                </div>

                {/* Items */}
                <ul className="space-y-2 ml-1">
                  {category.items.map((item, i) => (
                    <li key={i} className="flex gap-2.5 group">
                      <span
                        className={`mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${config.bg.replace("/10", "/30")} group-hover:${config.bg.replace("/10", "/60")}`}
                      />
                      <span className="text-sm text-content-secondary leading-relaxed group-hover:text-content-primary transition-colors">
                        <HighlightCode text={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Renders inline `code` and **bold** segments with styling */
function HighlightCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-dark/60 border border-dark-border text-xs font-mono text-accent"
          >
            {part.slice(1, -1)}
          </code>
        ) : part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-content-primary font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

interface ChangelogClientProps {
  entries: ChangelogEntry[];
}

export default function ChangelogClient({ entries }: ChangelogClientProps) {
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-3xl">
      {/* Header */}
      <div className="mb-8 md:mb-10">
        <div className="flex items-center gap-3 mb-2">
          <FileText
            size={24}
            className="text-accent drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]"
          />
          <h1 className="text-xl md:text-2xl font-bold text-content-primary">
            Changelog
          </h1>
        </div>
        <p className="text-content-secondary text-sm md:text-base">
          All the latest updates and improvements to Kal
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-8 md:p-12 text-center">
          <FileText size={40} className="text-content-muted mx-auto mb-4" />
          <p className="text-content-secondary">
            No changelog entries yet. Check back soon.
          </p>
        </div>
      ) : (
        /* Timeline */
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[6px] md:left-[13px] top-6 bottom-6 w-px bg-gradient-to-b from-accent/40 via-dark-border to-transparent" />

          {/* Entries */}
          <div className="space-y-6 md:space-y-8">
            {entries.map((entry, index) => (
              <VersionCard
                key={entry.version}
                entry={entry}
                isLatest={index === 0}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
