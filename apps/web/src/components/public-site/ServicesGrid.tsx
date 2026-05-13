import type { ServicesConfig } from "@/lib/types/public-site";
import { PUBLIC_SITE_DEFAULTS } from "@/lib/constants/public-site-defaults";

interface ServicesGridProps {
  cfg: ServicesConfig;
}

export function ServicesGrid({ cfg }: ServicesGridProps): React.ReactElement {
  const title = cfg.title ?? PUBLIC_SITE_DEFAULTS.services.title;
  const subtitle = cfg.subtitle ?? PUBLIC_SITE_DEFAULTS.services.subtitle;
  const cards = cfg.cards ?? PUBLIC_SITE_DEFAULTS.services.cards ?? [];

  return (
    <section id="services" className="py-14">
      <div className="mx-auto w-[min(100%-40px,1280px)]">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
              {title}
            </span>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {subtitle}
            </h2>
          </div>
          <p className="max-w-xl text-slate-600">
            A clean public website for discovery, plus end-to-end flows for buyers, sellers, and agents.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ title: cardTitle, description }) => (
            <article
              key={cardTitle}
              className="rounded-[2rem] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl font-black text-white"
                style={{ backgroundColor: "var(--primary)" }}
              >
                {cardTitle.slice(0, 1)}
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-950">{cardTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
