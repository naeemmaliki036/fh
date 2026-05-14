import type { PublicAgentSnippet } from "@/lib/types/public-site";

interface AgentCardProps {
  agent: PublicAgentSnippet;
}

export function AgentCard({ agent }: AgentCardProps): React.ReactElement {
  const initials = agent.full_name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const subtitle = agent.license_id ? `License: ${agent.license_id}` : "Property Advisor";

  return (
    <article className="rounded-[2rem] bg-white p-6 text-center shadow-sm">
      {/* Photo */}
      <div className="mx-auto h-24 w-24 overflow-hidden rounded-full ring-4 ring-slate-100">
        {agent.photo_url ? (
          <img
            src={agent.photo_url}
            alt={agent.full_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xl font-black text-slate-600">
            {initials}
          </div>
        )}
      </div>

      <h3 className="mt-4 text-xl font-black text-slate-950">{agent.full_name}</h3>
      <p className="text-sm leading-6 text-slate-500">{subtitle}</p>

      <div className="mt-5 flex gap-3">
        {agent.phone && (
          <a
            href={`tel:${agent.phone}`}
            className="flex-1 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            Call
          </a>
        )}
        <a
          href={`mailto:${agent.email}`}
          className="flex-1 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Email
        </a>
      </div>
    </article>
  );
}
