import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import PricingClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Pricing - Kalori API",
  description: "Choose the right plan for your application",
};

export default async function PricingPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <PricingClient
      logtoId={claims?.sub}
      email={claims?.email}
      name={claims?.name || claims?.username}
    />
  );
}
