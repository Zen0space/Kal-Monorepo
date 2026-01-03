import { ChatPage } from "./ChatPage";

import { getUser } from "@/lib/actions";

export default async function Home() {
  const context = await getUser();
  
  return (
    <ChatPage 
      isAuthenticated={context.isAuthenticated}
      user={context.claims ? {
        logtoId: context.claims.sub,
        name: context.claims.name ?? undefined,
        email: context.claims.email ?? undefined,
      } : null}
    />
  );
}
