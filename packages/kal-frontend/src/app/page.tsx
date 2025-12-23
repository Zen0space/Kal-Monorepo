"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface Food {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  // Get all foods or search
  const { data: foods, isLoading } = searchQuery
    ? trpc.food.search.useQuery({ query: searchQuery }, { enabled: searchQuery.length > 0 })
    : trpc.food.all.useQuery();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10" />
        <div className="container mx-auto px-4 py-12 max-w-4xl relative">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
              🥗 Kal
            </h1>
            <p className="text-slate-400 text-lg">
              Search foods and view calorie information
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search foods... (e.g. chicken, rice, eggs)"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800/50 border border-slate-700 
                         text-white placeholder-slate-500 
                         focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
                         backdrop-blur-sm transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 pb-12 max-w-4xl">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : foods && foods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {foods.map((food) => (
              <button
                key={food._id}
                onClick={() => setSelectedFood(selectedFood?._id === food._id ? null : food)}
                className={`text-left p-6 rounded-2xl border transition-all duration-300 
                           hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10
                           ${selectedFood?._id === food._id 
                             ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500/50" 
                             : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                           }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-white">{food.name}</h3>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                    {food.calories} cal
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-3">Serving: {food.serving}</p>
                
                {/* Macro breakdown */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-400">P: {food.protein}g</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-slate-400">C: {food.carbs}g</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-slate-400">F: {food.fat}g</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-slate-400">
              {searchQuery ? `No foods found for "${searchQuery}"` : "No food data"}
            </p>
          </div>
        )}

        {/* Selected Food Detail Modal */}
        {selectedFood && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">{selectedFood.name}</h3>
                <button 
                  onClick={() => setSelectedFood(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-emerald-500/20 rounded-xl p-3">
                  <p className="text-2xl font-bold text-emerald-400">{selectedFood.calories}</p>
                  <p className="text-xs text-slate-400">Calories</p>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-3">
                  <p className="text-2xl font-bold text-blue-400">{selectedFood.protein}g</p>
                  <p className="text-xs text-slate-400">Protein</p>
                </div>
                <div className="bg-yellow-500/20 rounded-xl p-3">
                  <p className="text-2xl font-bold text-yellow-400">{selectedFood.carbs}g</p>
                  <p className="text-xs text-slate-400">Carbs</p>
                </div>
                <div className="bg-red-500/20 rounded-xl p-3">
                  <p className="text-2xl font-bold text-red-400">{selectedFood.fat}g</p>
                  <p className="text-xs text-slate-400">Fat</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm text-center mt-4">
                Per {selectedFood.serving}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
