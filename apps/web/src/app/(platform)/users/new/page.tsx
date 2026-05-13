"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CreatePlatformUserForm } from "@/components/organisms/CreatePlatformUserForm";
import { useAuth } from "@/contexts/AuthContext";

export default function NewPlatformUserPage(): React.ReactElement {
  const { currentPlatformUser } = useAuth();

  if (currentPlatformUser?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium">Access denied</p>
        <p className="text-sm text-muted-foreground mt-1">
          Only super admins can create platform users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/users"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to platform users
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create platform user</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new admin account with platform-level access.
        </p>
      </div>
      <CreatePlatformUserForm />
    </div>
  );
}
