"use client";

import { RATE_LIMITS } from "kal-shared";
import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Key,
  Lock,
  Shield,
  Zap,
} from "react-feather";

import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { API_URL_DISPLAY } from "@/lib/site-config";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocsClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

type TabId = "rate-limits" | "errors" | "best-practices" | "keys" | "reference";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: "rate-limits", label: "Rate Limits", icon: Zap },
  { id: "errors", label: "Error Codes", icon: AlertCircle },
  { id: "best-practices", label: "Best Practices", icon: Shield },
  { id: "keys", label: "API Keys", icon: Key },
  { id: "reference", label: "Quick Reference", icon: BookOpen },
];

const ERROR_CODES = [
  {
    code: 400,
    name: "Bad Request",
    color: "text-yellow-400",
    bg: "bg-yellow-500/8 border-yellow-500/20",
    description: "Missing or invalid query parameters.",
    solutions: [
      "Check that all required parameters are included.",
      "Verify parameter types match the docs (e.g. integers, strings).",
      "URL-encode special characters in query values.",
    ],
    example: '{"success":false,"error":"Query parameter \\"q\\" is required"}',
  },
  {
    code: 401,
    name: "Unauthorized",
    color: "text-red-400",
    bg: "bg-red-500/8 border-red-500/20",
    description: "API key is missing or invalid.",
    solutions: [
      "Send the key in the X-API-Key header, not as a query param.",
      "Ensure your key starts with kal_ — copy it exactly from the dashboard.",
      "The full key is only shown once at creation; generate a new one if lost.",
    ],
    example: '{"success":false,"error":"Invalid or missing API key"}',
  },
  {
    code: 403,
    name: "Forbidden",
    color: "text-orange-400",
    bg: "bg-orange-500/8 border-orange-500/20",
    description: "API key has been revoked or is inactive.",
    solutions: [
      "Check the API Keys page to confirm the key is not revoked.",
      "Verify the key has not expired (check the expiration date).",
      "Generate a new key if needed.",
    ],
    example: '{"success":false,"error":"API key has been revoked"}',
  },
  {
    code: 429,
    name: "Too Many Requests",
    color: "text-rose-400",
    bg: "bg-rose-500/8 border-rose-500/20",
    description: "Rate limit exceeded — you have sent too many requests.",
    solutions: [
      "Respect the Retry-After header (seconds to wait before retrying).",
      "Implement exponential backoff in your client.",
      "Cache responses to reduce redundant calls.",
      "Use the /api/v1/stats endpoint to check current limits.",
    ],
    example: '{"success":false,"error":"Rate limit exceeded","retryAfter":42}',
    hasRetryAfter: true,
  },
  {
    code: 500,
    name: "Internal Server Error",
    color: "text-red-400",
    bg: "bg-red-500/8 border-red-500/20",
    description: "Unexpected server-side error.",
    solutions: [
      "Retry the request after a short delay.",
      "Check status at our GitHub repo if the issue persists.",
    ],
    example: '{"success":false,"error":"Internal server error"}',
  },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return { copy, isCopied: (key: string) => copiedKey === key };
}

function CodeBlock({
  code,
  language = "bash",
  copyKey,
  onCopy,
  isCopied,
}: {
  code: string;
  language?: string;
  copyKey: string;
  onCopy: (text: string, key: string) => void;
  isCopied: (key: string) => boolean;
}) {
  return (
    <div className="relative group">
      <pre className="bg-dark rounded-lg border border-dark-border px-4 py-3 text-xs md:text-sm font-mono text-content-secondary overflow-x-auto leading-relaxed">
        <span className="absolute top-2 right-2 text-[10px] text-content-muted uppercase tracking-widest select-none">
          {language}
        </span>
        {code}
      </pre>
      <button
        onClick={() => onCopy(code, copyKey)}
        className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-dark-elevated hover:bg-dark-border text-content-muted hover:text-content-primary"
        title="Copy code"
      >
        {isCopied(copyKey) ? (
          <Check size={12} className="text-accent" />
        ) : (
          <Copy size={12} />
        )}
      </button>
    </div>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base md:text-lg font-semibold text-content-primary mb-3 md:mb-4">
      {children}
    </h3>
  );
}

