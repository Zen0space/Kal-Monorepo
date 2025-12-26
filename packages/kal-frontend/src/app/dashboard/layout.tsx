import { getLogtoContext, signOut } from '@logto/next/server-actions';

import { DashboardLayout } from '@/components/dashboard/Sidebar';
import { getLogtoConfig } from '@/lib/logto';

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getLogtoConfig();
  const { isAuthenticated } = await getLogtoContext(config);

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-content-secondary mb-4">Please sign in to access the dashboard.</p>
          <a href="/" className="text-accent hover:underline">Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      onSignOut={async () => {
        'use server';
        await signOut(config);
      }}
    >
      {children}
    </DashboardLayout>
  );
}
