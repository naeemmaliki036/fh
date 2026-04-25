"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLead } from "@/hooks/queries/useLeads";
import { LeadOverviewPanel } from "@/components/organisms/LeadOverviewPanel";
import { LeadActivityTimeline } from "@/components/organisms/LeadActivityTimeline";
import { LeadStageBadge } from "@/components/atoms/LeadStageBadge";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LeadDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { data: lead, isLoading, error } = useLead(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading lead…</p>;
  }

  if (error || !lead) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">Lead not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/leads"><ArrowLeft className="mr-2 h-4 w-4" />Back to leads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/leads"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{lead.customer?.full_name ?? "Lead"}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <LeadStageBadge stage={lead.stage} />
            <span className="text-xs text-muted-foreground">
              Created {new Date(lead.created_at).toLocaleDateString("en-AE")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        <div className="lg:sticky lg:top-6">
          <LeadOverviewPanel lead={lead} />
        </div>
        <div>
          <LeadActivityTimeline leadId={lead.id} />
        </div>
      </div>
    </div>
  );
}
