"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Reason = "pending" | "suspended";

const CONTENT: Record<Reason, { title: string; description: string }> = {
  pending: {
    title: "Account Pending Approval",
    description:
      "Your company account has been registered and is currently awaiting review by the platform team. You will be notified by email once your account is approved.",
  },
  suspended: {
    title: "Account Suspended",
    description:
      "Your company account has been suspended. If you believe this is a mistake or need further information, please contact the platform team.",
  },
};

function isReason(value: string | null): value is Reason {
  return value === "pending" || value === "suspended";
}

function AccountStatusContent(): React.ReactElement {
  const params = useSearchParams();
  const rawReason = params.get("reason");
  const reason: Reason = isReason(rawReason) ? rawReason : "pending";
  const content = CONTENT[reason];

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/contact">Contact platform</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AccountStatusPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 bg-muted/20 min-h-screen">
      <Suspense fallback={<div className="mt-8 h-32 animate-pulse rounded-lg bg-muted/40" />}>
        <AccountStatusContent />
      </Suspense>
    </div>
  );
}
