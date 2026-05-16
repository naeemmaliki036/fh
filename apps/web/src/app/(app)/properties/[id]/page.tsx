"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useProperty } from "@/hooks/queries/useProperties";
import { useChangePropertyStatus } from "@/hooks/mutations/usePropertyMutations";
import { useAuth } from "@/contexts/AuthContext";
import { PropertyOverviewPanel } from "@/components/organisms/PropertyOverviewPanel";
import { PropertyMediaGallery } from "@/components/organisms/PropertyMediaGallery";
import { PropertyListingsPanel } from "@/components/organisms/PropertyListingsPanel";
import { PropertyAgentsPanel } from "@/components/organisms/PropertyAgentsPanel";
import { PropertyStatusBadge } from "@/components/atoms/PropertyStatusBadge";
import { PropertyTypeBadge } from "@/components/atoms/PropertyTypeBadge";
import { StatusHeaderBar } from "@/components/molecules/StatusHeaderBar";
import { AuditTimelinePanel } from "@/components/organisms/AuditTimelinePanel";
import { PropertyDescriptionPanel } from "@/components/organisms/PropertyDescriptionPanel";
import { OffMarketStatusDialog } from "@/components/organisms/OffMarketStatusDialog";
import { SoldRentedGuardDialog } from "@/components/organisms/SoldRentedGuardDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  PROPERTY_AVAILABLE_REASONS,
} from "@/lib/constants/status-reasons";
import type { PropertyStatus } from "@/lib/types/property";

const TRANSITIONS: Array<{
  fromStatuses: PropertyStatus[];
  status: PropertyStatus;
  label: string;
  destructive?: boolean;
}> = [
  { fromStatuses: ["draft", "reserved", "rented"], status: "available", label: "Mark Available" },
  { fromStatuses: ["draft", "available"], status: "reserved", label: "Mark Reserved" },
  { fromStatuses: ["draft", "available", "reserved", "rented"], status: "off_market", label: "Mark Off-Market", destructive: true },
  { fromStatuses: ["available", "reserved"], status: "sold", label: "Mark Sold" },
  { fromStatuses: ["available", "reserved"], status: "rented", label: "Mark Rented" },
];

const OVERRIDE_ROLES = new Set(["company_owner", "company_admin", "property_admin"]);

interface PageProps { params: Promise<{ id: string }> }

export default function PropertyDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { data: property, isLoading, error } = useProperty(id);
  const { mutateAsync: changeStatus } = useChangePropertyStatus();
  const { currentUser } = useAuth();
  const canOverride = !!currentUser && OVERRIDE_ROLES.has(currentUser.role);

  const [showOffMarket, setShowOffMarket] = useState(false);
  const [soldRentedTarget, setSoldRentedTarget] = useState<Extract<PropertyStatus, "sold" | "rented"> | null>(null);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading property...</p>;
  }

  if (error || !property) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">Property not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/properties"><ArrowLeft className="mr-2 h-4 w-4" />Back to properties</Link>
        </Button>
      </div>
    );
  }

  const handleChangeStatus = async (
    status: PropertyStatus,
    reasonCode: string,
    reasonNote: string | null,
  ): Promise<void> => {
    if (status === "off_market") {
      setShowOffMarket(true);
      return;
    }
    if (status === "sold" || status === "rented") {
      setSoldRentedTarget(status);
      return;
    }
    await changeStatus({ id: property.id, status, reason_code: reasonCode, reason_note: reasonNote });
  };

  const transitions = TRANSITIONS
    .filter((t) => t.fromStatuses.includes(property.status))
    .map((t) => ({
      status: t.status,
      label: t.label,
      destructive: t.destructive,
      reasonOptions: PROPERTY_AVAILABLE_REASONS,
    }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/properties"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{property.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <PropertyTypeBadge type={property.property_type} />
            <StatusHeaderBar
              statusBadge={<PropertyStatusBadge status={property.status} />}
              transitions={transitions}
              onChangeStatus={handleChangeStatus}
            />
            {property.city && <span className="text-sm text-muted-foreground">{property.city}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="media">Media ({property.media_count})</TabsTrigger>
          <TabsTrigger value="listings">Listings ({property.listing_count})</TabsTrigger>
          <TabsTrigger value="agents">Agents ({property.assigned_agents.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4"><PropertyOverviewPanel property={property} /></TabsContent>
        <TabsContent value="description" className="pt-4"><PropertyDescriptionPanel property={property} /></TabsContent>
        <TabsContent value="media" className="pt-4"><PropertyMediaGallery propertyId={property.id} /></TabsContent>
        <TabsContent value="listings" className="pt-4"><PropertyListingsPanel propertyId={property.id} /></TabsContent>
        <TabsContent value="agents" className="pt-4">
          <PropertyAgentsPanel propertyId={property.id} canOverride={canOverride} />
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <AuditTimelinePanel entityType="property" entityId={property.id} />
        </TabsContent>
      </Tabs>

      <OffMarketStatusDialog
        open={showOffMarket}
        onOpenChange={(o) => { if (!o) setShowOffMarket(false); }}
        onConfirm={async (code, note) => {
          await changeStatus({ id: property.id, status: "off_market", reason_code: code, reason_note: note });
        }}
      />

      <SoldRentedGuardDialog
        propertyId={property.id}
        targetStatus={soldRentedTarget}
        onClose={() => setSoldRentedTarget(null)}
        onProceed={async (code, note) => {
          if (!soldRentedTarget) return;
          await changeStatus({ id: property.id, status: soldRentedTarget, reason_code: code, reason_note: note });
        }}
      />
    </div>
  );
}
