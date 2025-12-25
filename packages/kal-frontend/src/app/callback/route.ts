import { handleSignIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getLogtoConfig } from "@/lib/logto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get config at request time to ensure runtime env vars are read
  const config = getLogtoConfig();
  
  try {
    await handleSignIn(config, searchParams);
  } catch (error) {
    console.error("[Callback Error]", error);
    
    // In production, return a more helpful error page
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const secret = config.appSecret || '';
    
    return NextResponse.json(
      { 
        error: "Authentication callback failed",
        message: errorMessage,
        hint: "Check that LOGTO_APP_SECRET, NEXT_PUBLIC_LOGTO_ENDPOINT, and SESSION_SECRET are correctly set in production.",
        debug: {
          endpoint: config.endpoint,
          appId: config.appId,
          baseUrl: config.baseUrl,
          hasAppSecret: !!config.appSecret,
          appSecretLength: secret.length,
          // Show first and last char of secret to verify it's correct (safe - not full secret)
          appSecretHint: secret.length > 2 ? `${secret[0]}...${secret[secret.length - 1]}` : 'too short',
        },
      },
      { status: 500 }
    );
  }

  // Redirect to login success page, which will then redirect to dashboard
  redirect("/login-success");
}
