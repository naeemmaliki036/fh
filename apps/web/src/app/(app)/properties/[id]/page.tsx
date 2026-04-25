"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useProperty } from "@/hooks/queries/useProperties";
import { PropertyOverviewPanel } from "@/components/organisms/PropertyOverviewPanel";
import { PropertyMediaGallery } from "@/components/organisms/PropertyMediaGallery";
import { PropertyListingsPanel } from "@/components/organisms/PropertyListingsPanel";
import { PropertyAgentsPanel } from "@/components/organisms/PropertyAgentsPanel";
import { PropertyStatusBadge } from "@/components/atoms/PropertyStatusBadge";
import { PropertyTypeBadge } from "@/components/atoms/PropertyTypeBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { data: property, isLoading, error } = useProperty(id);

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
            <PropertyStatusBadge status={property.status} />
            {property.city && <span className="text-sm text-muted-foreground">{property.city}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="media">Media ({property.media_count})</TabsTrigger>
          <TabsTrigger value="listings">Listings ({property.listing_count})</TabsTrigger>
          <TabsTrigger value="agents">Agents ({property.assigned_agents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <PropertyOverviewPanel property={property} />
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
      </Tabs>
    </div>
  );
}
