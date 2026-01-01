import { getUser } from "@/lib/actions";
import { ChatPage } from "./ChatPage";

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
