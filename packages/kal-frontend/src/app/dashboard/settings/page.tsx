import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import SettingsClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Settings - Kal Dashboard",
  description: "Manage your account settings",
};

export default async function SettingsPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <SettingsClient 
      logtoId={claims?.sub} 
      email={claims?.email}
      name={claims?.name || claims?.username}
    />
  );
}
