"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformUsersTable } from "@/components/organisms/PlatformUsersTable";
import { useAuth } from "@/contexts/AuthContext";

export default function PlatformUsersPage(): React.ReactElement {
  const { currentPlatformUser } = useAuth();

  if (currentPlatformUser?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">Access denied</p>
        <p className="text-sm text-muted-foreground mt-1">
          Only super admins can manage platform users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage platform-level admin accounts
          </p>
        </div>
        <Button asChild>
          <Link href="/users/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New user
          </Link>
        </Button>
      </div>
      <PlatformUsersTable />
    </div>
  );
}
