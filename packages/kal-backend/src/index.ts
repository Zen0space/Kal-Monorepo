import "dotenv/config";
import { handleAuthRoutes } from "@logto/express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import session from "express-session";

import { createContext } from "./lib/context.js";
import { connectDB } from "./lib/db.js";
import { logtoConfig, validateLogtoConfig } from "./lib/logto.js";
import { apiRouter } from "./routers/api.js";
import { appRouter } from "./routers/index.js";

const PORT = process.env.BACKEND_PORT || 3000;

// OpenAPI specification
const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Kal - Malaysian Food API",
    description: "Public REST API for accessing Malaysian food nutritional data. Search our database of 100+ Malaysian foods with accurate calorie, protein, carb, and fat information.",
    version: "1.0.0",
    contact: {
      name: "Kal API Support",
      url: "https://github.com/Zen0space/Kal-Monorepo",
    },
  },
  servers: [
    { url: "/api", description: "API Base Path" },
  ],
  paths: {
    "/foods/search": {
      get: {
        summary: "Search foods",
        description: "Search Malaysian foods by name. Returns up to 20 results.",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search query" },
        ],
        responses: {
          200: { description: "Successful response with matching foods" },
          400: { description: "Missing or invalid query parameter" },
        },
      },
    },
    "/foods": {
      get: {
        summary: "List foods",
        description: "Get all foods with optional category filter and pagination.",
        parameters: [
          { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Filter by category" },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 50, maximum: 200 }, description: "Max results" },
          { name: "offset", in: "query", required: false, schema: { type: "integer", default: 0 }, description: "Pagination offset" },
        ],
        responses: { 200: { description: "Paginated list of foods" } },
      },
    },
    "/foods/{id}": {
      get: {
        summary: "Get food by ID",
        description: "Get a single food item by its MongoDB ObjectId.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Food ID" },
        ],
        responses: {
          200: { description: "Food details" },
          404: { description: "Food not found" },
        },
      },
    },
    "/categories": {
      get: {
        summary: "List categories",
        description: "Get all available food categories.",
        responses: { 200: { description: "List of category names" } },
      },
    },
    "/stats": {
      get: {
        summary: "Database statistics",
        description: "Get total food count and category overview.",
        responses: { 200: { description: "Database statistics" } },
      },
    },
  },
};

