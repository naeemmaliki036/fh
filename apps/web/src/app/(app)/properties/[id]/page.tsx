"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useProperty } from "@/hooks/queries/useProperties";
import { useChangePropertyStatus } from "@/hooks/mutations/usePropertyMutations";
import { PropertyOverviewPanel } from "@/components/organisms/PropertyOverviewPanel";
import { PropertyMediaGallery } from "@/components/organisms/PropertyMediaGallery";
import { PropertyListingsPanel } from "@/components/organisms/PropertyListingsPanel";
import { PropertyAgentsPanel } from "@/components/organisms/PropertyAgentsPanel";
import { PropertyStatusBadge } from "@/components/atoms/PropertyStatusBadge";
import { PropertyTypeBadge } from "@/components/atoms/PropertyTypeBadge";
import { StatusHeaderBar } from "@/components/molecules/StatusHeaderBar";
import { AuditTimelinePanel } from "@/components/organisms/AuditTimelinePanel";
import { PropertyDescriptionPanel } from "@/components/organisms/PropertyDescriptionPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  PROPERTY_OFF_MARKET_REASONS,
  PROPERTY_AVAILABLE_REASONS,
  LISTING_SOLD_REASONS,
  LISTING_RENTED_REASONS,
} from "@/lib/constants/status-reasons";
import type { PropertyStatus } from "@/lib/types/property";

const PROPERTY_TRANSITIONS: Array<{
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

function getReasonOptions(status: PropertyStatus) {
  if (status === "off_market") return PROPERTY_OFF_MARKET_REASONS;
  if (status === "sold") return LISTING_SOLD_REASONS;
  if (status === "rented") return LISTING_RENTED_REASONS;
  return PROPERTY_AVAILABLE_REASONS;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { data: property, isLoading, error } = useProperty(id);
  const { mutateAsync: changeStatus } = useChangePropertyStatus();

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

  const transitions = PROPERTY_TRANSITIONS
    .filter((t) => t.fromStatuses.includes(property.status))
    .map((t) => ({
      status: t.status,
      label: t.label,
      destructive: t.destructive,
      reasonOptions: getReasonOptions(t.status),
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
              onChangeStatus={async (status, reasonCode, reasonNote) => {
                await changeStatus({ id: property.id, status, reason_code: reasonCode, reason_note: reasonNote });
              }}
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

        <TabsContent value="overview" className="pt-4">
          <PropertyOverviewPanel property={property} />
        </TabsContent>

        <TabsContent value="description" className="pt-4">
          <PropertyDescriptionPanel property={property} />
        </TabsContent>

        <TabsContent value="media" className="pt-4">
          <PropertyMediaGallery propertyId={property.id} />
        </TabsContent>

        <TabsContent value="listings" className="pt-4">
          <PropertyListingsPanel propertyId={property.id} />
        </TabsContent>

        <TabsContent value="agents" className="pt-4">
          <PropertyAgentsPanel
            propertyId={property.id}
            assignedAgents={property.assigned_agents}
          />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <AuditTimelinePanel entityType="property" entityId={property.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
