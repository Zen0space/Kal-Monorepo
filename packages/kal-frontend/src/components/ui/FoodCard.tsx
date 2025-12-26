"use client";

import { memo } from "react";
import { Check } from "react-feather";

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

interface FoodCardProps {
  food: Food | HalalFood;
  isSelected: boolean;
  onSelect: (food: Food | HalalFood) => void;
}

export const FoodCard = memo(function FoodCard({ food, isSelected, onSelect }: FoodCardProps) {
  const isHalalFood = "brand" in food;

  return (
    <button
      onClick={() => onSelect(food)}
      className={`group text-left p-0 rounded-2xl border transition-all duration-300
                  hover:-translate-y-1 hover:shadow-2xl overflow-hidden flex flex-col
                  ${
                    isSelected
                      ? isHalalFood
                        ? "bg-dark-elevated border-emerald-500/50 shadow-emerald-500/10"
                        : "bg-dark-elevated border-accent/50 shadow-accent/10"
                      : "bg-dark-surface/50 backdrop-blur-sm border-dark-border hover:border-accent/30 hover:shadow-accent/5"
                  }`}
    >
      {/* Card Content Top */}
      <div className="p-6 flex-grow w-full">
        <div className="flex justify-between items-start mb-4 gap-4">
          <div>
            <h3 className="text-xl font-bold text-content-primary leading-tight group-hover:text-accent transition-colors">
              {food.name}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {isHalalFood && (food as HalalFood).brand && (
                <span className="text-xs px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-medium">
                  {(food as HalalFood).brand}
                </span>
              )}
              {food.category && (
                <span className="text-xs px-2 py-1 bg-dark-elevated border border-dark-border text-content-secondary rounded-lg">
                  {food.category}
                </span>
              )}
            </div>
          </div>

          <span
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold border
              ${
                isHalalFood
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-accent/10 border-accent/20 text-accent"
              }`}
          >
            {food.calories} <span className="text-xs font-normal opacity-70">cal</span>
          </span>
        </div>

        {/* Additional Info */}
        <div className="space-y-1 mb-2">
          <p className="text-sm text-content-secondary flex items-center gap-2">
            <span className="opacity-50">Serving:</span>
            <span className="font-medium text-content-primary">{food.serving}</span>
          </p>

          {isHalalFood && (food as HalalFood).halalCertifier && (
            <p className="text-sm text-emerald-400/80 flex items-center gap-2">
              <Check size={12} />
              <span>
                {(food as HalalFood).halalCertifier}
                {(food as HalalFood).halalCertYear && ` (${(food as HalalFood).halalCertYear})`}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Macros Grid - Footer */}
      <div className="w-full bg-dark-elevated/50 border-t border-dark-border p-4 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center">
          <span className="text-xs text-blue-400 font-medium mb-1">Protein</span>
          <span className="text-lg font-bold text-content-primary">{food.protein}g</span>
        </div>
        <div className="flex flex-col items-center border-l border-dark-border">
          <span className="text-xs text-yellow-400 font-medium mb-1">Carbs</span>
          <span className="text-lg font-bold text-content-primary">{food.carbs}g</span>
        </div>
        <div className="flex flex-col items-center border-l border-dark-border">
          <span className="text-xs text-red-400 font-medium mb-1">Fat</span>
          <span className="text-lg font-bold text-content-primary">{food.fat}g</span>
        </div>
      </div>
    </button>
  );
});

// Skeleton component for loading state
export function FoodCardSkeleton() {
  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface/50 backdrop-blur-sm overflow-hidden animate-pulse">
      {/* Card Content Top */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="flex-1">
            {/* Title skeleton */}
            <div className="h-6 bg-dark-elevated rounded-lg w-3/4 mb-3" />
            {/* Tags skeleton */}
            <div className="flex gap-2">
              <div className="h-6 bg-dark-elevated rounded-lg w-16" />
              <div className="h-6 bg-dark-elevated rounded-lg w-14" />
            </div>
          </div>
          {/* Calories badge skeleton */}
          <div className="h-8 bg-dark-elevated rounded-lg w-16" />
        </div>

        {/* Serving skeleton */}
        <div className="h-4 bg-dark-elevated rounded w-1/3 mb-2" />
      </div>

      {/* Macros Grid - Footer Skeleton */}
      <div className="w-full bg-dark-elevated/30 border-t border-dark-border p-4 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="h-3 bg-dark-elevated rounded w-10" />
          <div className="h-6 bg-dark-elevated rounded w-8" />
        </div>
        <div className="flex flex-col items-center gap-1 border-l border-dark-border">
          <div className="h-3 bg-dark-elevated rounded w-10" />
          <div className="h-6 bg-dark-elevated rounded w-8" />
        </div>
        <div className="flex flex-col items-center gap-1 border-l border-dark-border">
          <div className="h-3 bg-dark-elevated rounded w-8" />
          <div className="h-6 bg-dark-elevated rounded w-8" />
        </div>
      </div>
    </div>
  );
}
