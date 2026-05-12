const SERVICES = [
  {
    title: "Buy Property",
    text: "Explore verified villas, apartments, townhouses, and investment-ready homes across prime UAE communities.",
  },
  {
    title: "Rent Homes",
    text: "Find ready-to-move rental homes with clear pricing, location filters, and direct agent support.",
  },
  {
    title: "Sell & List",
    text: "List your property with professional photography, valuation support, and smart lead management.",
  },
  {
    title: "Verified Process",
    text: "Secure document collection, buyer verification, and transparent deal tracking from enquiry to closing.",
  },
] as const;

export function ServicesGrid(): React.ReactElement {
  return (
    <section id="services" className="py-14">
      <div className="mx-auto w-[min(100%-40px,1280px)]">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">
              What we offer
            </span>
            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Everything for modern real estate deals.
            </h2>
          </div>
          <p className="max-w-xl text-slate-600">
            A clean public website for discovery, plus end-to-end flows for buyers, sellers, and agents.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ title, text }) => (
            <article
              key={title}
              className="rounded-[2rem] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 font-black text-white">
                {title.slice(0, 1)}
              </div>
              <h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
