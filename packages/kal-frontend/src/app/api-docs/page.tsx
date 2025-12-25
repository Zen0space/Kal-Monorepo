import { getLogtoContext, signIn, signOut } from '@logto/next/server-actions';

import APIDocsClient from './client';

import { logtoConfig } from '@/lib/logto';

// cURL examples - only sent to client when authenticated
const curlExamples = [
  {
    comment: "# Search for nasi dishes",
    command: 'curl "https://kalori-api.my/api/foods/search?q=nasi"',
    type: "natural" as const,
  },
  {
    comment: "# Get all rice dishes",
    command: 'curl "https://kalori-api.my/api/foods?category=Rice"',
    type: "natural" as const,
  },
  {
    comment: "# Search halal foods",
    command: 'curl "https://kalori-api.my/api/halal/search?q=ramly"',
    type: "halal" as const,
  },
  {
    comment: "# Get all Ramly brand items",
    command: 'curl "https://kalori-api.my/api/halal?brand=Ramly"',
    type: "halal" as const,
  },
  {
    comment: "# Get database stats",
    command: 'curl "https://kalori-api.my/api/stats"',
    type: "natural" as const,
  },
];

export default async function APIDocsPage() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);
  
  // Only pass curl examples when user is authenticated
  // This prevents users from viewing the data via DevTools inspect
  const safeCurlExamples = isAuthenticated 
    ? curlExamples 
    : curlExamples.map(ex => ({ ...ex, command: '' })); // Empty command for unauthenticated
  
  return (
    <APIDocsClient 
      isAuthenticated={isAuthenticated}
      userEmail={claims?.email || claims?.sub}
      curlExamples={safeCurlExamples}
      onSignIn={async () => {
        'use server';
        await signIn(logtoConfig);
      }}
      onSignOut={async () => {
        'use server';
        await signOut(logtoConfig);
      }}
    />
  );
}
