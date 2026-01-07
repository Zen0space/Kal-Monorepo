import type { ObjectId } from "mongodb";
import { z } from "zod";

import { protectedProcedure, router } from "../lib/trpc.js";

/**
 * Feedback Review document type
 * Reviews are stored immediately - no approval needed
 */
export interface FeedbackReview {
  _id: ObjectId;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  rating: number; // 1-5
  feedback: string;
  createdAt: Date;
}

/**
 * Bug Report document type
 * Priority is not set by user - will be determined internally by team
 */
export interface FeedbackBug {
  _id: ObjectId;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  title: string;
  description: string;
  stepsToReproduce: string | null;
  status: "open" | "in_progress" | "resolved" | "closed" | "wont_fix";
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

/**
 * Public review type for API responses
 */
export interface FeedbackReviewPublic {
  _id: string;
  rating: number;
  feedback: string;
  createdAt: Date;
}

/**
 * Public bug report type for API responses
 */
export interface FeedbackBugPublic {
  _id: string;
  title: string;
  description: string;
  stepsToReproduce: string | null;
  status: string;
  createdAt: Date;
}

function reviewToPublic(doc: FeedbackReview): FeedbackReviewPublic {
  return {
    _id: doc._id.toString(),
    rating: doc.rating,
    feedback: doc.feedback,
    createdAt: doc.createdAt,
  };
}

function bugToPublic(doc: FeedbackBug): FeedbackBugPublic {
  return {
    _id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    stepsToReproduce: doc.stepsToReproduce,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

export const feedbackRouter = router({
  /**
   * Submit a review - stored immediately, no approval needed
   */
  submitReview: protectedProcedure
    .input(
      z.object({
        rating: z.number().min(1).max(5),
        feedback: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const userId = ctx.userId || ctx.user?._id?.toString() || "";

      const doc: Omit<FeedbackReview, "_id"> = {
        userId,
        userEmail: ctx.user?.email || null,
        userName: ctx.user?.name || null,
        rating: input.rating,
        feedback: input.feedback,
        createdAt: now,
      };

      const result = await ctx.db.collection("feedback_reviews").insertOne(doc);

      return {
        success: true,
        _id: result.insertedId.toString(),
        message: "Thank you for your feedback!",
      };
    }),

  /**
   * Submit a bug report - priority will be set internally by team
   */
  submitBug: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(5000),
        stepsToReproduce: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const userId = ctx.userId || ctx.user?._id?.toString() || "";

      const doc: Omit<FeedbackBug, "_id"> = {
        userId,
        userEmail: ctx.user?.email || null,
        userName: ctx.user?.name || null,
        title: input.title,
        description: input.description,
        stepsToReproduce: input.stepsToReproduce || null,
        status: "open",
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
      };

      const result = await ctx.db.collection("feedback_bugs").insertOne(doc);

      return {
        success: true,
        _id: result.insertedId.toString(),
        message: "Bug report submitted successfully. We'll look into it!",
      };
    }),

  /**
   * Get user's own reviews
   */
  getMyReviews: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId || ctx.user?._id?.toString() || "";
    
    const reviews = await ctx.db
      .collection<FeedbackReview>("feedback_reviews")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return reviews.map(reviewToPublic);
  }),

  /**
   * Get user's own bug reports
   */
  getMyBugs: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId || ctx.user?._id?.toString() || "";
    
    const bugs = await ctx.db
      .collection<FeedbackBug>("feedback_bugs")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return bugs.map(bugToPublic);
  }),

  /**
   * Get feedback stats for user (how many they've submitted)
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId || ctx.user?._id?.toString() || "";
    
    const [reviewCount, bugCount] = await Promise.all([
      ctx.db
        .collection("feedback_reviews")
        .countDocuments({ userId }),
      ctx.db
        .collection("feedback_bugs")
        .countDocuments({ userId }),
    ]);

    return {
      reviewsSubmitted: reviewCount,
      bugsReported: bugCount,
    };
  }),
});
