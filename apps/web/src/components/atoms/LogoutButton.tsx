"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/mutations/useAuthMutations";

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline";
  showLabel?: boolean;
}

export function LogoutButton({ variant = "ghost", showLabel = true }: LogoutButtonProps): React.ReactElement {
  const { mutate: logout, isPending } = useLogout();

  return (
    <Button
      variant={variant}
      size={showLabel ? "default" : "icon"}
      onClick={() => logout()}
      disabled={isPending}
    >
      <LogOut className="h-4 w-4" />
      {showLabel && <span>Sign out</span>}
    </Button>
  );
}
