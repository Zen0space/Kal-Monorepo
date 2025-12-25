import { handleSignIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { logtoConfig } from "@/lib/logto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  try {
    await handleSignIn(logtoConfig, searchParams);
  } catch (error) {
    console.error("[Callback Error]", error);
    
    // In production, return a more helpful error page
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Authentication callback failed",
        message: errorMessage,
        hint: "Check that LOGTO_APP_SECRET, NEXT_PUBLIC_LOGTO_ENDPOINT, and SESSION_SECRET are correctly set in production.",
      },
      { status: 500 }
    );
  }

  // Redirect to login success page, which will then redirect to dashboard
  redirect("/login-success");
}
