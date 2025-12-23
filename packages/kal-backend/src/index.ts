import "dotenv/config";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./lib/context";
import { connectDB } from "./lib/db";

const PORT = process.env.BACKEND_PORT || 4000;

async function main() {
  // Connect to MongoDB
  await connectDB();
  console.log("✅ Connected to MongoDB");

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/health", (_, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

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
  });
}

main().catch(console.error);
