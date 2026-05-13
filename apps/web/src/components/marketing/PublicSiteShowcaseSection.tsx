import React from "react";

function PublicSiteMock(): React.ReactElement {
  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Browser chrome */}
      <div className="bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden">
        <div className="bg-gray-50 border-b border-black/8 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-3 bg-white border border-black/8 rounded px-2 py-0.5 text-[9px] text-gray-400 font-mono">
            fhportal.com/p/al-noor-realty
          </div>
        </div>

        {/* Public site content */}
        <div className="bg-[#0f766e] px-5 py-5">
          {/* Tenant nav */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white/20" />
              <span className="text-white font-bold text-xs">Al Noor Realty</span>
            </div>
            <div className="flex gap-3">
              {["Listings", "Team", "Contact"].map((item) => (
                <span key={item} className="text-white/70 text-[9px] font-medium">{item}</span>
              ))}
            </div>
          </div>
          {/* Hero text */}
          <p className="text-white/60 text-[9px] uppercase tracking-widest mb-1">Dubai Specialists</p>
          <h2 className="text-white font-extrabold text-base leading-tight mb-2">
            Find Your Dream Property in Dubai
          </h2>
          <div className="bg-white rounded-lg px-3 py-2 flex items-center gap-2 mb-4">
            <span className="text-[9px] text-gray-400 flex-1">Search by area, type or price...</span>
            <div className="w-12 h-4 rounded bg-[#0f766e] flex items-center justify-center">
              <span className="text-white text-[7px] font-bold">Search</span>
            </div>
          </div>
        </div>

        {/* Listing cards */}
        <div className="bg-[#f8f8f7] p-3">
          <p className="text-[9px] font-bold text-[#0a0a0a] mb-2">Featured Listings</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Marina Heights 4BR", sub: "Dubai Marina · AED 2.4M", badge: "Sale" },
              { label: "Downtown Studio", sub: "Downtown Dubai · AED 85K/yr", badge: "Rent" },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl overflow-hidden border border-black/5 shadow-sm">
                <div className="h-14 bg-gradient-to-br from-[#0f766e]/20 to-teal-100 flex items-end p-1.5">
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${card.badge === "Sale" ? "bg-[#0f766e] text-white" : "bg-amber-400 text-[#0a0a0a]"}`}>
                    {card.badge}
                  </span>
                </div>
                <div className="p-2">
                  <p className="text-[8px] font-bold text-[#0a0a0a] truncate">{card.label}</p>
                  <p className="text-[7px] text-gray-400 mt-0.5 truncate">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Team strip */}
          <p className="text-[9px] font-bold text-[#0a0a0a] mt-3 mb-2">Our Team</p>
          <div className="flex gap-2">
            {["Ahmed K.", "Sara M.", "Omar A."].map((name) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0f766e]/30 to-teal-200" />
                <span className="text-[7px] text-gray-500">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicSiteShowcaseSection(): React.ReactElement {
  return (
    <section className="bg-[#0a0a0a] py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT — copy */}
          <div>
            <p className="text-xs font-semibold text-[#0f766e] uppercase tracking-widest mb-4">
              Public tenant sites
            </p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              Every tenant gets a{" "}
              <span className="bg-gradient-to-r from-[#0f766e] to-emerald-400 bg-clip-text text-transparent">
                beautiful public site
              </span>{" "}
              out of the box.
            </h2>
            <p className="mt-5 text-lg text-white/60 leading-relaxed">
              Upload your logo, set your brand colors, add your team, write your services — the
              platform builds a fully customized listings site at{" "}
              <span className="text-[#0f766e] font-mono font-semibold text-sm">
                fhportal.com/p/your-slug
              </span>{" "}
              automatically. No dev, no designer needed.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Custom hero, logo, and theme colors",
                "All listings auto-synced from your inventory",
                "Team profiles and service descriptions",
                "Contact form and lead capture",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                  <span className="w-5 h-5 rounded-full bg-[#0f766e]/20 border border-[#0f766e]/40 flex items-center justify-center text-[#0f766e] text-xs flex-shrink-0">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — mock */}
          <div className="flex justify-center lg:justify-end">
            <PublicSiteMock />
          </div>
        </div>
      </div>
    </section>
  );
}
