"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAgent } from "@/hooks/queries/useAgents";
import { AgentProfilePanel } from "@/components/organisms/AgentProfilePanel";
import { AgentDocumentsList } from "@/components/organisms/AgentDocumentsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const { data: agent, isLoading, error } = useAgent(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading agent...</p>;
  }

  if (error || !agent) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">Agent not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/agents"><ArrowLeft className="mr-2 h-4 w-4" />Back to agents</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/agents"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{agent.full_name}</h1>
          <p className="text-sm text-muted-foreground">{agent.email}</p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="pt-4">
          <AgentProfilePanel agent={agent} />
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <AgentDocumentsList agentId={agent.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
