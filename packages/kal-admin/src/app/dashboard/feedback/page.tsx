"use client";

import { format } from "date-fns";
import { useState } from "react";

import { trpc } from "@/lib/trpc";

type BugStatus = "open" | "in_progress" | "resolved" | "closed" | "wont_fix";
type BugStatusFilter = "all" | BugStatus;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={star <= rating ? "#f59e0b" : "none"}
          stroke={star <= rating ? "#f59e0b" : "#475569"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "primary",
}: {
  label: string;
  value: string | number;
  color?: "primary" | "success" | "warning" | "info";
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary-light bg-primary/10 border-primary/15",
    success:
      "text-status-success bg-status-success/10 border-status-success/15",
    warning:
      "text-status-warning bg-status-warning/10 border-status-warning/15",
    info: "text-status-info bg-status-info/10 border-status-info/15",
  };

  return (
    <div className="bg-admin-surface border border-admin-border rounded-xl p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[color]}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div>
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function ReviewsTab() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: reviewsData, isLoading } = trpc.feedback.getAllReviews.useQuery(
    { limit, offset: page * limit }
  );
  const { data: stats } = trpc.feedback.getStats.useQuery();

  const totalPages = reviewsData ? Math.ceil(reviewsData.total / limit) : 0;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Total Reviews"
          value={stats?.totalReviews ?? 0}
          color="primary"
        />
        <StatCard
          label="Average Rating"
          value={stats?.avgRating ? stats.avgRating.toFixed(1) : "—"}
          color="warning"
        />
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-admin-elevated rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : reviewsData?.reviews.length === 0 ? (
          <div className="p-12 text-center text-text-muted">No reviews yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-text-muted uppercase tracking-wide border-b border-admin-border">
                  <th className="pb-3 pl-4">User</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Feedback</th>
                  <th className="pb-3 pr-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border-subtle">
                {reviewsData?.reviews.map((review) => (
                  <tr
                    key={review._id}
                    className="hover:bg-admin-elevated/50 transition-colors"
                  >
                    <td className="py-3 pl-4">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {review.userName || "Unknown"}
                        </p>
                        <p className="text-xs text-text-muted">
                          {review.userEmail || "No email"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">
                      <StarRating rating={review.rating} />
                    </td>
                    <td className="py-3 max-w-md">
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {review.feedback}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-text-muted">
                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-admin-border bg-admin-elevated text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={
              !reviewsData?.reviews.length || reviewsData.reviews.length < limit
            }
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-admin-border bg-admin-elevated text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function BugsTab() {
  const [statusFilter, setStatusFilter] = useState<BugStatusFilter>("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  const {
    data: bugsData,
    isLoading,
    refetch,
  } = trpc.feedback.getAllBugs.useQuery({
    limit,
    offset: page * limit,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const { data: stats } = trpc.feedback.getStats.useQuery();

  const updateStatus = trpc.feedback.updateBugStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const handleStatusChange = (bugId: string, newStatus: BugStatus) => {
    updateStatus.mutate({ bugId, status: newStatus });
  };

  const totalPages = bugsData ? Math.ceil(bugsData.total / limit) : 0;

  const statusOptions: BugStatus[] = [
    "open",
    "in_progress",
    "resolved",
    "closed",
    "wont_fix",
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Bugs"
          value={stats?.totalBugs ?? 0}
          color="primary"
        />
        <StatCard label="Open" value={stats?.openBugs ?? 0} color="warning" />
        <StatCard
          label="Resolved"
          value={(stats?.totalBugs ?? 0) - (stats?.openBugs ?? 0)}
          color="success"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {(
          [
            "all",
            "open",
            "in_progress",
            "resolved",
            "closed",
            "wont_fix",
          ] as BugStatusFilter[]
        ).map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === status
                ? "bg-primary/10 text-primary-light border border-primary/20"
                : "text-text-secondary hover:text-text-primary hover:bg-admin-elevated border border-transparent"
            }`}
          >
            {status === "all"
              ? "All"
              : status === "in_progress"
                ? "In Progress"
                : status === "wont_fix"
                  ? "Won't Fix"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-admin-surface border border-admin-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-admin-elevated rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : bugsData?.bugs.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            No bug reports found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-text-muted uppercase tracking-wide border-b border-admin-border">
                  <th className="pb-3 pl-4">Title</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3 pr-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border-subtle">
                {bugsData?.bugs.map((bug) => (
                  <tr
                    key={bug._id}
                    className="hover:bg-admin-elevated/50 transition-colors"
                  >
                    <td className="py-3 pl-4">
                      <p className="text-sm font-medium text-text-primary max-w-xs truncate">
                        {bug.title}
                      </p>
                    </td>
                    <td className="py-3 max-w-sm">
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {bug.description}
                      </p>
                      {bug.stepsToReproduce && (
                        <p className="text-xs text-text-muted mt-1">
                          Steps: {bug.stepsToReproduce.slice(0, 100)}...
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      <select
                        value={bug.status}
                        onChange={(e) =>
                          handleStatusChange(
                            bug._id,
                            e.target.value as BugStatus
                          )
                        }
                        disabled={updateStatus.isPending}
                        className="bg-admin-elevated border border-admin-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt === "in_progress"
                              ? "In Progress"
                              : opt === "wont_fix"
                                ? "Won't Fix"
                                : opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <p className="text-xs text-text-muted">
                        {bug.userName || bug.userEmail || "Unknown"}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-sm text-text-muted">
                        {format(new Date(bug.createdAt), "MMM d, yyyy")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-admin-border bg-admin-elevated text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!bugsData?.bugs.length || bugsData.bugs.length < limit}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-admin-border bg-admin-elevated text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function FeedbackPage() {
  const [tab, setTab] = useState<"reviews" | "bugs">("reviews");

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">
          Feedback & Bugs
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Manage user reviews and bug reports
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-admin-border">
        <button
          onClick={() => setTab("reviews")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "reviews"
              ? "border-primary text-primary-light"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Reviews
        </button>
        <button
          onClick={() => setTab("bugs")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "bugs"
              ? "border-primary text-primary-light"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Bugs
        </button>
      </div>

      {/* Content */}
      {tab === "reviews" ? <ReviewsTab /> : <BugsTab />}
    </div>
  );
}
