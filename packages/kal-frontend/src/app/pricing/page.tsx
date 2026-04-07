import { signIn } from "@logto/next/server-actions";
import { getLogtoContext } from "@logto/next/server-actions";

import PricingClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Pricing - Kalori API",
  description: "Choose the right plan for your application",
};

export default async function PricingPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  const onSignIn = async () => {
    "use server";
    const cfg = getLogtoConfig();
    await signIn(cfg);
  };

  return (
    <PricingClient
      isAuthenticated={isAuthenticated}
      logtoId={isAuthenticated ? claims?.sub : undefined}
      email={isAuthenticated ? claims?.email : undefined}
      name={isAuthenticated ? claims?.name || claims?.username : undefined}
      onSignIn={onSignIn}
    />
  );
}
