"use client";

import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Key } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const { data: users, isLoading } = trpc.user.list.useQuery();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">App Users</h2>
          <p className="text-muted-foreground">Manage your application users and view their API usage</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            A list of all registered users in your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading users...</div>
          ) : !users?.length ? (
            <div className="py-10 text-center text-muted-foreground">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>API Keys</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id.toString()}>
                    <TableCell>
                      <div className="font-medium">{user.name || "Unknown"}</div>
                      <div className="text-sm text-muted-foreground">{user.email || "No email"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                          user.tier === 'tier_2' ? 'default' : 
                          user.tier === 'tier_1' ? 'secondary' : 
                          'outline'
                        }
                        className={cn(
                          user.tier === 'tier_2' && "bg-indigo-500 hover:bg-indigo-600 border-transparent",
                          user.tier === 'tier_1' && "bg-blue-500 hover:bg-blue-600 text-white border-transparent"
                        )}
                      >
                        {user.tier === 'tier_2' ? 'Pro' : 
                         user.tier === 'tier_1' ? 'Basic' : 
                         'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy h:mm a') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Key className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{user.apiKeyCount}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
