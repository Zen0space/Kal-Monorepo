import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import DocsClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "API Reference - Kal Dashboard",
  description:
    "Complete API reference: authentication, rate limits, error codes, and code examples",
};

export default async function DocsPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <DocsClient
      logtoId={claims?.sub}
      email={claims?.email}
      name={claims?.name || claims?.username}
    />
  );
}
