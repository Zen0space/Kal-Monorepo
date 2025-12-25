import { getLogtoContext, signIn, signOut } from '@logto/next/server-actions';

import SignIn from '@/components/sign-in';
import SignOut from '@/components/sign-out';
import { logtoConfig } from '@/lib/logto';

export default async function Navbar() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <a href="/">Kal</a>
      </div>
      <div className="nav-auth">
        {isAuthenticated ? (
          <div className="user-info">
            <a href="/dashboard" className="dashboard-link">Dashboard</a>
            <span className="user-email">{claims?.email || claims?.sub}</span>
            <SignOut
              onSignOut={async () => {
                'use server';
                await signOut(logtoConfig);
              }}
            />
          </div>
        ) : (
          <SignIn
            onSignIn={async () => {
              'use server';
              await signIn(logtoConfig);
            }}
          />
        )}
      </div>
    </nav>
  );
}
