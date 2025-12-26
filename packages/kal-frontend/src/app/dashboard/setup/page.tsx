import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import SetupClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Setup Guide - Kal Dashboard",
  description: "Get started with the Kal API",
};

export default async function SetupPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  if (!isAuthenticated) {
    redirect("/");
  }

  return <SetupClient logtoId={claims?.sub} />;
}
