import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import LoginSuccessClient from "./client";

import { logtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Login Successful - Kal",
  description: "You have successfully logged in",
};

export default async function LoginSuccessPage() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig);

  // If not authenticated, redirect to home
  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <LoginSuccessClient
      userName={claims?.name || claims?.email || "Developer"}
    />
  );
}
