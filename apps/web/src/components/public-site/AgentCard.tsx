import type { PublicAgentSnippet } from "@/lib/types/public-site";

interface AgentCardProps {
  agent: PublicAgentSnippet;
}

export function AgentCard({ agent }: AgentCardProps): React.ReactElement {
  return (
    <div className="flex items-start gap-4 rounded-xl border bg-card p-4">
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-muted">
        {agent.photo_url ? (
          <img
            src={agent.photo_url}
            alt={agent.full_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-lg font-semibold text-muted-foreground">
            {agent.full_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{agent.full_name}</p>
        <div className="mt-1 space-y-1">
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {agent.phone}
            </a>
          )}
          <a
            href={`mailto:${agent.email}`}
            className="block truncate text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {agent.email}
          </a>
        </div>
      </div>
    </div>
  );
}
