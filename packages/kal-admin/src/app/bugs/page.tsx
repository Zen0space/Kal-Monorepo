"use client";

import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Bug, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type BugStatus = "open" | "in_progress" | "resolved" | "closed" | "wont_fix";

const statusConfig: Record<BugStatus, { label: string; color: string; icon: React.ElementType }> = {
    open: { label: "Open", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: AlertCircle },
    in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
    resolved: { label: "Resolved", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
    closed: { label: "Closed", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: CheckCircle },
    wont_fix: { label: "Won't Fix", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status as BugStatus] || statusConfig.open;
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn("flex items-center gap-1 w-fit", config.color)}>
            <Icon size={12} />
            {config.label}
        </Badge>
    );
}

export default function BugsPage() {
    const [filterStatus, setFilterStatus] = useState<"all" | BugStatus>("all");
    const utils = trpc.useUtils();

    const { data, isLoading } = trpc.feedback.getAllBugs.useQuery({ status: filterStatus });
    const { data: stats } = trpc.feedback.getStats.useQuery();

    const updateStatusMutation = trpc.feedback.updateBugStatus.useMutation({
        onSuccess: () => {
            utils.feedback.getAllBugs.invalidate();
            utils.feedback.getStats.invalidate();
        },
    });

    const handleStatusChange = (bugId: string, newStatus: BugStatus) => {
        updateStatusMutation.mutate({ bugId, status: newStatus });
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Bug Reports</h2>
                    <p className="text-muted-foreground">Manage and track all user-reported bugs</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bugs</CardTitle>
                        <Bug className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalBugs ?? 0}</div>
                        <p className="text-xs text-muted-foreground">All time reports</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Bugs</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-400">{stats?.openBugs ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Requiring attention</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalReviews ?? 0}</div>
                        <p className="text-xs text-muted-foreground">User feedback</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.avgRating ? stats.avgRating.toFixed(1) : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">User satisfaction</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Bug Reports</CardTitle>
                            <CardDescription>
                                A list of all bugs reported by users. Click status to update.
                            </CardDescription>
                        </div>
                        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                                <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-10 text-center text-muted-foreground">Loading bug reports...</div>
                    ) : !data?.bugs?.length ? (
                        <div className="py-10 text-center text-muted-foreground">
                            {filterStatus === "all" ? "No bug reports submitted yet." : `No ${filterStatus.replace("_", " ")} bugs.`}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reporter</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="max-w-xs">Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Reported</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.bugs.map((bug) => (
                                    <TableRow key={bug._id}>
                                        <TableCell>
                                            <div className="font-medium">{bug.userName || "Anonymous"}</div>
                                            <div className="text-sm text-muted-foreground">{bug.userEmail || "No email"}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{bug.title}</div>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            <p className="line-clamp-2 text-sm text-muted-foreground">{bug.description}</p>
                                            {bug.stepsToReproduce && (
                                                <p className="mt-1 text-xs text-muted-foreground italic line-clamp-1">
                                                    Steps: {bug.stepsToReproduce}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={bug.status} />
                                        </TableCell>
                                        <TableCell>
                                            {bug.createdAt ? format(new Date(bug.createdAt), 'MMM d, yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={bug.status}
                                                onValueChange={(v) => handleStatusChange(bug._id, v as BugStatus)}
                                                disabled={updateStatusMutation.isPending}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    {updateStatusMutation.isPending && updateStatusMutation.variables?.bugId === bug._id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <SelectValue />
                                                    )}
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="resolved">Resolved</SelectItem>
                                                    <SelectItem value="closed">Closed</SelectItem>
                                                    <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {data && data.total > data.bugs.length && (
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Showing {data.bugs.length} of {data.total} bug reports
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
