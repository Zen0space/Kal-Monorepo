"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  Send,
  Star,
  ThumbsUp
} from "react-feather";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import { AuthUpdater } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";

interface FeedbackClientProps {
  logtoId?: string;
  email?: string | null;
  name?: string | null;
}

type FeedbackType = "review" | "report" | null;

export default function FeedbackClient({ logtoId, email, name }: FeedbackClientProps) {
  return (
    <>
      <AuthUpdater logtoId={logtoId} email={email} name={name} />
      <FeedbackContent />
    </>
  );
}

function FeedbackContent() {
  const { isMobile } = useBreakpoint();
  const [selectedType, setSelectedType] = useState<FeedbackType>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugSteps, setBugSteps] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Query for user's bug reports
  const utils = trpc.useUtils();
  const { data: myBugs, isLoading: bugsLoading } = trpc.feedback.getMyBugs.useQuery(
    undefined,
    { enabled: selectedType === "report" }
  );

  // tRPC mutations
  const submitReviewMutation = trpc.feedback.submitReview.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to submit review. Please try again.");
    },
  });

  const submitBugMutation = trpc.feedback.submitBug.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setErrorMessage(null);
      // Invalidate the bugs query to refresh the list
      utils.feedback.getMyBugs.invalidate();
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to submit bug report. Please try again.");
    },
  });

  const isSubmitting = submitReviewMutation.isPending || submitBugMutation.isPending;

  const handleSubmitReview = () => {
    if (rating === 0 || !feedback.trim()) return;
    setErrorMessage(null);
    submitReviewMutation.mutate({ rating, feedback: feedback.trim() });
  };

  const handleSubmitBug = () => {
    if (!bugTitle.trim() || !bugDescription.trim()) return;
    setErrorMessage(null);
    submitBugMutation.mutate({
      title: bugTitle.trim(),
      description: bugDescription.trim(),
      stepsToReproduce: bugSteps.trim() || undefined,
    });
  };

  const handleBack = () => {
    setSelectedType(null);
    setRating(0);
    setFeedback("");
    setBugTitle("");
    setBugDescription("");
    setBugSteps("");
    setIsSubmitted(false);
    setErrorMessage(null);
    submitReviewMutation.reset();
    submitBugMutation.reset();
  };

  if (isSubmitted) {
    return (
      <div className="p-4 md:p-6 lg:p-8 w-full max-w-3xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-content-primary mb-2">Thank You!</h2>
          <p className="text-content-secondary mb-8 max-w-md">
            {selectedType === "review"
              ? "Your feedback has been submitted. We appreciate you taking the time to share your thoughts!"
              : "Your bug report has been submitted. Our team will investigate and get back to you if needed."
            }
          </p>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/80 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 lg:p-8 w-full ${selectedType === "report" ? "max-w-5xl" : "max-w-3xl"}`}>
      <div className="mb-6 md:mb-8">
        {selectedType && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-content-secondary hover:text-content-primary mb-4 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Back to options</span>
          </button>
        )}
        <h1 className="text-xl md:text-2xl font-bold text-content-primary mb-1 md:mb-2">
          {selectedType === "review"
            ? "Share Your Feedback"
            : selectedType === "report"
              ? "Report a Bug"
              : "Feedback"}
        </h1>
        <p className="text-content-secondary text-sm md:text-base">
          {selectedType === "review"
            ? "Let us know how we're doing and how we can improve"
            : selectedType === "report"
              ? "Help us fix issues by providing detailed information"
              : "Help us improve Kal by sharing your thoughts or reporting issues"}
        </p>
      </div>

      {!selectedType ? (
        // Option Selection
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Review Card */}
          <button
            onClick={() => setSelectedType("review")}
            className="group bg-dark-surface border border-dark-border rounded-xl p-6 md:p-8 text-left hover:border-accent/50 hover:bg-dark-elevated transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ThumbsUp size={28} className="text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-content-primary mb-2">
              Write a Review
            </h3>
            <p className="text-content-secondary text-sm">
              Share your experience and help us understand what you love about Kal
            </p>
            <div className="flex items-center gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
          </button>

          {/* Report Card */}
          <button
            onClick={() => setSelectedType("report")}
            className="group bg-dark-surface border border-dark-border rounded-xl p-6 md:p-8 text-left hover:border-red-500/50 hover:bg-dark-elevated transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-content-primary mb-2">
              Report a Bug
            </h3>
            <p className="text-content-secondary text-sm">
              Found something broken? Let us know so we can fix it quickly
            </p>
            <div className="flex items-center gap-2 mt-4 text-red-400 text-sm">
              <MessageSquare size={14} />
              <span>Submit a ticket</span>
            </div>
          </button>
        </div>
      ) : selectedType === "review" ? (
        // Review Form
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-content-muted mb-3">
              How would you rate your experience?
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star
                    size={isMobile ? 28 : 32}
                    className={`transition-colors ${star <= (hoveredRating || rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-dark-border"
                      }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-content-secondary text-sm">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Great"}
                  {rating === 5 && "Excellent!"}
                </span>
              )}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-content-muted mb-2">
              Tell us more about your experience
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What do you like? What could be better? Any suggestions?"
              className="w-full h-32 md:h-40 px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-content-primary placeholder-content-muted resize-none focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmitReview}
            disabled={rating === 0 || !feedback.trim() || isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Review
              </>
            )}
          </button>
        </div>
      ) : (
        // Bug Report Form with sidebar
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Bug Report Form */}
          <div className="flex-1 bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
            {/* Bug Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-content-muted mb-2">
                Bug Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={bugTitle}
                onChange={(e) => setBugTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-content-primary placeholder-content-muted focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
              />
            </div>

            {/* Bug Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-content-muted mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                placeholder="What happened? What did you expect to happen?"
                className="w-full h-24 md:h-32 px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-content-primary placeholder-content-muted resize-none focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
              />
            </div>

            {/* Steps to Reproduce */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-content-muted mb-2">
                Steps to Reproduce <span className="text-content-muted">(optional)</span>
              </label>
              <textarea
                value={bugSteps}
                onChange={(e) => setBugSteps(e.target.value)}
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                className="w-full h-24 md:h-32 px-4 py-3 bg-dark-elevated border border-dark-border rounded-lg text-content-primary placeholder-content-muted resize-none focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
              />
            </div>

            {/* Info Box */}
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Tip:</strong> Include as much detail as possible. Browser, device, and exact steps help us fix issues faster.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmitBug}
              disabled={!bugTitle.trim() || !bugDescription.trim() || isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <AlertCircle size={18} />
                  Submit Bug Report
                </>
              )}
            </button>
          </div>

          {/* My Bugs Sidebar */}
          <div className="lg:w-80 bg-dark-surface border border-dark-border rounded-xl p-4 md:p-6">
            <h3 className="text-base font-semibold text-content-primary mb-4">
              My Submitted Bugs
            </h3>

            {bugsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-dark-elevated rounded w-3/4 mb-2" />
                    <div className="h-3 bg-dark-elevated rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : myBugs && myBugs.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {myBugs.map((bug) => {
                  const isOpen = bug.status === "open" || bug.status === "in_progress";
                  return (
                    <div
                      key={bug._id}
                      className="p-3 bg-dark-elevated rounded-lg border border-dark-border"
                    >
                      <p className="text-sm text-content-primary font-medium truncate mb-2">
                        {bug.title}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${isOpen
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                      >
                        {isOpen ? "Open" : "Closed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle size={32} className="text-content-muted mx-auto mb-3" />
                <p className="text-content-muted text-sm">
                  No bugs submitted yet
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
