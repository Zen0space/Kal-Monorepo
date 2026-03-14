import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import LogsClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Request Logs - Kal Dashboard",
  description: "View your recent API calls, errors, and response times",
};

export default async function LogsPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <LogsClient
      logtoId={claims?.sub}
      email={claims?.email}
      name={claims?.name || claims?.username}
    />
  );
}
