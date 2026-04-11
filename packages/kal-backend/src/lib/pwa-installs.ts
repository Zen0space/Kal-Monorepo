import type { Db } from "mongodb";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PwaInstallDoc {
  userId: string | null;
  platform: "ios" | "android" | "desktop" | "unknown";
  browser: string;
  userAgent: string;
  screenResolution: string;
  displayMode: string;
  fingerprint: string;
  installedAt: Date;
  updatedAt: Date;
}

// ─── Collection Helper ───────────────────────────────────────────────────────

const COLLECTION = "pwa_installs";

export function getPwaInstallsCollection(db: Db) {
  return db.collection<PwaInstallDoc>(COLLECTION);
}
