import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return proxyRequest(req, params.path);
}

export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return proxyRequest(req, params.path);
}

async function proxyRequest(req: NextRequest, path: string[]) {
  try {
    // 1. Validate Session (Must be logged in to Admin Panel)
    // Note: We await cookies() in newer Next.js versions if needed, but cookies().get is synchronous in some, async in others.
    // Next.js 15+ cookies() is async.
    const cookieStore = await cookies();
    const hasSession = cookieStore.get("admin_session");

    if (!hasSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Prepare Proxy to Backend
    // Construct target URL (e.g., http://localhost:4000/trpc/user.list?batch=...)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const trpcPath = path.join("/");
    const searchParams = req.nextUrl.search; // ?batch=1&...
    const targetUrl = `${backendUrl}/trpc/${trpcPath}${searchParams}`;

    // 3. Prepare Headers
    const headers = new Headers(req.headers);
    
    // Inject Secret (Server-to-Server)
    const adminSecret = process.env.ADMIN_SECRET;
    if (adminSecret) {
      headers.set("x-admin-secret", adminSecret);
    }
    
    // Remove host to avoid confusion
    headers.delete("host");

    // 4. Forward Request
    const body = req.method === "POST" ? await req.blob() : null;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      // Important: typically tRPC backend is on same network, so no cert issues.
    });

    // 5. Return Response
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
