"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "react-feather";

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
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-elevated rounded w-48 mb-4" />
          <div className="h-4 bg-dark-elevated rounded w-32" />
        </div>
      </div>
    );
  }

  return <SetupContent />;
}

function SetupContent() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { data: apiKeys } = trpc.apiKeys.list.useQuery();
  
  const firstKeyPrefix = apiKeys?.[0]?.keyPrefix || "kal_xxxxxxxx";
  
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const codeSnippets = [
    {
      title: "1. Install the requests library",
      code: "pip install requests",
      language: "bash",
    },
    {
      title: "2. Search for foods",
      code: `import requests

API_KEY = "YOUR_API_KEY_HERE"  # Replace with your actual API key
BASE_URL = "https://kalori-api.my"

def search_foods(query):
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
      title: "3. Get food by category",
      code: `def get_foods_by_category(category, limit=10):
    """Get foods filtered by category."""
    response = requests.get(
        f"{BASE_URL}/api/foods",
        params={"category": category, "limit": limit},
        headers={"X-API-Key": API_KEY}
    )
    return response.json()

# Get rice dishes
rice_dishes = get_foods_by_category("Rice", limit=5)
for food in rice_dishes.get("data", []):
    print(f"{food['name']}: {food['protein']}g protein")`,
      language: "python",
    },
    {
      title: "4. Search halal certified foods",
      code: `def search_halal_foods(query):
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

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary mb-2 flex items-center gap-2">
          <Terminal size={24} /> Python Setup Guide
        </h1>
        <p className="text-content-secondary">Get started using the Kal API with Python in minutes</p>
      </div>

      {/* API Key Reminder */}
      <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-8">
        <p className="text-accent text-sm">
          <strong>Your API Key:</strong> Make sure you have generated an API key from the{" "}
          <a href="/dashboard/api-keys" className="underline hover:no-underline">API Keys page</a>.
          {apiKeys && apiKeys.length > 0 && (
            <span className="block mt-1 text-content-secondary">
              You have {apiKeys.length} active key(s). Latest: <code className="bg-dark-elevated px-2 py-0.5 rounded">{firstKeyPrefix}...</code>
            </span>
          )}
        </p>
      </div>

      {/* Code Snippets */}
      <div className="space-y-6">
        {codeSnippets.map((snippet, index) => (
          <div key={index} className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-dark-elevated border-b border-dark-border">
              <h3 className="font-medium text-content-primary">{snippet.title}</h3>
              <button
                onClick={() => copyToClipboard(snippet.code, index)}
                className="flex items-center gap-1 text-sm text-content-muted hover:text-content-primary transition-colors"
              >
                {copiedIndex === index ? (
                  <>
                    <Check size={14} className="text-accent" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm">
              <code className={`language-${snippet.language} text-content-secondary`}>
                {snippet.code}
              </code>
            </pre>
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="mt-8 bg-dark-surface border border-dark-border rounded-xl p-6">
        <h3 className="font-medium text-content-primary mb-3">Need more help?</h3>
        <div className="flex gap-4">
          <a 
            href="/api-docs" 
            className="text-accent hover:underline text-sm"
          >
            View API Documentation →
          </a>
          <a 
            href="https://github.com/Zen0space/Kal-Monorepo" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline text-sm"
          >
            GitHub Repository →
          </a>
        </div>
      </div>
    </div>
  );
}
