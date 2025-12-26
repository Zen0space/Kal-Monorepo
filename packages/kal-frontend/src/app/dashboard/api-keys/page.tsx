import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import ApiKeysClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "API Keys - Kal Dashboard",
  description: "Manage your API keys and view usage analytics",
};

export default async function ApiKeysPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <ApiKeysClient 
      logtoId={claims?.sub} 
      email={claims?.email}
      name={claims?.name || claims?.username}
    />
  );
}
