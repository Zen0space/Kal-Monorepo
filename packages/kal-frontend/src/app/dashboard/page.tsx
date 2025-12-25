import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import DashboardClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Dashboard - Kal API",
  description: "Manage your API keys and view usage statistics",
};

export default async function DashboardPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Dashboard</h1>
            <p className="user-greeting">
              Welcome back, {claims?.name || claims?.username || claims?.email || "Developer"}
            </p>
          </div>
          <a href="/" className="back-link">
            ← Back to Home
          </a>
        </header>

        <DashboardClient 
          logtoId={claims?.sub} 
          email={claims?.email}
          name={claims?.name || claims?.username}
        />
      </div>
    </main>
  );
}

