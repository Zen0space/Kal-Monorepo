import { handleSignIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getLogtoConfig } from "@/lib/logto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get config at request time to ensure runtime env vars are read
  const config = getLogtoConfig();
  
  // Log config for debugging (safe info only)
  console.info("[Callback] Config check:", {
    endpoint: config.endpoint,
    appId: config.appId,
    baseUrl: config.baseUrl,
    hasAppSecret: !!config.appSecret,
    appSecretLength: config.appSecret?.length || 0,
    hasCookieSecret: !!config.cookieSecret,
    cookieSecretLength: config.cookieSecret?.length || 0,
    cookieSecure: config.cookieSecure,
  });
  
  try {
    await handleSignIn(config, searchParams);
  } catch (error) {
    console.error("[Callback Error]", error);
    
    // In production, return a more helpful error page
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorName = error instanceof Error ? error.name : "Unknown";
    const secret = config.appSecret || '';
    
    return NextResponse.json(
      { 
        error: "Authentication callback failed",
        message: errorMessage,
        errorType: errorName,
        hint: "Check that LOGTO_APP_SECRET, NEXT_PUBLIC_LOGTO_ENDPOINT, and SESSION_SECRET are correctly set in production.",
        debug: {
          endpoint: config.endpoint,
          appId: config.appId,
          baseUrl: config.baseUrl,
          hasAppSecret: !!config.appSecret,
          appSecretLength: secret.length,
          // Show first and last char of secret to verify it's correct (safe - not full secret)
          appSecretHint: secret.length > 2 ? `${secret[0]}...${secret[secret.length - 1]}` : 'too short',
          hasCookieSecret: !!config.cookieSecret,
          cookieSecretLength: config.cookieSecret?.length || 0,
          cookieSecure: config.cookieSecure,
          // Show callback params for debugging
          callbackParams: {
            hasCode: !!searchParams.get('code'),
            hasState: !!searchParams.get('state'),
            hasIss: !!searchParams.get('iss'),
            issuer: searchParams.get('iss'),
          },
        },
      },
      { status: 500 }
    );
  }

  // Redirect to login success page, which will then redirect to dashboard
  redirect("/login-success");
}
