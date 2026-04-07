"use client";

import { useState } from "react";
import {
  AlertCircle,
  Book,
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Copy,
  ExternalLink,
  Play,
  Terminal,
} from "react-feather";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { API_URL_DISPLAY } from "@/lib/site-config";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SetupClientProps {
  logtoId?: string;
}

type TabType =
  | "playground"
  | "env"
  | "curl"
  | "nodejs"
  | "python"
  | "react"
  | "nextjs";

interface Snippet {
  title: string;
  description?: string;
  code: string;
  language: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GETTING_STARTED_TABS: { id: TabType; label: string }[] = [
  { id: "playground", label: "Test API" },
  { id: "env", label: "Environment" },
];

const CODE_EXAMPLE_TABS: { id: TabType; label: string }[] = [
  { id: "curl", label: "curl" },
  { id: "nodejs", label: "Node.js" },
  { id: "python", label: "Python" },
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
];

// ─── Entry / wrapper ─────────────────────────────────────────────────────────

export default function SetupClient({ logtoId }: SetupClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} />
      <SetupContentWrapper expectedLogtoId={logtoId} />
    </>
  );
}

function SetupContentWrapper({
  expectedLogtoId,
}: {
  expectedLogtoId?: string;
}) {
  const { logtoId } = useAuth();

  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/[0.04] rounded w-48" />
          <div className="h-4 bg-white/[0.04] rounded w-64" />
          <div className="h-12 bg-white/[0.04] rounded-xl mt-4" />
          <div className="flex gap-2 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 bg-white/[0.04] rounded-xl w-24" />
            ))}
          </div>
          <div className="h-64 bg-white/[0.04] rounded-xl mt-4" />
        </div>
      </div>
    );
  }

  return <SetupContent />;
}

// ─── Shared: Copy hook ───────────────────────────────────────────────────────

function useCopy() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return { copy, isCopied: (key: string) => copiedKey === key };
}

// ─── Tab Pill ────────────────────────────────────────────────────────────────

function TabPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 md:px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
        active
          ? "bg-accent/[0.1] text-accent border border-accent/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
          : "bg-white/[0.02] text-content-secondary border border-white/[0.06] hover:border-white/[0.1] hover:text-content-primary"
      }`}
    >
      {label}
    </button>
  );
}

// ─── API Playground ──────────────────────────────────────────────────────────

function ApiPlayground({
  apiKey,
  onApiKeyChange,
}: {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}) {
  const [query, setQuery] = useState("nasi lemak");
  const [endpoint, setEndpoint] = useState<"foods" | "halal">("foods");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setResponseTime(null);

    const startTime = performance.now();
    const baseUrl = API_URL_DISPLAY;
    const url =
      endpoint === "halal"
        ? `${baseUrl}/api/v1/halal/search?q=${encodeURIComponent(query)}`
        : `${baseUrl}/api/v1/foods/search?q=${encodeURIComponent(query)}`;

    try {
      const res = await fetch(url, {
        headers: { "X-API-Key": apiKey },
      });

      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

      const data = await res.json();

      if (!res.ok) {
        setError(`Error ${res.status}: ${data.error || res.statusText}`);
        setResponse(JSON.stringify(data, null, 2));
      } else {
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError(
        `Network error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Request Builder */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/[0.1] transition-all duration-200">
        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-4">
          Request Builder
        </h3>

        {/* API Key */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-content-muted mb-1.5">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="kal_xxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl
              text-content-primary placeholder-content-muted font-mono text-sm
              focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/20
              transition-all duration-200"
          />
        </div>

        {/* Endpoint + Query + Run — horizontal on desktop */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Endpoint picker */}
          <div className="flex gap-1.5 md:flex-shrink-0">
            {(
              [
                { value: "foods", label: "/foods/search" },
                { value: "halal", label: "/halal/search" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setEndpoint(opt.value)}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium font-mono transition-all duration-200 ${
                  endpoint === opt.value
                    ? "bg-accent text-dark shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "bg-white/[0.04] text-content-secondary border border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search query */}
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., nasi lemak, roti canai…"
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
              className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl
                text-content-primary placeholder-content-muted text-sm
                focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/20
                transition-all duration-200"
            />
          </div>

          {/* Run button */}
          <button
            onClick={handleTest}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-dark font-semibold rounded-xl
              hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed text-sm md:flex-shrink-0"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play size={14} />
                Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response Viewer */}
      {(response || error) && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Response header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-content-primary">
                Response
              </span>
              {responseTime != null && (
                <span className="text-[11px] font-mono text-content-muted bg-white/[0.06] px-2 py-0.5 rounded-md">
                  {responseTime}ms
                </span>
              )}
            </div>
            {error ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Error
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Success
              </span>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="px-4 py-2.5 bg-red-500/[0.06] border-b border-red-500/20">
              <p className="text-red-400 text-xs flex items-center gap-1.5">
                <AlertCircle size={12} className="shrink-0" />
                {error}
              </p>
            </div>
          )}

          {/* Response body */}
          <pre className="p-4 overflow-x-auto text-xs md:text-sm max-h-96 overflow-y-auto bg-[#0a0a0a]">
            <code className="text-content-secondary">{response}</code>
          </pre>
        </div>
      )}

      {/* Tips */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/[0.1] transition-all duration-200">
        <h4 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-3">
          Tips
        </h4>
        <ul className="text-content-muted text-xs md:text-sm space-y-2">
          {[
            <>
              Your API key starts with{" "}
              <code className="bg-white/[0.06] px-1.5 py-0.5 rounded-md text-xs text-accent font-mono">
                kal_
              </code>
            </>,
            "Try searching for: nasi lemak, roti canai, teh tarik, mee goreng",
            "The halal endpoint returns JAKIM certified products only",
            <>
              Press{" "}
              <kbd className="bg-white/[0.06] px-1.5 py-0.5 rounded-md text-[11px] font-mono text-content-secondary">
                Enter
              </kbd>{" "}
              in the search field to run quickly
            </>,
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-accent/40 mt-2 shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Interactive Endpoints (right panel) ─────────────────────────────────────

interface EndpointData {
  id: string;
  method: string;
  path: string;
  description: string;
  params?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  defaultExample: string;
  section: "natural" | "halal" | "general";
}

const endpointsData: EndpointData[] = [
  {
    id: "foods-search",
    method: "GET",
    path: "/api/v1/foods/search",
    description: "Search natural Malaysian foods by name",
    params: [
      {
        name: "q",
        type: "string",
        required: true,
        description: "Search query",
      },
    ],
    defaultExample: "/api/v1/foods/search?q=nasi",
    section: "natural",
  },
  {
    id: "foods-list",
    method: "GET",
    path: "/api/v1/foods",
    description: "List natural foods with pagination and filtering",
    params: [
      {
        name: "category",
        type: "string",
        required: false,
        description: "Filter by category",
      },
      {
        name: "limit",
        type: "integer",
        required: false,
        description: "Max results (default: 50, max: 200)",
      },
      {
        name: "offset",
        type: "integer",
        required: false,
        description: "Pagination offset (default: 0)",
      },
    ],
    defaultExample: "/api/v1/foods?limit=5",
    section: "natural",
  },
  {
    id: "foods-single",
    method: "GET",
    path: "/api/v1/foods/:id",
    description: "Get a single natural food by ID",
    params: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Food ID (MongoDB ObjectId)",
      },
    ],
    defaultExample: "/api/v1/foods/696d6752260e86a2b61634ef",
    section: "natural",
  },
  {
    id: "categories",
    method: "GET",
    path: "/api/v1/categories",
    description: "Get all natural food categories",
    defaultExample: "/api/v1/categories",
    section: "natural",
  },
  {
    id: "halal-search",
    method: "GET",
    path: "/api/v1/halal/search",
    description: "Search JAKIM certified halal foods",
    params: [
      {
        name: "q",
        type: "string",
        required: true,
        description: "Search query",
      },
    ],
    defaultExample: "/api/v1/halal/search?q=ramly",
    section: "halal",
  },
  {
    id: "halal-list",
    method: "GET",
    path: "/api/v1/halal",
    description: "List halal foods with filtering and pagination",
    params: [
      {
        name: "brand",
        type: "string",
        required: false,
        description: "Filter by brand",
      },
      {
        name: "category",
        type: "string",
        required: false,
        description: "Filter by category",
      },
      {
        name: "limit",
        type: "integer",
        required: false,
        description: "Max results (default: 50, max: 200)",
      },
      {
        name: "offset",
        type: "integer",
        required: false,
        description: "Pagination offset (default: 0)",
      },
    ],
    defaultExample: "/api/v1/halal?brand=Ramly&limit=5",
    section: "halal",
  },
  {
    id: "halal-single",
    method: "GET",
    path: "/api/v1/halal/:id",
    description: "Get a single halal food by ID",
    params: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Food ID (MongoDB ObjectId)",
      },
    ],
    defaultExample: "/api/v1/halal/696d6752260e86a2b616381b",
    section: "halal",
  },
  {
    id: "halal-brands",
    method: "GET",
    path: "/api/v1/halal/brands",
    description: "Get halal brands, optionally filter or include counts",
    params: [
      {
        name: "q",
        type: "string",
        required: false,
        description: "Filter brands by name",
      },
      {
        name: "withCount",
        type: "string",
        required: false,
        description: "Set to 'true' to include product count",
      },
    ],
    defaultExample: "/api/v1/halal/brands?q=ramly",
    section: "halal",
  },
  {
    id: "stats",
    method: "GET",
    path: "/api/v1/stats",
    description: "Get database statistics and counts",
    defaultExample: "/api/v1/stats",
    section: "general",
  },
];

