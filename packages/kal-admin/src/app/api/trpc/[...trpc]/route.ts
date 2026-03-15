import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

async function handler(req: NextRequest) {
  // Extract the tRPC path from the URL
  const url = new URL(req.url);
  const trpcPath = url.pathname.replace("/api/trpc", "");
  const targetUrl = `${BACKEND_URL}/trpc${trpcPath}${url.search}`;

  // Forward the request to kal-backend, injecting the admin secret
  const headers = new Headers(req.headers);
  headers.set("x-admin-secret", ADMIN_SECRET);
  // Remove host header so it doesn't confuse the backend
  headers.delete("host");

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const responseHeaders = new Headers(response.headers);
  // Remove encoding headers to avoid double-encoding
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export { handler as GET, handler as POST };
