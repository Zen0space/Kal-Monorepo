"use client";

import Link from "next/link";
import { useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  X,
} from "react-feather";

import { AuthUpdater, useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

// ─── Category grouping ────────────────────────────────────────────────────────
// Maps a friendly food-type label → the raw DB category values that belong to it.
// Cuisine-origin categories (American, French, Korean, etc.) are folded into
// "World Cuisine" so the dropdown stays food-type focused.
const CATEGORY_GROUPS: Record<string, string[]> = {
  "Rice & Grains": ["Rice", "Grains", "Cereals"],
  Noodles: ["Noodles", "Instant Noodles"],
  "Bread & Bakery": ["Roti", "Bakery", "Basics"],
  "Meat & Protein": ["Meat", "Proteins"],
  Seafood: ["Seafood"],
  Vegetables: ["Vegetables"],
  Fruits: ["Fruits"],
  "Legumes & Nuts": ["Legumes", "Nuts", "Seeds"],
  Dairy: ["Dairy"],
  Drinks: ["Drinks", "Beverages"],
  Breakfast: ["Breakfast"],
  Snacks: ["Snacks", "Kuih"],
  Desserts: ["Desserts", "Ice Cream"],
  Soups: ["Soups"],
  Condiments: ["Condiments", "Cooking"],
  "Fast Food": ["Fast Food", "Ready Meals", "Frozen"],
  "World Cuisine": [
    "American",
    "Chinese",
    "French",
    "Greek",
    "Indian",
    "Italian",
    "Japanese",
    "Korean",
    "Mexican",
    "Middle Eastern",
    "Spanish",
    "Thai",
    "Vietnamese",
    "Western",
    "Healthy",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a compact page-number array with ellipsis for large page counts. */
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

interface FoodsClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

export default function FoodsClient({
  logtoId,
  email,
  name,
}: FoodsClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <FoodsContentWrapper expectedLogtoId={logtoId} />
    </>
  );
}

function FoodsContentWrapper({
  expectedLogtoId,
}: {
  expectedLogtoId?: string;
}) {
  const { logtoId } = useAuth();

  if (expectedLogtoId && logtoId !== expectedLogtoId) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/[0.04] rounded-xl w-48 mb-4" />
          <div className="h-4 bg-white/[0.04] rounded w-32" />
        </div>
      </div>
    );
  }

  return <FoodsContent />;
}