function InteractiveEndpoints({ apiKey }: { apiKey: string }) {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [tryUrls, setTryUrls] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<
    Record<string, { data: string; error: boolean; time: number } | null>
  >({});
  const [loadingEndpoint, setLoadingEndpoint] = useState<string | null>(null);

  const getTryUrl = (endpointId: string, defaultExample: string) => {
    return tryUrls[endpointId] ?? defaultExample;
  };

  const setTryUrl = (endpointId: string, url: string) => {
    setTryUrls((prev) => ({ ...prev, [endpointId]: url }));
  };

  const runEndpoint = async (ep: EndpointData) => {
    if (!apiKey.trim()) {
      setResponses((prev) => ({
        ...prev,
        [ep.id]: {
          data: "Please enter an API key in the Test API panel first",
          error: true,
          time: 0,
        },
      }));
      return;
    }

    setLoadingEndpoint(ep.id);
    const startTime = performance.now();
    const path = getTryUrl(ep.id, ep.defaultExample);

    try {
      const res = await fetch(`${API_URL_DISPLAY}${path}`, {
        headers: { "X-API-Key": apiKey },
      });
      const endTime = performance.now();
      const data = await res.json();

      setResponses((prev) => ({
        ...prev,
        [ep.id]: {
          data: JSON.stringify(data, null, 2),
          error: !res.ok,
          time: Math.round(endTime - startTime),
        },
      }));
    } catch (err) {
      setResponses((prev) => ({
        ...prev,
        [ep.id]: {
          data: `Network error: ${err instanceof Error ? err.message : "Unknown"}`,
          error: true,
          time: 0,
        },
      }));
    } finally {
      setLoadingEndpoint(null);
    }
  };

  const sections = [
    {
      label: "Natural Foods",
      endpoints: endpointsData.filter((e) => e.section === "natural"),
    },
    {
      label: "Halal Certified",
      endpoints: endpointsData.filter((e) => e.section === "halal"),
    },
    {
      label: "General",
      endpoints: endpointsData.filter((e) => e.section === "general"),
    },
  ];

  return (
    <div className="divide-y divide-white/[0.06]">
      {sections.map((section) => (
        <div key={section.label} className="p-4">
          <h3 className="text-[11px] font-semibold text-content-muted uppercase tracking-wider mb-2.5">
            {section.label}
          </h3>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
            {section.endpoints.map((ep) => {
              const isActive = activeEndpoint === ep.id;
              const epResponse = responses[ep.id];
              const isLoading = loadingEndpoint === ep.id;

              return (
                <div key={ep.id}>
                  <button
                    onClick={() => setActiveEndpoint(isActive ? null : ep.id)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wide text-sky-400 bg-sky-500/10 shrink-0">
                        {ep.method}
                      </span>
                      <code className="text-xs text-content-secondary truncate">
                        {ep.path}
                      </code>
                    </div>
                    {isActive ? (
                      <ChevronUp
                        size={13}
                        className="text-content-muted shrink-0"
                      />
                    ) : (
                      <ChevronDown
                        size={13}
                        className="text-content-muted shrink-0"
                      />
                    )}
                  </button>

                  {isActive && (
                    <div className="mx-3 mb-3 mt-1 rounded-xl bg-white/[0.02] border border-white/[0.06] p-3.5 space-y-3">
                      <p className="text-xs text-content-muted">
                        {ep.description}
                      </p>

                      {/* Params */}
                      {ep.params && (
                        <div className="text-xs text-content-muted">
                          <span className="text-content-muted/60">
                            Params:{" "}
                          </span>
                          {ep.params.map((p, i) => (
                            <span key={p.name}>
                              <code className="text-accent">{p.name}</code>
                              {p.required && (
                                <span className="text-red-400">*</span>
                              )}
                              {i < ep.params!.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Try it */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={getTryUrl(ep.id, ep.defaultExample)}
                          onChange={(e) => setTryUrl(ep.id, e.target.value)}
                          className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-2 font-mono text-xs text-content-primary
                            focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/20 transition-all duration-200"
                        />
                        <button
                          onClick={() => runEndpoint(ep)}
                          disabled={isLoading}
                          className="px-3 py-2 bg-accent text-dark text-xs font-semibold rounded-xl
                            hover:shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all duration-200
                            disabled:opacity-50"
                        >
                          {isLoading ? "…" : "Run"}
                        </button>
                      </div>

                      {/* Response */}
                      {epResponse && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-content-muted font-medium uppercase tracking-wider">
                              Response
                            </span>
                            {epResponse.time > 0 && (
                              <span className="text-[10px] font-mono text-content-muted bg-white/[0.06] px-1.5 py-0.5 rounded-md">
                                {epResponse.time}ms
                              </span>
                            )}
                          </div>
                          <pre
                            className={`bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-3 text-xs overflow-x-auto max-h-40 overflow-y-auto ${
                              epResponse.error
                                ? "text-red-400"
                                : "text-content-secondary"
                            }`}
                          >
                            {epResponse.data}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function SetupContent() {
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<TabType>("playground");
  const { copy, isCopied } = useCopy();
  const [sharedApiKey, setSharedApiKey] = useState("");
  const { data: apiKeys } = trpc.apiKeys.list.useQuery();

  const firstKeyPrefix = apiKeys?.[0]?.keyPrefix || "kal_xxxxxxxx";

  // ── Snippet definitions ──

  const envSnippets: Snippet[] = [
    {
      title: "1. Create .env file",
      description:
        "Add your API key to environment variables for secure storage",
      code: `# .env or .env.local
KAL_API_KEY=your_api_key_here
KAL_API_URL=${API_URL_DISPLAY}`,
      language: "bash",
    },
    {
      title: "2. Add to .gitignore",
      description: "Never commit your API keys to version control",
      code: `# .gitignore
.env
.env.local
.env*.local`,
      language: "bash",
    },
    {
      title: "3. Type definitions (TypeScript)",
      description: "Optional: Add type safety for environment variables",
      code: `// env.d.ts or types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    KAL_API_KEY: string;
    KAL_API_URL: string;
  }
}`,
      language: "typescript",
    },
  ];

  const curlSnippets: Snippet[] = [
    {
      title: "1. Basic search request",
      description: "Search for Malaysian foods using curl",
      code: `curl -X GET "${API_URL_DISPLAY}/api/v1/foods/search?q=nasi+lemak" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      language: "bash",
    },
    {
      title: "2. Search halal certified foods",
      description: "Find JAKIM certified halal products",
      code: `curl -X GET "${API_URL_DISPLAY}/api/v1/halal/search?q=ramly" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      language: "bash",
    },
    {
      title: "3. List foods with pagination",
      description: "Get paginated list with optional category filter",
      code: `curl -X GET "${API_URL_DISPLAY}/api/v1/foods?category=Rice&limit=10&offset=0" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      language: "bash",
    },
    {
      title: "4. Get single food by ID",
      description: "Retrieve a specific food item",
      code: `curl -X GET "${API_URL_DISPLAY}/api/v1/foods/FOOD_ID" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      language: "bash",
    },
    {
      title: "5. Get all categories",
      description: "List all available food categories",
      code: `curl -X GET "${API_URL_DISPLAY}/api/v1/categories" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      language: "bash",
    },
    {
      title: "6. Get halal brands",
      description: "List all halal certified brands",
      code: `curl -X GET "${API_URL_DISPLAY}/api/v1/halal/brands" \\
  -H "X-API-Key: YOUR_API_KEY"`,
      language: "bash",
    },
    {
      title: "7. Pretty print JSON output",
      description:
        "Pipe through jq for formatted output (install: brew install jq)",
      code: `curl -s "${API_URL_DISPLAY}/api/v1/foods/search?q=roti" \\
  -H "X-API-Key: YOUR_API_KEY" | jq '.'`,
      language: "bash",
    },
  ];

  const nodejsSnippets: Snippet[] = [
    {
      title: "1. Install dependencies",
      description:
        "node-fetch is only needed for Node.js < 18, dotenv for env vars",
      code: `# Node.js 18+ has fetch built-in, only dotenv needed
npm install dotenv
# or (for Node.js < 18)
npm install node-fetch dotenv`,
      language: "bash",
    },
    {
      title: "2. Basic setup with fetch",
      description: "Native fetch (Node.js 18+) — no extra packages needed",
      code: `// search-foods.js
import 'dotenv/config';

const API_KEY = process.env.KAL_API_KEY;
const BASE_URL = process.env.KAL_API_URL || '${API_URL_DISPLAY}';

async function searchFoods(query) {
  const url = \`\${BASE_URL}/api/v1/foods/search?q=\${encodeURIComponent(query)}\`;

  const response = await fetch(url, {
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
  }

  return response.json();
}

// Usage
const data = await searchFoods('nasi lemak');
console.log(\`Found \${data.count} results\`);
data.data.forEach(food => {
  console.log(\`\${food.name}: \${food.calories} cal\`);
});`,
      language: "javascript",
    },
    {
      title: "3. Search halal certified foods",
      description: "Find JAKIM certified products",
      code: `async function searchHalalFoods(query) {
  const url = \`\${BASE_URL}/api/v1/halal/search?q=\${encodeURIComponent(query)}\`;

  const response = await fetch(url, {
    headers: { 'X-API-Key': API_KEY },
  });

  return response.json();
}

// Example
const halal = await searchHalalFoods('ramly');
console.log(\`Found \${halal.count} halal products\`);
halal.data.forEach(food => {
  console.log(\`\${food.brand} - \${food.name}: \${food.calories} cal\`);
});`,
      language: "javascript",
    },
    {
      title: "4. With error handling & rate limit retry",
      description: "Handles 429 rate limit responses with exponential backoff",
      code: `async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);

    if (response.ok) return response.json();

    if (response.status === 429) {
      const wait = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(\`Rate limited — retrying in \${wait}ms...\`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || \`HTTP \${response.status}\`);
  }
  throw new Error('Max retries exceeded');
}

// Usage
const data = await fetchWithRetry(
  \`\${BASE_URL}/api/v1/foods/search?q=nasi\`,
  { headers: { 'X-API-Key': API_KEY } }
);`,
      language: "javascript",
    },
    {
      title: "5. Full CLI script example",
      description: 'Run with: node search-foods.mjs "roti canai"',
      code: `// search-foods.mjs
import 'dotenv/config';

const API_KEY = process.env.KAL_API_KEY;
const BASE_URL = '${API_URL_DISPLAY}';

const query = process.argv[2] || 'nasi lemak';

try {
  const response = await fetch(
    \`\${BASE_URL}/api/v1/foods/search?q=\${encodeURIComponent(query)}\`,
    { headers: { 'X-API-Key': API_KEY } }
  );

  if (!response.ok) throw new Error(\`HTTP \${response.status}\`);

  const data = await response.json();
  console.log(\`\\nFound \${data.count} results for "\${query}":\\n\`);

  data.data.forEach(food => {
    console.log(\`  \${food.name}\`);
    console.log(\`    Calories: \${food.calories} kcal\`);
    console.log(\`    Protein: \${food.protein}g | Carbs: \${food.carbs}g | Fat: \${food.fat}g\`);
    console.log(\`    Serving: \${food.serving}\\n\`);
  });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}`,
      language: "javascript",
    },
  ];

  const pythonSnippets: Snippet[] = [
    {
      title: "1. Install dependencies",
      code: `pip install requests python-dotenv`,
      language: "bash",
    },
    {
      title: "2. Load environment variables",
      code: `import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("KAL_API_KEY")
BASE_URL = os.getenv("KAL_API_URL", "${API_URL_DISPLAY}")`,
      language: "python",
    },
    {
      title: "3. Search for foods",
      code: `import requests

def search_foods(query: str):
    """Search for Malaysian foods by name."""
    response = requests.get(
        f"{BASE_URL}/api/v1/foods/search",
        params={"q": query},
        headers={"X-API-Key": API_KEY}
    )
    return response.json()

# Example usage
results = search_foods("nasi lemak")
for food in results.get("data", []):
    print(f"{food['name']}: {food['calories']} cal")`,
      language: "python",
    },
    {
      title: "4. Search halal certified foods",
      code: `def search_halal_foods(query: str):
    """Search JAKIM certified halal foods."""
    response = requests.get(
        f"{BASE_URL}/api/v1/halal/search",
        params={"q": query},
        headers={"X-API-Key": API_KEY}
    )
    return response.json()

# Example: Find Ramly products
halal_foods = search_halal_foods("ramly")
for food in halal_foods.get("data", []):
    print(f"{food['brand']} - {food['name']}: {food['calories']} cal")`,
      language: "python",
    },
  ];

  const reactSnippets: Snippet[] = [
    {
      title: "1. Install dependencies",
      code: `npm install axios
# or
yarn add axios
# or
pnpm add axios`,
      language: "bash",
    },
    {
      title: "2. Create API client",
      code: `// src/lib/kal-api.ts
import axios from 'axios';

const kalApi = axios.create({
  baseURL: process.env.REACT_APP_KAL_API_URL || '${API_URL_DISPLAY}',
  headers: {
    'X-API-Key': process.env.REACT_APP_KAL_API_KEY,
    'Content-Type': 'application/json',
  },
});

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  serving_size: string;
}

export const searchFoods = async (query: string): Promise<Food[]> => {
  const { data } = await kalApi.get('/api/v1/foods/search', {
    params: { q: query },
  });
  return data.data;
};

export const searchHalalFoods = async (query: string): Promise<Food[]> => {
  const { data } = await kalApi.get('/api/v1/halal/search', {
    params: { q: query },
  });
  return data.data;
};

export default kalApi;`,
      language: "typescript",
    },
    {
      title: "3. Create custom hook",
      code: `// src/hooks/useFoodSearch.ts
import { useState, useCallback } from 'react';
import { searchFoods, searchHalalFoods, Food } from '../lib/kal-api';

export function useFoodSearch() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, halal = false) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const results = halal 
        ? await searchHalalFoods(query)
        : await searchFoods(query);
      setFoods(results);
    } catch (err) {
      setError('Failed to search foods');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { foods, loading, error, search };
}`,
      language: "typescript",
    },
    {
      title: "4. Use in component",
      code: `// src/components/FoodSearch.tsx
import { useState } from 'react';
import { useFoodSearch } from '../hooks/useFoodSearch';

export function FoodSearch() {
  const [query, setQuery] = useState('');
  const { foods, loading, error, search } = useFoodSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Malaysian foods..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul>
        {foods.map((food) => (
          <li key={food.id}>
            <strong>{food.name}</strong>
            <span>{food.calories} cal | {food.protein}g protein</span>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      language: "tsx",
    },
  ];

  const nextjsSnippets: Snippet[] = [
    {
      title: "1. Environment setup",
      description: "Add to .env.local (client-side needs NEXT_PUBLIC_ prefix)",
      code: `# .env.local
KAL_API_KEY=your_api_key_here
KAL_API_URL=${API_URL_DISPLAY}

# For client-side usage (if needed)
NEXT_PUBLIC_KAL_API_URL=${API_URL_DISPLAY}`,
      language: "bash",
    },
    {
      title: "2. Create server-side API client",
      code: `// lib/kal-api.ts
const API_KEY = process.env.KAL_API_KEY;
const BASE_URL = process.env.KAL_API_URL || '${API_URL_DISPLAY}';

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  serving_size: string;
}

export async function searchFoods(query: string): Promise<Food[]> {
  const res = await fetch(
    \`\${BASE_URL}/api/v1/foods/search?q=\${encodeURIComponent(query)}\`,
    {
      headers: { 'X-API-Key': API_KEY! },
      next: { revalidate: 60 }, // Cache for 60 seconds
    }
  );
  
  if (!res.ok) throw new Error('Failed to fetch foods');
  const data = await res.json();
  return data.data;
}

export async function searchHalalFoods(query: string): Promise<Food[]> {
  const res = await fetch(
    \`\${BASE_URL}/api/v1/halal/search?q=\${encodeURIComponent(query)}\`,
    {
      headers: { 'X-API-Key': API_KEY! },
      next: { revalidate: 60 },
    }
  );
  
  if (!res.ok) throw new Error('Failed to fetch halal foods');
  const data = await res.json();
  return data.data;
}`,
      language: "typescript",
    },
    {
      title: "3. Server Component usage",
      code: `// app/foods/page.tsx
import { searchFoods } from '@/lib/kal-api';

interface PageProps {
  searchParams: { q?: string };
}

export default async function FoodsPage({ searchParams }: PageProps) {
  const query = searchParams.q || '';
  const foods = query ? await searchFoods(query) : [];

  return (
    <div>
      <h1>Malaysian Food Search</h1>
      
      <form action="/foods" method="get">
        <input 
          type="text" 
          name="q" 
          defaultValue={query}
          placeholder="Search foods..." 
        />
        <button type="submit">Search</button>
      </form>

      <ul>
        {foods.map((food) => (
          <li key={food.id}>
            <strong>{food.name}</strong>
            <p>{food.calories} cal | {food.protein}g protein</p>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      language: "tsx",
    },
    {
      title: "4. API Route (if proxying to client)",
      code: `// app/api/v1/foods/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.KAL_API_KEY;
const BASE_URL = process.env.KAL_API_URL || '${API_URL_DISPLAY}';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      \`\${BASE_URL}/api/v1/foods/search?q=\${encodeURIComponent(query)}\`,
      { headers: { 'X-API-Key': API_KEY! } }
    );
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch' }, 
      { status: 500 }
    );
  }
}`,
      language: "typescript",
    },
  ];

  const getSnippets = (): Snippet[] => {
    switch (activeTab) {
      case "env":
        return envSnippets;
      case "curl":
        return curlSnippets;
      case "nodejs":
        return nodejsSnippets;
      case "python":
        return pythonSnippets;
      case "react":
        return reactSnippets;
      case "nextjs":
        return nextjsSnippets;
      default:
        return [];
    }
  };

  const snippets = getSnippets();

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1">
          Setup Guide
        </h1>
        <p className="text-content-secondary text-sm md:text-base">
          Get started using the Kal API in your project
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
      </div>

      {/* API Key Reminder */}
      <div className="bg-accent/[0.06] border border-accent/20 rounded-xl p-3.5 md:p-4 mb-6">
        <p className="text-accent text-xs md:text-sm">
          <strong>Your API Key:</strong> Make sure you have generated an API key
          from the{" "}
          <a
            href="/dashboard/api-keys"
            className="underline hover:no-underline"
          >
            API Keys page
          </a>
          .
          {apiKeys && apiKeys.length > 0 && (
            <span className="block mt-1 text-content-secondary">
              You have {apiKeys.length} active key(s). Latest:{" "}
              <code className="bg-white/[0.06] px-1.5 py-0.5 rounded-md text-xs font-mono">
                {firstKeyPrefix}…
              </code>
            </span>
          )}
        </p>
      </div>

      {/* Grouped tab bar */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6 md:mb-8">
        {/* Getting Started group */}
        <span className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mr-1 hidden sm:inline">
          Start
        </span>
        {GETTING_STARTED_TABS.map((tab) => (
          <TabPill
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}

        {/* Divider */}
        <span className="w-px h-6 bg-white/[0.06] mx-1.5 hidden sm:block" />

        {/* Code Examples group */}
        <span className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mr-1 hidden sm:inline">
          Code
        </span>
        {CODE_EXAMPLE_TABS.map((tab) => (
          <TabPill
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* 60/40 split on xl */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6 xl:gap-8">
        {/* ── Left column: Tab content ── */}
        <div className="min-w-0">
          {activeTab === "playground" ? (
            <ApiPlayground
              apiKey={sharedApiKey}
              onApiKeyChange={setSharedApiKey}
            />
          ) : (
            <div className="space-y-4">
              {snippets.map((snippet, index) => (
                <div
                  key={index}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden
                    hover:border-white/[0.1] transition-all duration-200"
                >
                  {/* Snippet header */}
                  <div className="flex items-start md:items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/[0.06] gap-2">
                    <div>
                      <h3 className="font-medium text-content-primary text-sm">
                        {snippet.title}
                      </h3>
                      {snippet.description && (
                        <p className="text-content-muted text-xs mt-0.5">
                          {snippet.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => copy(snippet.code, `snippet-${index}`)}
                      className="flex items-center gap-1.5 text-xs text-content-muted hover:text-content-primary
                        transition-colors p-1.5 rounded-lg hover:bg-white/[0.06] flex-shrink-0"
                    >
                      {isCopied(`snippet-${index}`) ? (
                        <>
                          <Check size={12} className="text-accent" />
                          <span className="hidden md:inline">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span className="hidden md:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code block */}
                  <div className="relative">
                    <span className="absolute top-2.5 right-3 text-[10px] text-content-muted/40 uppercase tracking-widest select-none">
                      {snippet.language}
                    </span>
                    <pre className="p-4 overflow-x-auto text-xs md:text-sm bg-[#0a0a0a]">
                      <code className="text-content-secondary leading-relaxed">
                        {snippet.code}
                      </code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Need more help */}
          <div className="mt-6 md:mt-8 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 md:p-5 hover:border-white/[0.1] transition-all duration-200">
            <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider mb-3">
              Need more help?
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/dashboard/docs"
                className="text-accent hover:underline text-xs md:text-sm flex items-center gap-1.5"
              >
                <Book size={12} />
                View API Documentation
                <ExternalLink size={10} className="text-accent/50" />
              </a>
              <a
                href="https://github.com/Zen0space/Kal-Monorepo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline text-xs md:text-sm flex items-center gap-1.5"
              >
                <Code size={12} />
                GitHub Repository
                <ExternalLink size={10} className="text-accent/50" />
              </a>
            </div>
          </div>
        </div>

        {/* ── Right column: API Quick Reference ── */}
        <div className="min-w-0">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
            {/* Panel header */}
            <div className="px-4 py-3 md:px-5 md:py-4 bg-white/[0.04] border-b border-white/[0.06]">
              <h2 className="font-semibold text-content-primary flex items-center gap-2 text-sm">
                <Terminal size={15} className="text-accent" />
                API Quick Reference
              </h2>
              <p className="text-xs text-content-muted mt-1">
                {sharedApiKey ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    API key ready — click endpoints to test
                  </span>
                ) : (
                  "Enter API key in Test API panel to try endpoints"
                )}
              </p>
            </div>

            {/* Endpoints */}
            <InteractiveEndpoints apiKey={sharedApiKey} />

            {/* Footer link */}
            <div className="p-3 border-t border-white/[0.06]">
              <a
                href="/dashboard/docs"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-accent/[0.1] border border-accent/20
                  rounded-xl text-accent text-sm font-medium hover:bg-accent/[0.15] transition-colors"
              >
                View Full Documentation
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
