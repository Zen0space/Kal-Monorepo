import { getLogtoContext, signIn } from '@logto/next/server-actions';

import APIDocsClient from './client';

import { getLogtoConfig } from '@/lib/logto';

export default async function APIDocsPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);
  
  // Prefer name/username from claims, fallback to email
  const userName = claims?.name || claims?.username || claims?.email || claims?.sub;
  
  return (
    <APIDocsClient 
      isAuthenticated={isAuthenticated}
      userName={userName}
      onSignIn={async () => {
        'use server';
        await signIn(config);
      }}
    />
  );
}
