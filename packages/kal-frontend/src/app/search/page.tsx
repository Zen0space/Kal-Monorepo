"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

interface Food {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  category?: string;
}

export default function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce effect - trigger search after 1.5s of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 1500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Handle Enter key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setSearchQuery(inputValue);
      }
    },
    [inputValue]
  );

  // Get categories
  const { data: categories } = trpc.food.categories.useQuery();

  // Search query (when searching)
  const { data: searchResults, isLoading: isSearching } =
    trpc.food.search.useQuery(
      { query: searchQuery },
      { enabled: searchQuery.length > 0 }
    );

  // Infinite query for browsing (when not searching)
  const {
    data: paginatedData,
    isLoading: isPaginating,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.food.allPaginated.useInfiniteQuery(
    { limit: 10, category: selectedCategory || undefined },
    {
      enabled: searchQuery.length === 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: 0,
    }
  );

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || searchQuery.length > 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

  // Determine which data to show
  const isSearchMode = searchQuery.length > 0;
  const isLoading = isSearchMode ? isSearching : isPaginating;

  const foods: Food[] = isSearchMode
    ? searchResults || []
    : paginatedData?.pages.flatMap((page) => page.items) || [];

  const totalCount = isSearchMode
    ? searchResults?.length || 0
    : paginatedData?.pages[0]?.total || 0;

  return (
    <main className="min-h-screen bg-dark">
      {/* Header */}
      <header className="border-b border-dark-border">
        <div className="container mx-auto px-4 py-4 max-w-4xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-3 h-3 rounded-full bg-accent group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-content-primary">Kal</span>
          </Link>
        </div>
      </header>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-content-primary mb-3">
            Search Foods
          </h1>
          <p className="text-content-secondary">
            Find nutritional information for any food
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-content-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search foods... (press Enter or wait to search)"
            className="w-full pl-12 pr-4 py-4 rounded-xl bg-dark-surface border border-dark-border 
                       text-content-primary placeholder-content-muted 
                       focus:ring-2 focus:ring-accent/50 focus:border-accent/50
                       transition-all duration-200"
          />
          {/* Loading indicator when typing */}
          {inputValue !== searchQuery && inputValue.length > 0 && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Category Filter (only when not searching) */}
        {!isSearchMode && categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                ${
                  selectedCategory === ""
                    ? "bg-accent text-dark"
                    : "bg-dark-surface text-content-secondary border border-dark-border hover:border-accent/30"
                }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${
                    selectedCategory === cat
                      ? "bg-accent text-dark"
                      : "bg-dark-surface text-content-secondary border border-dark-border hover:border-accent/30"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {!isLoading && foods.length > 0 && (
          <p className="text-center text-content-muted text-sm mb-6">
            {isSearchMode
              ? `Found ${foods.length} result${foods.length !== 1 ? "s" : ""}`
              : `Showing ${foods.length} of ${totalCount} foods`}
          </p>
        )}

        {/* Results */}
        {isLoading && foods.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-dark-surface rounded-xl p-6 animate-pulse border border-dark-border"
              >
                <div className="h-6 bg-dark-elevated rounded w-3/4 mb-3" />
                <div className="h-4 bg-dark-elevated rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : foods.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foods.map((food) => (
                <button
                  key={food._id}
                  onClick={() =>
                    setSelectedFood(
                      selectedFood?._id === food._id ? null : food
                    )
                  }
                  className={`text-left p-6 rounded-xl border transition-all duration-200 
                             hover:scale-[1.01] 
                             ${
                               selectedFood?._id === food._id
                                 ? "bg-dark-elevated border-accent/50"
                                 : "bg-dark-surface border-dark-border hover:border-accent/30"
                             }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-content-primary">
                        {food.name}
                      </h3>
                      {food.category && (
                        <span className="text-xs text-content-muted">
                          {food.category}
                        </span>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                      {food.calories} cal
                    </span>
                  </div>
                  <p className="text-content-secondary text-sm mb-3">
                    Serving: {food.serving}
                  </p>

                  {/* Macro breakdown */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-content-secondary">
                        P: {food.protein}g
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-content-secondary">
                        C: {food.carbs}g
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-content-secondary">
                        F: {food.fat}g
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Load more trigger (only for pagination mode) */}
            {!isSearchMode && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2 text-content-muted">
                    <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    Loading more...
                  </div>
                ) : hasNextPage ? (
                  <p className="text-content-muted text-sm">
                    Scroll for more
                  </p>
                ) : foods.length > 0 ? (
                  <p className="text-content-muted text-sm">
                    You&apos;ve seen all {totalCount} foods
                  </p>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-content-secondary">
              {searchQuery
                ? `No foods found for "${searchQuery}"`
                : "No food data"}
            </p>
          </div>
        )}

        {/* Selected Food Detail Modal */}
        {selectedFood && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
            <div className="bg-dark-elevated border border-dark-border rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-content-primary">
                    {selectedFood.name}
                  </h3>
                  {selectedFood.category && (
                    <span className="text-xs text-content-muted">
                      {selectedFood.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-content-muted hover:text-content-primary transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-accent/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-accent">
                    {selectedFood.calories}
                  </p>
                  <p className="text-xs text-content-muted">Calories</p>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-blue-400">
                    {selectedFood.protein}g
                  </p>
                  <p className="text-xs text-content-muted">Protein</p>
                </div>
                <div className="bg-yellow-500/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-yellow-400">
                    {selectedFood.carbs}g
                  </p>
                  <p className="text-xs text-content-muted">Carbs</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-red-400">
                    {selectedFood.fat}g
                  </p>
                  <p className="text-xs text-content-muted">Fat</p>
                </div>
              </div>
              <p className="text-content-muted text-sm text-center mt-4">
                Per {selectedFood.serving}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
