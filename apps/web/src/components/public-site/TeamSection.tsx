"use client";

import type { TeamConfig, TeamMember } from "@/lib/types/public-site";
import { usePublicSiteAgents } from "@/hooks/queries/public-site/usePublicSite";
import { AgentCard } from "./AgentCard";

interface TeamSectionProps {
  slug: string;
  cfg: TeamConfig;
}

interface TeamMemberCardProps {
  member: TeamMember;
}

function TeamMemberCard({ member }: TeamMemberCardProps): React.ReactElement {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="rounded-[2rem] bg-white p-6 text-center shadow-sm">
      <div className="mx-auto h-24 w-24 overflow-hidden rounded-full ring-4 ring-slate-100">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xl font-black text-slate-600">
            {initials}
          </div>
        )}
      </div>
      <h3 className="mt-4 text-xl font-black text-slate-950">{member.name}</h3>
      <p className="text-sm leading-6 text-slate-500">{member.title}</p>
      <div className="mt-5 flex gap-3">
        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="flex-1 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            Call
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="flex-1 inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--primary)" }}
          >
            Email
          </a>
        )}
        {member.linkedin_url && (
          <a
            href={member.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            in
          </a>
        )}
      </div>
    </article>
  );
}

export function TeamSection({ slug, cfg }: TeamSectionProps): React.ReactElement {
  const { data: agents, isLoading } = usePublicSiteAgents(slug);

  const title = cfg.title ?? "Meet the team";
  const subtitle = cfg.subtitle ?? "Expert team members ready to guide you from enquiry to keys.";
  const members = cfg.members ?? [];
  const agentList = cfg.show_agents ? (agents ?? []) : [];
  const hasContent = members.length > 0 || agentList.length > 0 || isLoading;

  return (
    <section id="team" className="py-14">
      <div className="mx-auto w-[min(100%-40px,1280px)]">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <span className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
            Expert agents
          </span>
          <h2 className="mx-auto mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 text-slate-600">{subtitle}</p>
        </div>

        {isLoading && members.length === 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-[2rem] bg-white shadow-sm" />
            ))}
          </div>
        ) : !hasContent ? (
          <p className="text-center text-sm text-slate-500">No team members listed yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {members.map((m, idx) => (
              <TeamMemberCard key={idx} member={m} />
            ))}
            {agentList.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
