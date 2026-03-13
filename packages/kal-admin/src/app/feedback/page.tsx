"use client";

import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Star, MessageSquare, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={14}
                    className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}
                />
            ))}
            <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
        </div>
    );
}

export default function FeedbackPage() {
    const { data, isLoading } = trpc.feedback.getAllReviews.useQuery();
    const { data: stats } = trpc.feedback.getStats.useQuery();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Feedback</h2>
                    <p className="text-muted-foreground">View all user feedback and reviews</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalReviews ?? 0}</div>
                        <p className="text-xs text-muted-foreground">All time feedback</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.avgRating ? stats.avgRating.toFixed(1) : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">Out of 5 stars</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Bug Reports</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.openBugs ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Requiring attention</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Reviews</CardTitle>
                    <CardDescription>
                        A list of all feedback submitted by users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-10 text-center text-muted-foreground">Loading feedback...</div>
                    ) : !data?.reviews?.length ? (
                        <div className="py-10 text-center text-muted-foreground">No feedback submitted yet.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead className="max-w-md">Feedback</TableHead>
                                    <TableHead>Submitted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.reviews.map((review) => (
                                    <TableRow key={review._id}>
                                        <TableCell>
                                            <div className="font-medium">{review.userName || "Anonymous"}</div>
                                            <div className="text-sm text-muted-foreground">{review.userEmail || "No email"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <StarRating rating={review.rating} />
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <p className="line-clamp-3 text-sm">{review.feedback}</p>
                                        </TableCell>
                                        <TableCell>
                                            {review.createdAt ? format(new Date(review.createdAt), 'MMM d, yyyy h:mm a') : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {data && data.total > data.reviews.length && (
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Showing {data.reviews.length} of {data.total} reviews
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
