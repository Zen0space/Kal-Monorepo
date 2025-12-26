"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { Check, Search, X } from "react-feather";

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

interface HalalFood extends Food {
  brand?: string;
  halalCertifier?: string;
  halalCertYear?: number;
}

type TabType = "natural" | "halal";

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<TabType>("natural");
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | HalalFood | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce effect - trigger search after 1.5s of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 1500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Reset filters when switching tabs
  useEffect(() => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedFood(null);
  }, [activeTab]);

  // Handle Enter key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setSearchQuery(inputValue);
      }
    },
    [inputValue]
  );

  // ============================================
  // Natural Foods Queries
  // ============================================
  const { data: naturalCategories } = trpc.food.categories.useQuery(undefined, {
    enabled: activeTab === "natural",
  });

  const { data: searchResults, isLoading: isSearching } =
    trpc.food.search.useQuery(
      { query: searchQuery },
      { enabled: searchQuery.length > 0 && activeTab === "natural" }
    );

  const {
    data: paginatedData,
    isLoading: isPaginating,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.food.allPaginated.useInfiniteQuery(
    { limit: 10, category: selectedCategory || undefined },
    {
      enabled: searchQuery.length === 0 && activeTab === "natural",
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: 0,
    }
  );

  // ============================================
  // Halal Foods Queries
  // ============================================
  const { data: halalBrands } = trpc.halal.brands.useQuery(undefined, {
    enabled: activeTab === "halal",
  });

  const { data: halalSearchResults, isLoading: isHalalSearching } =
    trpc.halal.search.useQuery(
      { query: searchQuery },
      { enabled: searchQuery.length > 0 && activeTab === "halal" }
    );

  const {
    data: halalPaginatedData,
    isLoading: isHalalPaginating,
    fetchNextPage: fetchNextHalalPage,
    hasNextPage: hasNextHalalPage,
    isFetchingNextPage: isFetchingNextHalalPage,
  } = trpc.halal.allPaginated.useInfiniteQuery(
    { limit: 10, brand: selectedBrand || undefined },
    {
      enabled: searchQuery.length === 0 && activeTab === "halal",
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: 0,
    }
  );

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || searchQuery.length > 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "natural" && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          } else if (activeTab === "halal" && hasNextHalalPage && !isFetchingNextHalalPage) {
            fetchNextHalalPage();
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [
    activeTab,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    hasNextHalalPage,
    isFetchingNextHalalPage,
    fetchNextHalalPage,
    searchQuery,
  ]);

  // Determine which data to show based on active tab
  const isSearchMode = searchQuery.length > 0;
  const isLoading = activeTab === "natural"
    ? (isSearchMode ? isSearching : isPaginating)
    : (isSearchMode ? isHalalSearching : isHalalPaginating);

  const foods: (Food | HalalFood)[] = activeTab === "natural"
    ? (isSearchMode
        ? searchResults || []
        : paginatedData?.pages.flatMap((page) => page.items) || [])
    : (isSearchMode
        ? halalSearchResults || []
        : halalPaginatedData?.pages.flatMap((page) => page.items) || []);

  const totalCount = activeTab === "natural"
    ? (isSearchMode
        ? searchResults?.length || 0
        : paginatedData?.pages[0]?.total || 0)
    : (isSearchMode
        ? halalSearchResults?.length || 0
        : halalPaginatedData?.pages[0]?.total || 0);

  const currentHasNextPage = activeTab === "natural" ? hasNextPage : hasNextHalalPage;
  const currentIsFetchingNextPage = activeTab === "natural" ? isFetchingNextPage : isFetchingNextHalalPage;

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

        {/* Tab Switcher */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab("natural")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200
              ${activeTab === "natural"
                ? "bg-accent text-dark shadow-lg shadow-accent/20"
                : "bg-dark-surface text-content-secondary border border-dark-border hover:border-accent/30"
              }`}
          >
            Natural Foods
          </button>
          <button
            onClick={() => setActiveTab("halal")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200
              ${activeTab === "halal"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-dark-surface text-content-secondary border border-dark-border hover:border-emerald-500/30"
              }`}
          >
            Halal Certified
          </button>
        </div>

        {/* Halal Tab Info Banner */}
        {activeTab === "halal" && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 text-center">
            <p className="text-emerald-400 text-sm flex items-center justify-center gap-2">
              <Check size={14} /> All items are <strong>JAKIM certified halal</strong> with verified brand information
            </p>
          </div>
        )}

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
            placeholder={activeTab === "natural" 
              ? "Search Malaysian foods..." 
              : "Search halal foods by name or brand..."}
            className={`w-full pl-12 pr-4 py-4 rounded-xl bg-dark-surface border 
                       text-content-primary placeholder-content-muted transition-all duration-200
                       ${activeTab === "halal" 
                         ? "border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                         : "border-dark-border focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                       }`}
          />
          {/* Loading indicator when typing */}
          {inputValue !== searchQuery && inputValue.length > 0 && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              <div className={`w-4 h-4 border-2 rounded-full animate-spin
                ${activeTab === "halal" 
                  ? "border-emerald-500/30 border-t-emerald-500" 
                  : "border-accent/30 border-t-accent"}`} 
              />
            </div>
          )}
        </div>

        {/* Category Filter (Natural Foods) */}
        {activeTab === "natural" && !isSearchMode && naturalCategories && naturalCategories.length > 0 && (
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
            {naturalCategories.map((cat) => (
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

        {/* Brand Filter (Halal Foods) */}
        {activeTab === "halal" && !isSearchMode && halalBrands && halalBrands.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => setSelectedBrand("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                ${
                  selectedBrand === ""
                    ? "bg-emerald-500 text-white"
                    : "bg-dark-surface text-content-secondary border border-dark-border hover:border-emerald-500/30"
                }`}
            >
              All Brands
            </button>
            {halalBrands.map((brand) => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${
                    selectedBrand === brand
                      ? "bg-emerald-500 text-white"
                      : "bg-dark-surface text-content-secondary border border-dark-border hover:border-emerald-500/30"
                  }`}
              >
                {brand}
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
              {foods.map((food) => {
                const isHalalFood = "brand" in food;
                return (
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
                                   ? isHalalFood
                                     ? "bg-dark-elevated border-emerald-500/50"
                                     : "bg-dark-elevated border-accent/50"
                                   : "bg-dark-surface border-dark-border hover:border-accent/30"
                               }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-content-primary">
                          {food.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {isHalalFood && (food as HalalFood).brand && (
                            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                              {(food as HalalFood).brand}
                            </span>
                          )}
                          {food.category && (
                            <span className="text-xs text-content-muted">
                              {food.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${isHalalFood 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : "bg-accent/10 text-accent"}`}>
                        {food.calories} cal
                      </span>
                    </div>

                    {/* Halal certification badge */}
                    {isHalalFood && (food as HalalFood).halalCertifier && (
                      <div className="flex items-center gap-1.5 mb-3 text-xs text-emerald-400">
                        <span>
                          {(food as HalalFood).halalCertifier} Certified
                          {(food as HalalFood).halalCertYear && ` (${(food as HalalFood).halalCertYear})`}
                        </span>
                      </div>
                    )}

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
                );
              })}
            </div>

            {/* Load more trigger (only for pagination mode) */}
            {!isSearchMode && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {currentIsFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2 text-content-muted">
                    <div className={`w-4 h-4 border-2 rounded-full animate-spin
                      ${activeTab === "halal" 
                        ? "border-emerald-500/30 border-t-emerald-500" 
                        : "border-accent/30 border-t-accent"}`} 
                    />
                    Loading more...
                  </div>
                ) : currentHasNextPage ? (
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
            <div className="text-6xl mb-4"><Search size={64} className="mx-auto text-content-muted" /></div>
            <p className="text-content-secondary">
              {searchQuery
                ? `No foods found for "${searchQuery}"`
                : activeTab === "halal"
                  ? "No halal certified foods available"
                  : "No food data"}
            </p>
          </div>
        )}

        {/* Selected Food Detail Modal */}
        {selectedFood && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
            <div className={`bg-dark-elevated border rounded-2xl p-6 shadow-2xl
              ${"brand" in selectedFood 
                ? "border-emerald-500/30" 
                : "border-dark-border"}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-content-primary">
                    {selectedFood.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {"brand" in selectedFood && (selectedFood as HalalFood).brand && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                        {(selectedFood as HalalFood).brand}
                      </span>
                    )}
                    {selectedFood.category && (
                      <span className="text-xs text-content-muted">
                        {selectedFood.category}
                      </span>
                    )}
                  </div>
                    {"brand" in selectedFood && (selectedFood as HalalFood).halalCertifier && (
                    <p className="text-xs text-emerald-400 mt-2">
                      {(selectedFood as HalalFood).halalCertifier} Certified
                      {(selectedFood as HalalFood).halalCertYear && ` (${(selectedFood as HalalFood).halalCertYear})`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-content-muted hover:text-content-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className={`rounded-xl p-3 ${"brand" in selectedFood ? "bg-emerald-500/10" : "bg-accent/10"}`}>
                  <p className={`text-2xl font-bold ${"brand" in selectedFood ? "text-emerald-400" : "text-accent"}`}>
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
