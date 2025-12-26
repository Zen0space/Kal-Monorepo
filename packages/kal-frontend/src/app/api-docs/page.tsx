import { getLogtoContext, signIn, signOut } from '@logto/next/server-actions';

import APIDocsClient from './client';

import { getLogtoConfig } from '@/lib/logto';

export default async function APIDocsPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);
  
  return (
    <APIDocsClient 
      isAuthenticated={isAuthenticated}
      userEmail={claims?.email || claims?.sub}
      onSignIn={async () => {
        'use server';
        await signIn(config);
      }}
      onSignOut={async () => {
        'use server';
        await signOut(config);
      }}
    />
  );
}
