"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDeal } from "@/hooks/queries/useDeals";
import { DealOverviewPanel } from "@/components/organisms/DealOverviewPanel";
import { DealCommissionPanel } from "@/components/organisms/DealCommissionPanel";
import { DealDocumentsPanel } from "@/components/organisms/DealDocumentsPanel";
import { DealStageBadge } from "@/components/atoms/DealStageBadge";
import { DealTypeBadge } from "@/components/atoms/DealTypeBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface PageProps { params: Promise<{ id: string }> }

function fmt(value: string, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AE", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
  } catch { return `${currency} ${value}`; }
}

export default function DealDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { data: deal, isLoading, error } = useDeal(id);

  if (isLoading) return <p className="text-sm text-muted-foreground p-6">Loading deal…</p>;

  if (error || !deal) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">Deal not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/deals"><ArrowLeft className="mr-2 h-4 w-4" />Back to deals</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/deals"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate">
            {deal.customer?.full_name ?? "Deal"} — {deal.interest_property?.title ?? "Property"}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <DealStageBadge stage={deal.stage} />
            <DealTypeBadge type={deal.deal_type} />
            <span className="text-sm text-muted-foreground">
              {fmt(deal.transaction_value, deal.transaction_currency)}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <DealOverviewPanel deal={deal} />
        </TabsContent>

        <TabsContent value="commission" className="pt-4">
          <DealCommissionPanel deal={deal} />
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <DealDocumentsPanel dealId={deal.id} customerId={deal.customer_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
