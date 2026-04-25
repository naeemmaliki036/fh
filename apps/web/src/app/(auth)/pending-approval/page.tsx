import Link from "next/link";
import { Clock } from "lucide-react";
import { AuthShell } from "@/components/templates/AuthShell";
import { Button } from "@/components/ui/button";

export default function PendingApprovalPage(): React.ReactElement {
  return (
    <AuthShell title="Account Under Review">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Your application is pending</h2>
          <p className="text-sm text-muted-foreground">
            A platform admin will review and activate your account.
            You will be able to log in once your company account is approved.
          </p>
        </div>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
