import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import FoodsClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Food List - Kal Dashboard",
  description: "Browse the Malaysian food nutrition database",
};

export default async function FoodsPage() {
  const config = getLogtoConfig();
  const { isAuthenticated, claims } = await getLogtoContext(config);

  if (!isAuthenticated) {
    redirect("/");
  }

  return (
    <FoodsClient
      logtoId={claims?.sub}
      email={claims?.email}
      name={claims?.name || claims?.username}
    />
  );
}