async function main() {
  // Connect to MongoDB
  await connectDB();
  console.log("✅ Connected to MongoDB");

  const app = express();

  // Core middleware
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.FRONTEND_URL,
      ].filter((url): url is string => !!url),
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  // Session middleware (required for Logto)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
      cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 }, // 14 days
      resave: false,
      saveUninitialized: false,
    })
  );

  // Logto auth routes (if configured)
  if (validateLogtoConfig()) {
    app.use(handleAuthRoutes(logtoConfig));
    console.log("✅ Logto auth routes registered");
  }

  // Health check
  app.get("/health", (_, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // OpenAPI spec endpoint
  app.get("/openapi.json", (_, res) => {
    res.json(openApiSpec);
  });

  // API documentation page
  app.get("/docs", (_, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kal API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background: #0a0a0a; color: #e0e0e0; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    h1 { color: #22c55e; font-size: 2.5rem; margin-bottom: 10px; }
    .subtitle { color: #888; font-size: 1.1rem; margin-bottom: 40px; }
    .endpoint { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .method { display: inline-block; background: #22c55e; color: #000; font-weight: bold; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; margin-right: 10px; }
    .path { font-family: 'Monaco', 'Menlo', monospace; color: #fff; font-size: 1rem; }
    .desc { color: #888; margin: 10px 0; }
    .example { background: #0d0d0d; border: 1px solid #333; border-radius: 4px; padding: 15px; margin-top: 10px; font-family: monospace; font-size: 0.9rem; overflow-x: auto; }
    .example-label { color: #666; font-size: 0.8rem; margin-bottom: 5px; }
    a { color: #22c55e; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .section { margin-top: 40px; }
    h2 { color: #fff; margin-bottom: 20px; }
    .params { margin-top: 15px; }
    .param { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #222; }
    .param:last-child { border-bottom: none; }
    .param-name { font-family: monospace; color: #22c55e; min-width: 100px; }
    .param-type { color: #888; min-width: 80px; }
    .param-desc { color: #aaa; }
    .required { color: #ef4444; font-size: 0.75rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🥗 Kal API</h1>
    <p class="subtitle">Malaysian Food Nutritional Database API</p>
    
    <p>Access our database of 100+ Malaysian foods with accurate nutritional information. All endpoints are public and require no authentication.</p>
    
    <p style="margin-top: 20px;">
      <a href="/openapi.json">📄 OpenAPI Specification (JSON)</a>
    </p>

    <div class="section">
      <h2>Endpoints</h2>
      
      <div class="endpoint">
        <span class="method">GET</span>
        <span class="path">/api/foods/search</span>
        <p class="desc">Search foods by name. Returns up to 20 matching results.</p>
        <div class="params">
          <div class="param">
            <span class="param-name">q <span class="required">required</span></span>
            <span class="param-type">string</span>
            <span class="param-desc">Search query (e.g., "nasi", "mee")</span>
          </div>
        </div>
        <div class="example-label">Example:</div>
        <div class="example">curl "${getBaseUrl()}/api/foods/search?q=nasi"</div>
      </div>

      <div class="endpoint">
        <span class="method">GET</span>
        <span class="path">/api/foods</span>
        <p class="desc">List all foods with optional filtering and pagination.</p>
        <div class="params">
          <div class="param">
            <span class="param-name">category</span>
            <span class="param-type">string</span>
            <span class="param-desc">Filter by category (e.g., "Rice", "Noodles")</span>
          </div>
          <div class="param">
            <span class="param-name">limit</span>
            <span class="param-type">integer</span>
            <span class="param-desc">Max results (default: 50, max: 200)</span>
          </div>
          <div class="param">
            <span class="param-name">offset</span>
            <span class="param-type">integer</span>
            <span class="param-desc">Pagination offset (default: 0)</span>
          </div>
        </div>
        <div class="example-label">Example:</div>
        <div class="example">curl "${getBaseUrl()}/api/foods?category=Rice&limit=10"</div>
      </div>

      <div class="endpoint">
        <span class="method">GET</span>
        <span class="path">/api/foods/:id</span>
        <p class="desc">Get a single food item by ID.</p>
        <div class="example-label">Example:</div>
        <div class="example">curl "${getBaseUrl()}/api/foods/6789abc123def456..."</div>
      </div>

      <div class="endpoint">
        <span class="method">GET</span>
        <span class="path">/api/categories</span>
        <p class="desc">Get all available food categories.</p>
        <div class="example-label">Example:</div>
        <div class="example">curl "${getBaseUrl()}/api/categories"</div>
      </div>

      <div class="endpoint">
        <span class="method">GET</span>
        <span class="path">/api/stats</span>
        <p class="desc">Get database statistics.</p>
        <div class="example-label">Example:</div>
        <div class="example">curl "${getBaseUrl()}/api/stats"</div>
      </div>
    </div>

    <div class="section">
      <h2>Response Format</h2>
      <p>All endpoints return JSON with this structure:</p>
      <div class="example">
{
  "success": true,
  "data": [...],       // The response data
  "pagination": {...}  // For paginated endpoints
}
      </div>
    </div>
  </div>
</body>
</html>
    `);
  });

  // REST API routes
  app.use("/api", apiRouter);

  // tRPC
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`);
    console.log(`🌐 REST API: http://localhost:${PORT}/api`);
    console.log(`📚 API Docs: http://localhost:${PORT}/docs`);
  });
}

// Helper to get base URL for examples
function getBaseUrl() {
  return process.env.PUBLIC_URL || `http://localhost:${PORT}`;
}

main().catch(console.error);

