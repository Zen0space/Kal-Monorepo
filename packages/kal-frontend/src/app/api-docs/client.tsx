"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, FileText, Heart, Lock, Menu, Star, X } from "react-feather";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

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
  section: "natural" | "halal" | "general";
}

const endpoints: EndpointExample[] = [
  // Natural Foods
  {
    id: "search",
    method: "GET",
    path: "/api/foods/search",
    description: "Search natural Malaysian foods by name. Returns up to 20 matching results.",
    params: [
      { name: "q", type: "string", required: true, description: "Search query (e.g., 'nasi', 'mee')" },
    ],
    example: '/api/foods/search?q=nasi',
    section: "natural",
  },
  {
    id: "list",
    method: "GET",
    path: "/api/foods",
    description: "List all natural foods with optional filtering and pagination.",
    params: [
      { name: "category", type: "string", required: false, description: "Filter by category (e.g., 'Rice', 'Noodles')" },
      { name: "limit", type: "integer", required: false, description: "Max results (default: 50, max: 200)" },
      { name: "offset", type: "integer", required: false, description: "Pagination offset (default: 0)" },
    ],
    example: '/api/foods?category=Rice&limit=5',
    section: "natural",
  },
  {
    id: "single",
    method: "GET",
    path: "/api/foods/:id",
    description: "Get a single natural food item by its ID.",
    params: [
      { name: "id", type: "string", required: true, description: "Food ID (MongoDB ObjectId)" },
    ],
    example: '/api/foods/694bf52dcf55787e6332e9c0',
    section: "natural",
  },
  {
    id: "categories",
    method: "GET",
    path: "/api/categories",
    description: "Get all available food categories for natural foods.",
    example: '/api/categories',
    section: "natural",
  },
  // Halal Foods
  {
    id: "halal-search",
    method: "GET",
    path: "/api/halal/search",
    description: "Search JAKIM certified halal foods by name. Returns up to 20 matching results.",
    params: [
      { name: "q", type: "string", required: true, description: "Search query (e.g., 'ramly', 'burger')" },
    ],
    example: '/api/halal/search?q=ramly',
    section: "halal",
  },
  {
    id: "halal-list",
    method: "GET",
    path: "/api/halal",
    description: "List all halal certified foods with optional filtering by brand.",
    params: [
      { name: "brand", type: "string", required: false, description: "Filter by brand (e.g., 'Ramly')" },
      { name: "category", type: "string", required: false, description: "Filter by category (e.g., 'Fast Food')" },
      { name: "limit", type: "integer", required: false, description: "Max results (default: 50, max: 200)" },
      { name: "offset", type: "integer", required: false, description: "Pagination offset (default: 0)" },
    ],
    example: '/api/halal?brand=Ramly',
    section: "halal",
  },
  {
    id: "halal-brands",
    method: "GET",
    path: "/api/halal/brands",
    description: "Get all available halal food brands.",
    example: '/api/halal/brands',
    section: "halal",
  },
  {
    id: "halal-single",
    method: "GET",
    path: "/api/halal/:id",
    description: "Get a single halal food item by its ID.",
    params: [
      { name: "id", type: "string", required: true, description: "Food ID (MongoDB ObjectId)" },
    ],
    example: '/api/halal/694bf52dcf55787e6332e9c1',
    section: "halal",
  },
  // General
  {
    id: "stats",
    method: "GET",
    path: "/api/stats",
    description: "Get database statistics including total foods, categories, and brands.",
    example: '/api/stats',
    section: "general",
  },
];

// cURL example type
interface CurlExample {
  comment: string;
  command: string;
  type: "natural" | "halal";
}

interface APIDocsClientProps {
  isAuthenticated: boolean;
  userEmail?: string;
  curlExamples: CurlExample[];
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
  { label: "API", href: "/api-docs" },
];

