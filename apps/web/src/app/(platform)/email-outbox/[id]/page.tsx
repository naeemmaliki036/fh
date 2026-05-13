"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailOutboxDetail } from "@/components/organisms/EmailOutboxDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EmailOutboxItemPage({ params }: Props): React.ReactElement {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/email-outbox">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Message detail</h1>
      </div>
      <EmailOutboxDetail id={id} />
    </div>
  );
}
