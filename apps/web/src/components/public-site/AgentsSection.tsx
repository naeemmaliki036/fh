"use client";

import { usePublicSiteAgents } from "@/hooks/queries/public-site/usePublicSite";
import { AgentCard } from "./AgentCard";

interface AgentsSectionProps {
  slug: string;
}

export function AgentsSection({ slug }: AgentsSectionProps): React.ReactElement {
  const { data: agents, isLoading } = usePublicSiteAgents(slug);

  return (
    <section id="agents" className="py-14">
      <div className="mx-auto w-[min(100%-40px,1280px)]">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <span className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">
            Expert agents
          </span>
          <h2 className="mx-auto mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Meet the team.
          </h2>
          <p className="mx-auto mt-4 text-slate-600">
            Expert agents who know the market, ready to guide you from enquiry to keys.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-[2rem] bg-white shadow-sm" />
            ))}
          </div>
        ) : (agents ?? []).length === 0 ? (
          <p className="text-center text-sm text-slate-500">No agents listed yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {(agents ?? []).map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