export default function APIDocsClient({ isAuthenticated, userEmail, curlExamples, onSignIn, onSignOut }: APIDocsClientProps) {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const renderEndpoint = (endpoint: EndpointExample, accentColor: string) => (
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
          <span className={`px-2.5 py-1 ${accentColor} text-black text-xs font-bold rounded`}>
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
                        <td className={`px-3 py-2 font-mono ${endpoint.section === 'halal' ? 'text-emerald-400' : 'text-[#10b981]'}`}>{param.name}</td>
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
                className={`px-4 py-2 ${accentColor} text-black font-semibold rounded-lg hover:opacity-80 transition-colors disabled:opacity-50`}
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
  );

  // cURL example component - secure: command is empty for unauthenticated users
  const CurlExampleCard = ({ example }: { example: CurlExample }) => {
    const borderColor = example.type === "halal" ? "border-emerald-500/30" : "border-[#262626]";
    const commentColor = example.type === "halal" ? "text-emerald-400" : "text-[#10b981]";
    const hasCommand = example.command && example.command.length > 0;

    if (hasCommand) {
      // Authenticated - show full command
      return (
        <div className={`bg-[#141414] border ${borderColor} rounded-lg px-4 py-3`}>
          <p className={`${commentColor} text-sm mb-2`}>{example.comment}</p>
          <code className="text-[#a3a3a3] font-mono text-sm">
            {example.command}
          </code>
        </div>
      );
    }

    // Not authenticated - show locked state (command is empty from server)
    return (
      <div className={`bg-[#141414] border ${borderColor} rounded-lg px-4 py-3 relative min-h-[72px]`}>
        <p className={`${commentColor} text-sm mb-2`}>{example.comment}</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-5 bg-[#262626] rounded animate-pulse" />
          <button
            onClick={() => onSignIn()}
            className="px-4 py-2 bg-[#10b981] text-black font-semibold rounded-lg hover:bg-[#0d9668] transition-colors flex items-center gap-2 text-sm"
          >
            <Lock size={14} />
            Sign in to view
          </button>
        </div>
      </div>
    );
  };

  const naturalEndpoints = endpoints.filter(e => e.section === "natural");
  const halalEndpoints = endpoints.filter(e => e.section === "halal");
  const generalEndpoints = endpoints.filter(e => e.section === "general");

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navbar (same style as landing page) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-md border-b border-dark-border">
        <Container>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-3 h-3 rounded-full bg-accent group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold text-content-primary">Kal</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-content-secondary hover:text-content-primary transition-colors text-sm"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <span className="text-content-secondary text-sm">{userEmail}</span>
                  <button
                    onClick={() => onSignOut()}
                    className="px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Button onClick={() => onSignIn()} size="sm">
                  Sign In →
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-content-secondary hover:text-content-primary"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-dark-border">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-content-secondary hover:text-content-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4">
                {isAuthenticated ? (
                  <button
                    onClick={() => onSignOut()}
                    className="w-full py-2 text-content-secondary hover:text-content-primary transition-colors text-left"
                  >
                    Sign Out ({userEmail})
                  </button>
                ) : (
                  <Button onClick={() => onSignIn()} className="w-full">
                    Sign In →
                  </Button>
                )}
              </div>
            </div>
          )}
        </Container>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Intro */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#10b981]">Malaysian Food API</h2>
          <p className="text-[#a3a3a3] text-lg mb-6">
            Access our database of 100+ Malaysian foods with accurate nutritional information.
            Now featuring <span className="text-emerald-400 font-medium">halal certified foods</span> with JAKIM verification.
            All endpoints are public and require no authentication.
          </p>
          
          <div className="flex gap-4 flex-wrap">
            <a 
              href="/openapi.json" 
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-[#10b981] transition-colors"
            >
              <FileText size={16} /> OpenAPI Spec
            </a>
            <a 
              href="https://github.com/Zen0space/Kal-Monorepo" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:border-[#10b981] transition-colors"
            >
              <Star size={16} /> GitHub
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

        {/* Natural Foods Endpoints */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-xl font-semibold">Natural Foods</h3>
            <span className="text-sm text-[#a3a3a3]">Street food & traditional Malaysian dishes</span>
          </div>
          <div className="space-y-4">
            {naturalEndpoints.map((endpoint) => renderEndpoint(endpoint, "bg-[#10b981]"))}
          </div>
        </section>

        {/* Halal Foods Endpoints */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold text-emerald-400">Halal Certified Foods</h3>
            <span className="text-sm text-emerald-400/70">JAKIM certified brands</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
            <p className="text-emerald-400 text-sm flex items-center gap-2">
              <Check size={14} /> All items include brand name, halal certifier (JAKIM), and certification year
            </p>
          </div>
          <div className="space-y-4">
            {halalEndpoints.map((endpoint) => renderEndpoint(endpoint, "bg-emerald-500"))}
          </div>
        </section>

        {/* General Endpoints */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-6">General</h3>
          <div className="space-y-4">
            {generalEndpoints.map((endpoint) => renderEndpoint(endpoint, "bg-[#10b981]"))}
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

        {/* Food Objects */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Food Objects</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Natural Food */}
            <div>
              <h4 className="text-lg font-medium mb-3 text-[#10b981]">Natural Food</h4>
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
            </div>

            {/* Halal Food */}
            <div>
              <h4 className="text-lg font-medium mb-3 text-emerald-400">Halal Certified Food</h4>
              <pre className="bg-[#141414] border border-emerald-500/30 rounded-lg px-4 py-4 font-mono text-sm overflow-x-auto">
{`{
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
              </pre>
            </div>
          </div>
        </section>

        {/* cURL Examples - with blur for unauthenticated users */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">cURL Examples</h3>
            {!isAuthenticated && (
              <span className="text-sm text-[#a3a3a3] flex items-center gap-1">
                <Lock size={12} /> Sign in to view full examples
              </span>
            )}
          </div>
          <div className="space-y-4">
            {curlExamples.map((example, index) => (
              <CurlExampleCard key={index} example={example} />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#262626] mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-[#525252]">
          <p className="flex items-center gap-1">Made with <Heart size={12} className="text-red-400" /> in Malaysia</p>
          <Link href="/" className="hover:text-[#10b981] transition-colors">← Back to Kal</Link>
        </div>
      </footer>
    </main>
  );
}
