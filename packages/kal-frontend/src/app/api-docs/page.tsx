"use client";

import { useState } from "react";
import Link from "next/link";

// Get the API base URL from environment
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // In browser, use relative path or env
    return process.env.NEXT_PUBLIC_API_URL || "";
  }
  return "";
};

interface EndpointExample {
  id: string;
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  example: string;
}

const endpoints: EndpointExample[] = [
  {
    id: "search",
    method: "GET",
    path: "/api/foods/search",
    description: "Search foods by name. Returns up to 20 matching results.",
    params: [
      { name: "q", type: "string", required: true, description: "Search query (e.g., 'nasi', 'mee')" },
    ],
    example: '/api/foods/search?q=nasi',
  },
  {
    id: "list",
    method: "GET",
    path: "/api/foods",
    description: "List all foods with optional filtering and pagination.",
    params: [
      { name: "category", type: "string", required: false, description: "Filter by category (e.g., 'Rice', 'Noodles')" },
      { name: "limit", type: "integer", required: false, description: "Max results (default: 50, max: 200)" },
      { name: "offset", type: "integer", required: false, description: "Pagination offset (default: 0)" },
    ],
    example: '/api/foods?category=Rice&limit=5',
  },
  {
    id: "single",
    method: "GET",
    path: "/api/foods/:id",
    description: "Get a single food item by its ID.",
    params: [
      { name: "id", type: "string", required: true, description: "Food ID (MongoDB ObjectId)" },
    ],
    example: '/api/foods/694bf52dcf55787e6332e9c0',
  },
  {
    id: "categories",
    method: "GET",
    path: "/api/categories",
    description: "Get all available food categories.",
    example: '/api/categories',
  },
  {
    id: "stats",
    method: "GET",
    path: "/api/stats",
    description: "Get database statistics including total foods and categories.",
    example: '/api/stats',
  },
];

export default function APIDocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryEndpoint = async (example: string) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const apiUrl = getApiUrl();
      const fullUrl = apiUrl ? `${apiUrl}${example}` : example;
      const res = await fetch(fullUrl);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#262626]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🥗</span>
            <span className="text-xl font-bold text-[#10b981]">Kal</span>
          </Link>
          <h1 className="text-lg font-medium">API Documentation</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Intro */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#10b981]">Malaysian Food API</h2>
          <p className="text-[#a3a3a3] text-lg mb-6">
            Access our database of 100+ Malaysian foods with accurate nutritional information.
            All endpoints are public and require no authentication.
          </p>
          
          <div className="flex gap-4 flex-wrap">
            <a 
              href="/openapi.json" 
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-[#10b981] transition-colors"
            >
              📄 OpenAPI Spec
            </a>
            <a 
              href="https://github.com/Zen0space/Kal-Monorepo" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-[#10b981] transition-colors"
            >
              ⭐ GitHub
            </a>
          </div>
        </section>

        {/* Base URL */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-3">Base URL</h3>
          <code className="block bg-[#1a1a1a] border border-[#262626] rounded-lg px-4 py-3 text-[#10b981] font-mono">
            https://kalori-api.my
          </code>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-6">Endpoints</h3>
          
          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <div 
                key={endpoint.id}
                className="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setActiveEndpoint(activeEndpoint === endpoint.id ? null : endpoint.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-[#10b981] text-black text-xs font-bold rounded">
                      {endpoint.method}
                    </span>
                    <code className="text-white font-mono">{endpoint.path}</code>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-[#a3a3a3] transition-transform ${activeEndpoint === endpoint.id ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded content */}
                {activeEndpoint === endpoint.id && (
                  <div className="px-5 pb-5 pt-2 border-t border-[#262626]">
                    <p className="text-[#a3a3a3] mb-4">{endpoint.description}</p>

                    {/* Parameters */}
                    {endpoint.params && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-[#a3a3a3] mb-2">Parameters</h4>
                        <div className="bg-[#0a0a0a] rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[#525252] border-b border-[#262626]">
                                <th className="px-3 py-2">Name</th>
                                <th className="px-3 py-2">Type</th>
                                <th className="px-3 py-2">Required</th>
                                <th className="px-3 py-2">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {endpoint.params.map((param) => (
                                <tr key={param.name} className="border-b border-[#262626] last:border-b-0">
                                  <td className="px-3 py-2 font-mono text-[#10b981]">{param.name}</td>
                                  <td className="px-3 py-2 text-[#a3a3a3]">{param.type}</td>
                                  <td className="px-3 py-2">
                                    {param.required ? (
                                      <span className="text-red-400">Yes</span>
                                    ) : (
                                      <span className="text-[#525252]">No</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-[#a3a3a3]">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Try it */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-[#a3a3a3] mb-2">Try it</h4>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-2 font-mono text-sm text-[#a3a3a3] overflow-x-auto">
                          {endpoint.example}
                        </code>
                        <button
                          onClick={() => tryEndpoint(endpoint.example)}
                          disabled={loading}
                          className="px-4 py-2 bg-[#10b981] text-black font-semibold rounded-lg hover:bg-[#34d399] transition-colors disabled:opacity-50"
                        >
                          {loading ? "..." : "Run"}
                        </button>
                      </div>
                    </div>

                    {/* Response */}
                    {(response || error) && (
                      <div>
                        <h4 className="text-sm font-semibold text-[#a3a3a3] mb-2">Response</h4>
                        <pre className={`bg-[#0a0a0a] border border-[#262626] rounded-lg px-3 py-3 font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto ${error ? 'text-red-400' : 'text-[#a3a3a3]'}`}>
                          {error || response}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Response Format */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Response Format</h3>
          <p className="text-[#a3a3a3] mb-4">All endpoints return JSON with this structure:</p>
          <pre className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-4 font-mono text-sm overflow-x-auto">
{`{
  "success": true,
  "data": [...],       // The response data
  "count": 12,         // For search results
  "pagination": {      // For paginated endpoints
    "total": 97,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}`}
          </pre>
        </section>

        {/* Food Object */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Food Object</h3>
          <p className="text-[#a3a3a3] mb-4">Each food item contains:</p>
          <pre className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-4 font-mono text-sm overflow-x-auto">
{`{
  "id": "694bf52dcf55787e6332e9c0",
  "name": "Nasi Lemak",
  "calories": 644,
  "protein": 18,
  "carbs": 80,
  "fat": 28,
  "serving": "1 plate",
  "category": "Rice"
}`}
          </pre>
        </section>

        {/* cURL Examples */}
        <section>
          <h3 className="text-xl font-semibold mb-4">cURL Examples</h3>
          <div className="space-y-4">
            <div className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3">
              <p className="text-[#10b981] text-sm mb-2"># Search for nasi dishes</p>
              <code className="text-[#a3a3a3] font-mono text-sm">
                curl &quot;https://kalori-api.my/api/foods/search?q=nasi&quot;
              </code>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3">
              <p className="text-[#10b981] text-sm mb-2"># Get all rice dishes</p>
              <code className="text-[#a3a3a3] font-mono text-sm">
                curl &quot;https://kalori-api.my/api/foods?category=Rice&quot;
              </code>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-lg px-4 py-3">
              <p className="text-[#10b981] text-sm mb-2"># Get database stats</p>
              <code className="text-[#a3a3a3] font-mono text-sm">
                curl &quot;https://kalori-api.my/api/stats&quot;
              </code>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#262626] mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-[#525252]">
          <p>Made with ❤️ in Malaysia</p>
          <Link href="/" className="hover:text-[#10b981] transition-colors">← Back to Kal</Link>
        </div>
      </footer>
    </main>
  );
}
