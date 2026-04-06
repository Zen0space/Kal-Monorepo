import fs from "fs";
import path from "path";

import { getLogtoContext } from "@logto/next/server-actions";
import { redirect } from "next/navigation";

import ChangelogClient from "./client";

import { getLogtoConfig } from "@/lib/logto";

export const metadata = {
  title: "Changelog - Kal Dashboard",
  description: "See what's new in Kal",
};

export interface ChangelogEntry {
  version: string;
  date: string;
  categories: {
    name: string;
    items: string[];
  }[];
}

/**
 * Parses a Keep-a-Changelog-style markdown string into structured data.
 *
 * Expected format per release:
 *   ## [version] - YYYY-MM-DD
 *   ### Category
 *   - item
 */
function parseChangelog(raw: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let current: ChangelogEntry | null = null;
  let currentCategory: { name: string; items: string[] } | null = null;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();

    // Match version heading: ## [1.0.1] - 2026-04-06
    const versionMatch = trimmed.match(
      /^##\s+\[([^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/
    );
    if (versionMatch) {
      if (current) {
        if (currentCategory) current.categories.push(currentCategory);
        entries.push(current);
      }
      current = {
        version: versionMatch[1],
        date: versionMatch[2],
        categories: [],
      };
      currentCategory = null;
      continue;
    }

    // Match category heading: ### Added / ### Fixed / ### Changed
    const categoryMatch = trimmed.match(/^###\s+(.+)/);
    if (categoryMatch && current) {
      if (currentCategory) current.categories.push(currentCategory);
      currentCategory = { name: categoryMatch[1], items: [] };
      continue;
    }

    // Match list item: - Some change description
    const itemMatch = trimmed.match(/^-\s+(.+)/);
    if (itemMatch && currentCategory) {
      currentCategory.items.push(itemMatch[1]);
    }
  }

  // Push last pending entries
  if (current) {
    if (currentCategory) current.categories.push(currentCategory);
    entries.push(current);
  }

  return entries;
}

export default async function ChangelogPage() {
  const config = getLogtoConfig();
  const { isAuthenticated } = await getLogtoContext(config);

  if (!isAuthenticated) {
    redirect("/");
  }

  const changelogPath = path.resolve(process.cwd(), "../../docs/changelog.md");
  let raw = "";

  try {
    raw = fs.readFileSync(changelogPath, "utf-8");
  } catch {
    raw = "";
  }

  const entries = parseChangelog(raw);

  return <ChangelogClient entries={entries} />;
}