const PAGE_SIZE = 20;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy ID"}
      className="ml-1.5 flex-shrink-0 text-content-muted hover:text-accent transition-colors"
    >
      {copied ? (
        <Check size={12} className="text-accent" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}

function FoodsContent() {
  const [cursor, setCursor] = useState(0);
  // selectedGroup is the friendly label key from CATEGORY_GROUPS, or undefined for "All"
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(
    undefined
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCursor(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const handleClearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setCursor(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  const handleGroupChange = (group: string) => {
    setSelectedGroup(group === "all" ? undefined : group);
    setCursor(0);
  };

  // Expand the selected group into its raw DB category values
  const rawCategories = selectedGroup
    ? CATEGORY_GROUPS[selectedGroup]
    : undefined;

  const { data, isLoading } = trpc.food.allCombined.useQuery({
    cursor,
    limit: PAGE_SIZE,
    categories: rawCategories,
    search: debouncedSearch || undefined,
  });

  const handlePrev = () => setCursor((prev) => Math.max(0, prev - PAGE_SIZE));
  const handleNext = () => {
    if (data?.nextCursor !== null && data?.nextCursor !== undefined) {
      setCursor(data.nextCursor);
    }
  };

  const currentPage = Math.floor(cursor / PAGE_SIZE) + 1;
  const totalPages = data?.total ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Mobile back button */}
      <Link
        href="/dashboard/setup"
        className="inline-flex items-center gap-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors mb-4 md:hidden"
      >
        <ArrowLeft size={16} />
        <span>Setup</span>
      </Link>

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1 md:mb-2">
          Food Database
        </h1>
        <p className="text-content-secondary text-sm md:text-base">
          Browse all foods in the Malaysian nutrition database
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 md:mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search foods..."
            className="w-full pl-9 pr-8 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-content-primary placeholder-content-muted text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent/20 transition-all duration-200"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Food-type group filter */}
        <select
          value={selectedGroup ?? "all"}
          onChange={(e) => handleGroupChange(e.target.value)}
          className="px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-content-primary text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent/20 transition-all duration-200"
        >
          <option value="all">All types</option>
          {Object.keys(CATEGORY_GROUPS).map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        {/* Total count */}
        {data && (
          <span className="text-content-muted text-sm sm:ml-auto whitespace-nowrap">
            {data.total.toLocaleString()} foods
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden mb-4">
        {/* Desktop header */}
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_80px_80px_80px_80px_minmax(0,1fr)_72px] gap-4 px-6 py-3 bg-white/[0.04] text-xs font-medium text-content-muted uppercase tracking-wider">
          <span>Name</span>
          <span>ID</span>
          <span>Calories</span>
          <span>Protein</span>
          <span>Carbs</span>
          <span>Fat</span>
          <span>Category</span>
          <span>Halal</span>
        </div>

        {isLoading ? (
          <div className="p-8 md:p-12">
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-white/[0.04] rounded" />
              ))}
            </div>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <p className="text-content-secondary text-sm">No foods found.</p>
          </div>
        ) : (
          data?.items.map((food) => (
            <div key={food._id}>
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_80px_80px_80px_80px_minmax(0,1fr)_72px] gap-4 px-6 py-3 border-t border-white/[0.06] items-center hover:bg-white/[0.03] transition-colors">
                <span
                  className="font-medium text-content-primary truncate"
                  title={food.name}
                >
                  {food.name}
                </span>
                <div className="flex items-center min-w-0">
                  <code className="text-content-muted text-xs bg-white/[0.06] px-2 py-1 rounded font-mono truncate">
                    {food._id}
                  </code>
                  <CopyButton text={food._id} />
                </div>
                <span className="text-content-secondary text-sm">
                  {food.calories} kcal
                </span>
                <span className="text-content-secondary text-sm">
                  {food.protein ?? "—"}g
                </span>
                <span className="text-content-secondary text-sm">
                  {food.carbs ?? "—"}g
                </span>
                <span className="text-content-secondary text-sm">
                  {food.fat ?? "—"}g
                </span>
                <span
                  className="text-content-muted text-xs truncate"
                  title={food.category ?? undefined}
                >
                  {food.category ?? "—"}
                </span>
                <span>
                  {food.isHalal && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                      Halal
                    </span>
                  )}
                </span>
              </div>

              {/* Mobile card */}
              <div className="md:hidden p-4 border-t border-white/[0.06]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-content-primary text-sm leading-snug">
                    {food.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {food.isHalal && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                        Halal
                      </span>
                    )}
                    {food.category && (
                      <span className="text-[10px] text-content-muted bg-white/[0.06] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {food.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <code className="text-content-muted text-[10px] bg-white/[0.06] px-2 py-1 rounded font-mono truncate min-w-0">
                    {food._id}
                  </code>
                  <CopyButton text={food._id} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-content-secondary">
                  <span>
                    Calories:{" "}
                    <strong className="text-content-primary">
                      {food.calories} kcal
                    </strong>
                  </span>
                  <span>
                    Protein:{" "}
                    <strong className="text-content-primary">
                      {food.protein ?? "—"}g
                    </strong>
                  </span>
                  <span>
                    Carbs:{" "}
                    <strong className="text-content-primary">
                      {food.carbs ?? "—"}g
                    </strong>
                  </span>
                  <span>
                    Fat:{" "}
                    <strong className="text-content-primary">
                      {food.fat ?? "—"}g
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {/* Previous */}
          <button
            onClick={handlePrev}
            disabled={cursor === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-content-secondary hover:text-content-primary hover:border-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page numbers */}
          {getPageNumbers(currentPage, totalPages).map((page, i) =>
            page === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="px-1.5 py-1.5 text-content-muted text-sm select-none"
              >
                &hellip;
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setCursor(((page as number) - 1) * PAGE_SIZE)}
                className={`min-w-[36px] px-2.5 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                  page === currentPage
                    ? "bg-accent/15 border-accent/40 text-accent"
                    : "bg-white/[0.02] border-white/[0.06] text-content-secondary hover:text-content-primary hover:border-white/[0.1]"
                }`}
              >
                {page}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={data.nextCursor === null || data.nextCursor === undefined}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-content-secondary hover:text-content-primary hover:border-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
