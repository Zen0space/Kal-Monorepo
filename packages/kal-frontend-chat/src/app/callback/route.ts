import { handleSignIn } from "@logto/next/server-actions";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getLogtoConfig } from "@/lib/logto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const config = getLogtoConfig();
  
  try {
    await handleSignIn(config, searchParams);
  } catch (error) {
    console.error("[Callback Error]", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }

  redirect("/");
}
