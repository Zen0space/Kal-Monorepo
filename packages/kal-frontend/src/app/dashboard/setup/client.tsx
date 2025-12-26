"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, Play, Terminal } from "react-feather";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface SetupClientProps {
  logtoId?: string;
}

export default function SetupClient({ logtoId }: SetupClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} />
      <SetupContentWrapper expectedLogtoId={logtoId} />
    </>
  );
}

function SetupContentWrapper({ expectedLogtoId }: { expectedLogtoId?: string }) {
  const { logtoId } = useAuth();
  
  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-elevated rounded w-48 mb-4" />
          <div className="h-4 bg-dark-elevated rounded w-32" />
        </div>
      </div>
    );
  }

  return <SetupContent />;
}

type TabType = "playground" | "env" | "python" | "react" | "nextjs";

const tabs: { id: TabType; label: string }[] = [
  { id: "playground", label: "🧪 Test API" },
  { id: "env", label: "Environment" },
  { id: "python", label: "Python" },
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
];

interface Snippet {
  title: string;
  description?: string;
  code: string;
  language: string;
}

// API Playground Component
function ApiPlayground({ apiKey }: { apiKey?: string }) {
  const { isMobile } = useBreakpoint();
  const [testApiKey, setTestApiKey] = useState(apiKey || "");
  const [query, setQuery] = useState("nasi lemak");
  const [endpoint, setEndpoint] = useState<"foods" | "halal">("foods");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const handleTest = async () => {
    if (!testApiKey.trim()) {
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://kalori-api.my";
    const url = endpoint === "halal" 
      ? `${baseUrl}/api/halal/search?q=${encodeURIComponent(query)}`
      : `${baseUrl}/api/foods/search?q=${encodeURIComponent(query)}`;

    try {
      const res = await fetch(url, {
        headers: {
          "X-API-Key": testApiKey,
        },
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
      setError(`Network error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* API Key Input */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
        <h3 className="font-medium text-content-primary mb-4 text-sm md:text-base">Test Your API Key</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-content-secondary mb-2">
              API Key
            </label>
            <input
              type="password"
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
              placeholder="kal_xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-dark-elevated border border-dark-border rounded-lg text-content-primary placeholder-content-muted focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-sm md:text-base font-mono"
            />
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-content-secondary mb-2">
              Endpoint
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setEndpoint("foods")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  endpoint === "foods"
                    ? "bg-accent text-dark"
                    : "bg-dark-elevated text-content-secondary border border-dark-border hover:border-accent/30"
                }`}
              >
                /api/foods/search
              </button>
              <button
                onClick={() => setEndpoint("halal")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  endpoint === "halal"
                    ? "bg-accent text-dark"
                    : "bg-dark-elevated text-content-secondary border border-dark-border hover:border-accent/30"
                }`}
              >
                /api/halal/search
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-content-secondary mb-2">
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., nasi lemak, roti canai, teh tarik..."
              className="w-full px-3 md:px-4 py-2 md:py-3 bg-dark-elevated border border-dark-border rounded-lg text-content-primary placeholder-content-muted focus:ring-2 focus:ring-accent/50 focus:border-accent/50 text-sm md:text-base"
            />
          </div>

          <button
            onClick={handleTest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-dark font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play size={isMobile ? 16 : 18} />
                Test API
              </>
            )}
          </button>
        </div>
      </div>

      {/* Response Section */}
      {(response || error) && (
        <div className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 bg-dark-elevated border-b border-dark-border">
            <div className="flex items-center gap-2">
              <span className="font-medium text-content-primary text-sm md:text-base">Response</span>
              {responseTime && (
                <span className="text-xs text-content-muted bg-dark px-2 py-0.5 rounded">
                  {responseTime}ms
                </span>
              )}
            </div>
            {error ? (
              <span className="flex items-center gap-1 text-red-400 text-xs md:text-sm">
                <AlertCircle size={14} /> Error
              </span>
            ) : (
              <span className="flex items-center gap-1 text-accent text-xs md:text-sm">
                <Check size={14} /> Success
              </span>
            )}
          </div>
          
          {error && (
            <div className="px-3 md:px-4 py-2 bg-red-500/10 border-b border-red-500/30">
              <p className="text-red-400 text-xs md:text-sm">{error}</p>
            </div>
          )}
          
          <pre className="p-3 md:p-4 overflow-x-auto text-xs md:text-sm max-h-96 overflow-y-auto">
            <code className="text-content-secondary">{response}</code>
          </pre>
        </div>
      )}

      {/* Tips */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
        <h4 className="font-medium text-content-primary mb-2 text-sm">💡 Tips</h4>
        <ul className="text-content-muted text-xs md:text-sm space-y-1">
          <li>• Your API key starts with <code className="bg-dark-elevated px-1 rounded">kal_</code></li>
          <li>• Try searching for: nasi lemak, roti canai, teh tarik, mee goreng</li>
          <li>• The halal endpoint returns JAKIM certified products only</li>
          <li>• Check the <a href="/api-docs" className="text-accent hover:underline">API docs</a> for all available endpoints</li>
        </ul>
      </div>
    </div>
  );
}

function SetupContent() {
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<TabType>("playground");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { data: apiKeys } = trpc.apiKeys.list.useQuery();
  
  const firstKeyPrefix = apiKeys?.[0]?.keyPrefix || "kal_xxxxxxxx";
  
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Environment setup snippets
  const envSnippets = [
    {
      title: "1. Create .env file",
      description: "Add your API key to environment variables for secure storage",
      code: `# .env or .env.local
KAL_API_KEY=your_api_key_here
KAL_API_URL=https://kalori-api.my`,
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

  // Python snippets
  const pythonSnippets = [
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
BASE_URL = os.getenv("KAL_API_URL", "https://kalori-api.my")`,
      language: "python",
    },
    {
      title: "3. Search for foods",
      code: `import requests

def search_foods(query: str):
    """Search for Malaysian foods by name."""
    response = requests.get(
        f"{BASE_URL}/api/foods/search",
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
        f"{BASE_URL}/api/halal/search",
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

  // React snippets
  const reactSnippets = [
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
  baseURL: process.env.REACT_APP_KAL_API_URL || 'https://kalori-api.my',
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
  const { data } = await kalApi.get('/api/foods/search', {
    params: { q: query },
  });
  return data.data;
};

export const searchHalalFoods = async (query: string): Promise<Food[]> => {
  const { data } = await kalApi.get('/api/halal/search', {
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

  // Next.js snippets
  const nextjsSnippets = [
    {
      title: "1. Environment setup",
      description: "Add to .env.local (client-side needs NEXT_PUBLIC_ prefix)",
      code: `# .env.local
KAL_API_KEY=your_api_key_here
KAL_API_URL=https://kalori-api.my

# For client-side usage (if needed)
NEXT_PUBLIC_KAL_API_URL=https://kalori-api.my`,
      language: "bash",
    },
    {
      title: "2. Create server-side API client",
      code: `// lib/kal-api.ts
const API_KEY = process.env.KAL_API_KEY;
const BASE_URL = process.env.KAL_API_URL || 'https://kalori-api.my';

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
    \`\${BASE_URL}/api/foods/search?q=\${encodeURIComponent(query)}\`,
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
    \`\${BASE_URL}/api/halal/search?q=\${encodeURIComponent(query)}\`,
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
      code: `// app/api/foods/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.KAL_API_KEY;
const BASE_URL = process.env.KAL_API_URL || 'https://kalori-api.my';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      \`\${BASE_URL}/api/foods/search?q=\${encodeURIComponent(query)}\`,
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
      case "env": return envSnippets;
      case "python": return pythonSnippets;
      case "react": return reactSnippets;
      case "nextjs": return nextjsSnippets;
      default: return [];
    }
  };

  const snippets = getSnippets();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1 md:mb-2 flex items-center gap-2">
          <Terminal size={isMobile ? 20 : 24} /> Setup Guide
        </h1>
        <p className="text-content-secondary text-sm md:text-base">Get started using the Kal API in your project</p>
      </div>

      {/* API Key Reminder */}
      <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 md:p-4 mb-6">
        <p className="text-accent text-xs md:text-sm">
          <strong>Your API Key:</strong> Make sure you have generated an API key from the{" "}
          <a href="/dashboard/api-keys" className="underline hover:no-underline">API Keys page</a>.
          {apiKeys && apiKeys.length > 0 && (
            <span className="block mt-1 text-content-secondary">
              You have {apiKeys.length} active key(s). Latest: <code className="bg-dark-elevated px-1.5 md:px-2 py-0.5 rounded text-xs">{firstKeyPrefix}...</code>
            </span>
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-3 md:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
              transition-colors
              ${activeTab === tab.id
                ? "bg-accent text-dark"
                : "bg-dark-surface border border-dark-border text-content-secondary hover:text-content-primary hover:border-accent/30"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "playground" ? (
        <ApiPlayground />
      ) : (
        <div className="space-y-4 md:space-y-6">
          {snippets.map((snippet, index) => (
            <div key={index} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
              <div className="flex items-start md:items-center justify-between px-3 md:px-4 py-2 md:py-3 bg-dark-elevated border-b border-dark-border gap-2">
                <div>
                  <h3 className="font-medium text-content-primary text-sm md:text-base">{snippet.title}</h3>
                  {"description" in snippet && snippet.description && (
                    <p className="text-content-muted text-xs mt-0.5">{snippet.description}</p>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(snippet.code, index)}
                  className="flex items-center gap-1 text-xs md:text-sm text-content-muted hover:text-content-primary transition-colors p-1 flex-shrink-0"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check size={isMobile ? 12 : 14} className="text-accent" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={isMobile ? 12 : 14} /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 md:p-4 overflow-x-auto text-xs md:text-sm">
                <code className={`language-${snippet.language} text-content-secondary`}>
                  {snippet.code}
                </code>
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Additional Resources */}
      <div className="mt-6 md:mt-8 bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
        <h3 className="font-medium text-content-primary mb-3 text-sm md:text-base">Need more help?</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <a 
            href="/api-docs" 
            className="text-accent hover:underline text-xs md:text-sm"
          >
            View API Documentation →
          </a>
          <a 
            href="https://github.com/Zen0space/Kal-Monorepo" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline text-xs md:text-sm"
          >
            GitHub Repository →
          </a>
        </div>
      </div>
    </div>
  );
}