// ─── Collapsible ─────────────────────────────────────────────────────────────

function Collapsible({
  title,
  children,
  defaultOpen = false,
  accent,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-dark-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 md:px-5 py-3 md:py-4 bg-dark-surface hover:bg-dark-elevated transition-colors text-left"
      >
        <span
          className={`font-medium text-sm md:text-base ${accent ?? "text-content-primary"}`}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={16} className="text-content-muted flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-content-muted flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 pt-1 bg-dark-surface border-t border-dark-border">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Rate Limits ─────────────────────────────────────────────────────────

function RateLimitsTab() {
  const { data: stats, isLoading } = trpc.apiKeys.getUsageStats.useQuery();

  const tier = stats?.tier ?? "free";
  const limits = RATE_LIMITS[tier];
  const minuteUsed = stats?.minuteUsed ?? 0;
  const dailyUsed = stats?.dailyUsed ?? 0;
  const monthlyUsed = stats?.monthlyUsed ?? 0;
  const minutePct = Math.min(100, (minuteUsed / limits.minuteLimit) * 100);
  const dailyPct = Math.min(100, (dailyUsed / limits.dailyLimit) * 100);
  const monthlyPct = Math.min(100, (monthlyUsed / limits.monthlyLimit) * 100);

  const tierLabel =
    tier === "free" ? "Free" : tier === "tier_1" ? "Tier 1" : "Tier 2";
  const tierColor =
    tier === "free"
      ? "bg-content-muted/20 text-content-secondary"
      : tier === "tier_1"
        ? "bg-accent/10 text-accent"
        : "bg-emerald-400/10 text-emerald-400";

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      {isLoading ? (
        <div className="h-20 bg-dark-elevated rounded-xl animate-pulse" />
      ) : (
        <SectionCard className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${tierColor}`}
              >
                {tierLabel}
              </span>
              <span className="text-content-muted text-xs">Current plan</span>
            </div>
            <p className="text-content-secondary text-sm">
              Your limits reset at midnight UTC daily, and on the 1st of each
              month.
            </p>
          </div>
          <Link
            href="/dashboard/api-keys"
            className="text-accent text-sm hover:underline whitespace-nowrap flex items-center gap-1"
          >
            Manage keys <ExternalLink size={12} />
          </Link>
        </SectionCard>
      )}

      {/* Live usage */}
      <SectionCard>
        <SectionTitle>Your Current Usage</SectionTitle>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-content-secondary">Per minute</span>
              <span className="font-mono text-content-primary">
                {minuteUsed.toLocaleString()} /{" "}
                {limits.minuteLimit.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-dark-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${minutePct > 80 ? "bg-red-400" : minutePct > 60 ? "bg-yellow-400" : "bg-accent"}`}
                style={{ width: `${minutePct}%` }}
              />
            </div>
            <p className="text-xs text-content-muted mt-1">
              {Math.max(0, limits.minuteLimit - minuteUsed).toLocaleString()}{" "}
              remaining &middot; resets every minute
            </p>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-content-secondary">Today</span>
              <span className="font-mono text-content-primary">
                {dailyUsed.toLocaleString()} /{" "}
                {limits.dailyLimit.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-dark-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${dailyPct > 80 ? "bg-red-400" : dailyPct > 60 ? "bg-yellow-400" : "bg-accent"}`}
                style={{ width: `${dailyPct}%` }}
              />
            </div>
            <p className="text-xs text-content-muted mt-1">
              {Math.max(0, limits.dailyLimit - dailyUsed).toLocaleString()}{" "}
              remaining today
            </p>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-content-secondary">This month</span>
              <span className="font-mono text-content-primary">
                {monthlyUsed.toLocaleString()} /{" "}
                {limits.monthlyLimit.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-dark-elevated rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${monthlyPct > 80 ? "bg-red-400" : monthlyPct > 60 ? "bg-yellow-400" : "bg-accent"}`}
                style={{ width: `${monthlyPct}%` }}
              />
            </div>
            <p className="text-xs text-content-muted mt-1">
              {Math.max(0, limits.monthlyLimit - monthlyUsed).toLocaleString()}{" "}
              remaining this month
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Tier comparison table */}
      <SectionCard>
        <SectionTitle>All Tiers</SectionTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-content-muted border-b border-dark-border">
                <th className="px-3 py-2 font-medium">Tier</th>
                <th className="px-3 py-2 font-medium">Per minute</th>
                <th className="px-3 py-2 font-medium">Per day</th>
                <th className="px-3 py-2 font-medium">Per month</th>
                <th className="px-3 py-2 font-medium">Burst</th>
              </tr>
            </thead>
            <tbody>
              {(["free", "tier_1", "tier_2"] as const).map((t) => {
                const l = RATE_LIMITS[t];
                const isActive = t === tier;
                const label =
                  t === "free" ? "Free" : t === "tier_1" ? "Tier 1" : "Tier 2";
                return (
                  <tr
                    key={t}
                    className={`border-b border-dark-border last:border-0 ${isActive ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-3 py-3">
                      <span
                        className={`font-medium ${isActive ? "text-accent" : "text-content-primary"}`}
                      >
                        {label}
                      </span>
                      {isActive && (
                        <span className="ml-2 text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase font-bold">
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-content-secondary">
                      {l.minuteLimit.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-mono text-content-secondary">
                      {l.dailyLimit.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-mono text-content-secondary">
                      {l.monthlyLimit.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-mono text-content-secondary">
                      +{l.burstBonus} / {l.burstWindowSeconds}s
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Rate limit headers */}
      <SectionCard>
        <SectionTitle>Rate Limit Response Headers</SectionTitle>
        <p className="text-content-secondary text-sm mb-3">
          Every API response includes these headers so you can track usage
          programmatically.
        </p>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[440px]">
            <thead>
              <tr className="text-left text-content-muted border-b border-dark-border">
                <th className="px-3 py-2 font-medium">Header</th>
                <th className="px-3 py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-content-secondary">
              {[
                ["X-RateLimit-Limit-Minute", "Your per-minute request limit"],
                [
                  "X-RateLimit-Remaining-Minute",
                  "Requests remaining this minute",
                ],
                ["X-RateLimit-Limit-Day", "Your per-day request limit"],
                ["X-RateLimit-Remaining-Day", "Requests remaining today"],
                ["X-RateLimit-Limit-Month", "Your per-month request limit"],
                [
                  "X-RateLimit-Remaining-Month",
                  "Requests remaining this month",
                ],
                [
                  "Retry-After",
                  "Seconds to wait before retrying (only on 429)",
                ],
              ].map(([header, desc]) => (
                <tr
                  key={header}
                  className="border-b border-dark-border last:border-0"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-accent whitespace-nowrap">
                    {header}
                  </td>
                  <td className="px-3 py-2.5 text-sm">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Error Codes ─────────────────────────────────────────────────────────

function ErrorCodesTab({
  copy,
  isCopied,
}: {
  copy: (t: string, k: string) => void;
  isCopied: (k: string) => boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-content-secondary text-sm">
        All error responses follow the same JSON envelope. Check the{" "}
        <code className="bg-dark-elevated px-1.5 py-0.5 rounded text-xs text-accent">
          success
        </code>{" "}
        field first — it will be{" "}
        <code className="bg-dark-elevated px-1.5 py-0.5 rounded text-xs text-content-secondary">
          false
        </code>{" "}
        on any error.
      </p>

      {ERROR_CODES.map((err) => (
        <Collapsible
          key={err.code}
          defaultOpen={err.code === 429}
          title={
            <span className="flex items-center gap-3">
              <span className={`font-mono font-bold text-base ${err.color}`}>
                {err.code}
              </span>
              <span className="text-content-primary">{err.name}</span>
            </span>
          }
        >
          <div className="space-y-3 pt-2">
            <p className="text-content-secondary text-sm">{err.description}</p>

            {err.hasRetryAfter && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/8 border border-rose-500/20 text-sm text-rose-300">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  Always read the{" "}
                  <code className="bg-dark-elevated px-1 rounded text-xs">
                    Retry-After
                  </code>{" "}
                  response header — it tells you exactly how many seconds to
                  wait.
                </span>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">
                How to fix
              </p>
              <ul className="space-y-1">
                {err.solutions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-content-secondary"
                  >
                    <CheckCircle
                      size={13}
                      className="text-accent flex-shrink-0 mt-0.5"
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">
                Example response
              </p>
              <CodeBlock
                code={err.example}
                language="json"
                copyKey={`err-${err.code}`}
                onCopy={copy}
                isCopied={isCopied}
              />
            </div>
          </div>
        </Collapsible>
      ))}
    </div>
  );
}

// ─── Tab: Best Practices ──────────────────────────────────────────────────────

function BestPracticesTab({
  copy,
  isCopied,
}: {
  copy: (t: string, k: string) => void;
  isCopied: (k: string) => boolean;
}) {
  const practices = [
    {
      icon: Zap,
      title: "Cache responses",
      color: "text-yellow-400",
      body: "Food nutritional data changes rarely. Cache results in memory or localStorage to avoid burning through your quota on identical requests.",
      code: `// Simple in-memory cache (TTL: 5 minutes)
const cache = new Map();

async function getFoodCached(query) {
  const key = \`food:\${query}\`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < 5 * 60 * 1000) return hit.data;

  const res = await fetch(\`${API_URL_DISPLAY}/api/v1/foods/search?q=\${encodeURIComponent(query)}\`,
    { headers: { 'X-API-Key': process.env.KAL_API_KEY } });
  const data = await res.json();
  cache.set(key, { data, ts: Date.now() });
  return data;
}`,
      lang: "javascript",
    },
    {
      icon: AlertTriangle,
      title: "Handle 429s with exponential backoff",
      color: "text-rose-400",
      body: "When you hit a rate limit, wait before retrying. Use the Retry-After header value, or fall back to exponential backoff.",
      code: `async function fetchWithBackoff(url, opts, maxRetries = 4) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, opts);
    if (res.ok) return res.json();

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '1', 10);
      const delay = (retryAfter || Math.pow(2, attempt)) * 1000;
      await new Promise(r => setTimeout(r, delay));
      continue;
    }

    // Non-retryable error
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? \`HTTP \${res.status}\`);
  }
  throw new Error('Max retries exceeded');
}`,
      lang: "javascript",
    },
    {
      icon: Shield,
      title: "Never expose your API key in frontend code",
      color: "text-accent",
      body: "Your API key is a secret credential. Always proxy requests through your backend or a serverless function — never embed the key in client-side JavaScript.",
      code: `// ✅ Correct — key stays on the server (Next.js Route Handler)
// app/api/food/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const res = await fetch(
    \`${API_URL_DISPLAY}/api/v1/foods/search?q=\${encodeURIComponent(q)}\`,
    { headers: { 'X-API-Key': process.env.KAL_API_KEY! } }
  );
  return Response.json(await res.json());
}

// ❌ Wrong — key is visible in the browser bundle
const res = await fetch('/api/v1/foods/search?q=nasi', {
  headers: { 'X-API-Key': 'kal_your_real_key' }, // exposed!
});`,
      lang: "typescript",
    },
    {
      icon: CheckCircle,
      title: "Always check the success field",
      color: "text-emerald-400",
      body: 'Every response has a "success" boolean. Never assume a 200 response contains valid data — always guard against error payloads.',
      code: `const data = await res.json();

// ✅ Guard with success field
if (!data.success) {
  console.error('API error:', data.error);
  return;
}

// Safe to use data.data here
data.data.forEach(food => console.log(food.name));`,
      lang: "javascript",
    },
    {
      icon: BookOpen,
      title: "Use pagination for large datasets",
      color: "text-blue-400",
      body: "The /api/v1/foods and /api/v1/halal endpoints return up to 200 items per page. Use limit and offset to paginate instead of fetching everything at once.",
      code: `async function* paginate(baseUrl, apiKey, pageSize = 50) {
  let offset = 0;
  while (true) {
    const url = \`\${baseUrl}?limit=\${pageSize}&offset=\${offset}\`;
    const res = await fetch(url, { headers: { 'X-API-Key': apiKey } });
    const { data, pagination } = await res.json();
    yield data;
    if (!pagination.hasMore) break;
    offset += pageSize;
  }
}

// Usage
for await (const page of paginate('${API_URL_DISPLAY}/api/v1/foods', key)) {
  console.log(\`Got \${page.length} foods\`);
}`,
      lang: "javascript",
    },
  ];

  return (
    <div className="space-y-4">
      {practices.map((p) => {
        const Icon = p.icon;
        return (
          <Collapsible
            key={p.title}
            title={
              <span className="flex items-center gap-3">
                <Icon size={15} className={`flex-shrink-0 ${p.color}`} />
                {p.title}
              </span>
            }
          >
            <div className="space-y-3 pt-2">
              <p className="text-content-secondary text-sm">{p.body}</p>
              <CodeBlock
                code={p.code}
                language={p.lang}
                copyKey={`bp-${p.title}`}
                onCopy={copy}
                isCopied={isCopied}
              />
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}

// ─── Tab: API Keys ────────────────────────────────────────────────────────────

function ApiKeysTab({
  copy,
  isCopied,
}: {
  copy: (t: string, k: string) => void;
  isCopied: (k: string) => boolean;
}) {
  const { data: apiKeys } = trpc.apiKeys.list.useQuery();

  const activeKeys = (apiKeys ?? []).filter((k) => !k.isRevoked);

  return (
    <div className="space-y-6">
      {/* How authentication works */}
      <SectionCard>
        <SectionTitle>How Authentication Works</SectionTitle>
        <p className="text-content-secondary text-sm mb-4">
          Every request to the Kal API must include your key in the{" "}
          <code className="bg-dark-elevated px-1.5 py-0.5 rounded text-xs text-accent">
            X-API-Key
          </code>{" "}
          header. Query-string based auth is not supported.
        </p>
        <CodeBlock
          code={`GET ${API_URL_DISPLAY}/api/v1/foods/search?q=nasi+lemak
X-API-Key: kal_your_key_here`}
          language="http"
          copyKey="auth-header"
          onCopy={copy}
          isCopied={isCopied}
        />
      </SectionCard>

      {/* Your active keys */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Your Active Keys</SectionTitle>
          <Link
            href="/dashboard/api-keys"
            className="text-accent text-sm hover:underline flex items-center gap-1"
          >
            Manage <ExternalLink size={12} />
          </Link>
        </div>
        {activeKeys.length === 0 ? (
          <div className="text-center py-6 text-content-muted text-sm">
            No active keys.{" "}
            <Link
              href="/dashboard/api-keys"
              className="text-accent hover:underline"
            >
              Generate one →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activeKeys.map((k) => (
              <div
                key={k._id}
                className="flex items-center justify-between p-3 bg-dark-elevated rounded-lg"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-content-primary truncate">
                    {k.name}
                  </p>
                  <code className="text-xs text-content-muted">
                    {k.keyPrefix}…
                  </code>
                </div>
                <div className="text-right text-xs text-content-muted flex-shrink-0 ml-4">
                  {k.expiresAt
                    ? `Expires ${new Date(k.expiresAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}`
                    : "Never expires"}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Key lifecycle */}
      <SectionCard>
        <SectionTitle>Key Lifecycle & Best Practices</SectionTitle>
        <div className="space-y-4">
          {[
            {
              icon: Key,
              color: "text-accent",
              title: "Use one key per application",
              body: "Create separate keys for development, staging, and production. This way you can revoke a single key if it's compromised without affecting other apps.",
            },
            {
              icon: Lock,
              color: "text-yellow-400",
              title: "Save your key immediately",
              body: "The full API key is only shown once at creation time. After you close the modal it cannot be retrieved — copy it to a secure secrets manager (e.g. .env.local, Doppler, Vault).",
            },
            {
              icon: Shield,
              color: "text-blue-400",
              title: "Set expiration dates",
              body: 'Short-lived keys (1 week or 1 month) reduce the blast radius if a key is leaked. Prefer "Never" only for automated pipelines where rotation is handled separately.',
            },
            {
              icon: AlertCircle,
              color: "text-rose-400",
              title: "Revoke leaked keys immediately",
              body: "If you suspect a key is compromised, revoke it from the API Keys page right away. Revocation is instant — any request using the old key will immediately return 403.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-dark-elevated flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={14} className={item.color} />
                </div>
                <div>
                  <p className="text-sm font-medium text-content-primary mb-0.5">
                    {item.title}
                  </p>
                  <p className="text-xs text-content-secondary leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Expiration matrix */}
      <SectionCard>
        <SectionTitle>Expiration Options</SectionTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="text-left text-content-muted border-b border-dark-border">
                <th className="px-3 py-2 font-medium">Option</th>
                <th className="px-3 py-2 font-medium">Duration</th>
                <th className="px-3 py-2 font-medium">Best for</th>
              </tr>
            </thead>
            <tbody className="text-content-secondary">
              {[
                [
                  "1 Week",
                  "7 days from creation",
                  "Short experiments, hackathons, demos",
                ],
                [
                  "1 Month",
                  "30 days from creation",
                  "Development, staging environments",
                ],
                [
                  "Never",
                  "Does not expire",
                  "Production with manual rotation policy",
                ],
              ].map(([opt, dur, use]) => (
                <tr
                  key={opt}
                  className="border-b border-dark-border last:border-0"
                >
                  <td className="px-3 py-2.5 font-medium text-content-primary">
                    {opt}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{dur}</td>
                  <td className="px-3 py-2.5 text-xs">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Quick Reference ─────────────────────────────────────────────────────

function QuickReferenceTab({
  copy,
  isCopied,
}: {
  copy: (t: string, k: string) => void;
  isCopied: (k: string) => boolean;
}) {
  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/foods/search?q=",
      desc: "Search natural foods by name",
    },
    {
      method: "GET",
      path: "/api/v1/foods",
      desc: "List natural foods (pagination + category filter)",
    },
    {
      method: "GET",
      path: "/api/v1/foods/:id",
      desc: "Get single natural food by ID",
    },
    {
      method: "GET",
      path: "/api/v1/categories",
      desc: "All natural food categories",
    },
    {
      method: "GET",
      path: "/api/v1/halal/search?q=",
      desc: "Search JAKIM certified halal foods",
    },
    {
      method: "GET",
      path: "/api/v1/halal",
      desc: "List halal foods (brand + category filter)",
    },
    {
      method: "GET",
      path: "/api/v1/halal/:id",
      desc: "Get single halal food by ID",
    },
    {
      method: "GET",
      path: "/api/v1/halal/brands",
      desc: "All halal brand names",
    },
    { method: "GET", path: "/api/v1/stats", desc: "Database statistics" },
  ];

  return (
    <div className="space-y-6">
      {/* Base URL + auth */}
      <div className="grid md:grid-cols-2 gap-4">
        <SectionCard>
          <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">
            Base URL
          </p>
          <CodeBlock
            code={API_URL_DISPLAY}
            language="url"
            copyKey="base-url"
            onCopy={copy}
            isCopied={isCopied}
          />
        </SectionCard>
        <SectionCard>
          <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">
            Authentication Header
          </p>
          <CodeBlock
            code="X-API-Key: kal_your_key_here"
            language="header"
            copyKey="auth-hdr"
            onCopy={copy}
            isCopied={isCopied}
          />
        </SectionCard>
      </div>

      {/* Endpoint list */}
      <SectionCard>
        <SectionTitle>Endpoints</SectionTitle>
        <div className="space-y-1.5">
          {endpoints.map((e) => (
            <div
              key={e.path}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 border-b border-dark-border last:border-0"
            >
              <span className="inline-block text-xs font-bold bg-accent/10 text-accent px-2 py-0.5 rounded font-mono w-10 text-center flex-shrink-0">
                {e.method}
              </span>
              <code className="text-xs font-mono text-content-primary flex-shrink-0">
                {e.path}
              </code>
              <span className="text-xs text-content-muted sm:ml-auto">
                {e.desc}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/setup"
            className="inline-flex items-center gap-1.5 text-accent text-sm hover:underline"
          >
            Full interactive API reference <ExternalLink size={12} />
          </Link>
        </div>
      </SectionCard>

      {/* Response envelope */}
      <SectionCard>
        <SectionTitle>Response Envelope</SectionTitle>
        <p className="text-content-secondary text-sm mb-3">
          All endpoints return JSON with this consistent structure.
        </p>
        <CodeBlock
          code={`// Success
{
  "success": true,
  "data": [...],           // array or object
  "count": 12,             // search result count (search endpoints)
  "pagination": {          // paginated endpoints only
    "total": 97,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}

// Error
{
  "success": false,
  "error": "Human-readable error message",
  "retryAfter": 42         // only present on 429
}`}
          language="json"
          copyKey="response-envelope"
          onCopy={copy}
          isCopied={isCopied}
        />
      </SectionCard>

      {/* Food objects */}
      <SectionCard>
        <SectionTitle>Data Shapes</SectionTitle>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">
              Natural Food
            </p>
            <CodeBlock
              code={`{
  "id": "694bf52dcf55787e6332e9c0",
  "name": "Nasi Lemak",
  "calories": 644,
  "protein": 18,
  "carbs": 80,
  "fat": 28,
  "serving": "1 plate",
  "category": "Rice"
}`}
              language="json"
              copyKey="shape-natural"
              onCopy={copy}
              isCopied={isCopied}
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">
              Halal Certified Food
            </p>
            <CodeBlock
              code={`{
  "id": "694bf52dcf55787e6332e9c1",
  "name": "Ramly Beef Burger",
  "calories": 400,
  "protein": 15,
  "carbs": 35,
  "fat": 20,
  "serving": "1 burger (200g)",
  "category": "Fast Food",
  "brand": "Ramly",
  "halalCertifier": "JAKIM",
  "halalCertYear": 2024
}`}
              language="json"
              copyKey="shape-halal"
              onCopy={copy}
              isCopied={isCopied}
            />
          </div>
        </div>
      </SectionCard>

      {/* Query parameters */}
      <SectionCard>
        <SectionTitle>Common Query Parameters</SectionTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[440px]">
            <thead>
              <tr className="text-left text-content-muted border-b border-dark-border">
                <th className="px-3 py-2 font-medium">Parameter</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Default</th>
                <th className="px-3 py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-content-secondary">
              {[
                [
                  "q",
                  "string",
                  "—",
                  "Search query (required for /search endpoints)",
                ],
                ["limit", "integer", "50", "Max results per page (max: 200)"],
                ["offset", "integer", "0", "Pagination offset"],
                [
                  "category",
                  "string",
                  "—",
                  "Filter by food category (natural foods)",
                ],
                ["brand", "string", "—", "Filter by brand (halal foods)"],
                [
                  "withCount",
                  "boolean",
                  "false",
                  "Include item count per brand",
                ],
              ].map(([param, type, def, desc]) => (
                <tr
                  key={param}
                  className="border-b border-dark-border last:border-0"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-accent">
                    {param}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-content-muted">
                    {type}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-mono text-content-muted">
                    {def}
                  </td>
                  <td className="px-3 py-2.5 text-xs">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function DocsClient({ logtoId, email, name }: DocsClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <DocsContentWrapper expectedLogtoId={logtoId} />
    </>
  );
}

function DocsContentWrapper({ expectedLogtoId }: { expectedLogtoId?: string }) {
  const { logtoId } = useAuth();

  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-elevated rounded w-48" />
          <div className="h-4 bg-dark-elevated rounded w-64" />
        </div>
      </div>
    );
  }

  return <DocsContent />;
}

function DocsContent() {
  const [activeTab, setActiveTab] = useState<TabId>("rate-limits");
  const { copy, isCopied } = useCopy();

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1 md:mb-2">
          API Reference
        </h1>
        <p className="text-content-secondary text-sm md:text-base">
          Rate limits, error codes, best practices, and quick reference for the
          Kal API.
        </p>
      </div>

      {/* Tab bar — horizontal scroll on mobile */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? "bg-accent/10 text-accent border border-accent/30"
                  : "text-content-secondary hover:bg-dark-elevated hover:text-content-primary border border-transparent"
              }`}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              {/* Short labels on mobile */}
              <span className="sm:hidden">
                {tab.id === "rate-limits"
                  ? "Limits"
                  : tab.id === "best-practices"
                    ? "Tips"
                    : tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "rate-limits" && <RateLimitsTab />}
        {activeTab === "errors" && (
          <ErrorCodesTab copy={copy} isCopied={isCopied} />
        )}
        {activeTab === "best-practices" && (
          <BestPracticesTab copy={copy} isCopied={isCopied} />
        )}
        {activeTab === "keys" && <ApiKeysTab copy={copy} isCopied={isCopied} />}
        {activeTab === "reference" && (
          <QuickReferenceTab copy={copy} isCopied={isCopied} />
        )}
      </div>
    </div>
  );
}
