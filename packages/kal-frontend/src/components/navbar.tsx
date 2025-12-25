import { getLogtoContext, signIn, signOut } from '@logto/next/server-actions';

import SignIn from '@/components/sign-in';
import SignOut from '@/components/sign-out';
import { getLogtoConfig } from '@/lib/logto';

export default async function Navbar() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

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
                await signOut(config);
              }}
            />
          </div>
        ) : (
          <SignIn
            onSignIn={async () => {
              'use server';
              await signIn(config);
            }}
          />
        )}
      </div>
    </nav>
  );
}
