import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import FeedbackClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Feedback - Kal Dashboard",
  description: "Share your feedback or report issues",
};

export default async function FeedbackPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <FeedbackClient 
      logtoId={claims?.sub} 
      email={claims?.email}
      name={claims?.name || claims?.username}
    />
  );
}
