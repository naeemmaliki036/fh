"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useProperties } from "@/hooks/queries/useProperties";
import { useMyTenant } from "@/hooks/queries/useTenants";
import { PropertyFiltersBar } from "@/components/organisms/PropertyFiltersBar";
import { PropertyCreateDialog } from "@/components/organisms/PropertyCreateDialog";
import { PropertiesGrid } from "@/components/organisms/PropertiesGrid";
import { Button } from "@/components/ui/button";
import type { PropertyListParams } from "@/lib/types/property";

function PropertiesContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  const params: PropertyListParams = {
    q: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as PropertyListParams["status"]) ?? undefined,
    property_type: (searchParams.get("property_type") as PropertyListParams["property_type"]) ?? undefined,
    country: searchParams.get("country") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    area: searchParams.get("area") ?? undefined,
    assigned_agent_id: searchParams.get("assigned_agent_id") ?? undefined,
    min_price: searchParams.get("min_price") ?? undefined,
    max_price: searchParams.get("max_price") ?? undefined,
    min_bedrooms: searchParams.get("min_bedrooms") ? Number(searchParams.get("min_bedrooms")) : undefined,
    max_bedrooms: searchParams.get("max_bedrooms") ? Number(searchParams.get("max_bedrooms")) : undefined,
    has_listing: searchParams.get("has_listing") === "true"
      ? true
      : searchParams.get("has_listing") === "false"
      ? false
      : undefined,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <PropertyFiltersBar />
        <Button onClick={() => setShowCreate(true)} className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" />New Property
        </Button>
      </div>
      <PropertiesGrid filterParams={params} />
      <PropertyCreateDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

export default function PropertiesPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your property inventory</p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <PropertiesContent />
      </Suspense>
    </div>
  );
}
