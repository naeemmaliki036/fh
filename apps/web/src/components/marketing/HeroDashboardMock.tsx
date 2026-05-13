import React from "react";

function KpiChip({ label, value, up }: { label: string; value: string; up: boolean }): React.ReactElement {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-black/5 flex flex-col gap-1">
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-lg font-bold text-[#0a0a0a]">{value}</span>
      <span className={`text-[10px] font-semibold ${up ? "text-[#0f766e]" : "text-red-400"}`}>
        {up ? "▲" : "▼"} {up ? "+12% vs last month" : "-3% vs last month"}
      </span>
    </div>
  );
}

function ListingRow({ title, status, price }: { title: string; status: string; price: string }): React.ReactElement {
  const colorMap: Record<string, string> = {
    Active: "bg-[#0f766e]/10 text-[#0f766e]",
    Pending: "bg-amber-100 text-amber-700",
    Sold: "bg-gray-100 text-gray-500",
  };
  return (
    <div className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-[#0f766e]/10 flex items-center justify-center">
          <span className="text-[8px] font-bold text-[#0f766e]">APT</span>
        </div>
        <span className="text-xs font-medium text-[#0a0a0a] truncate max-w-[90px]">{title}</span>
      </div>
      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${colorMap[status] ?? "bg-gray-100 text-gray-500"}`}>
        {status}
      </span>
      <span className="text-xs font-bold text-[#0a0a0a]">{price}</span>
    </div>
  );
}

export function HeroDashboardMock(): React.ReactElement {
  return (
    <div className="relative w-full max-w-[460px] mx-auto">
      {/* Glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-[#0f766e]/20 to-amber-200/20 rounded-3xl blur-2xl" />

      {/* Browser chrome */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden">
        {/* Browser bar */}
        <div className="bg-gray-50 border-b border-black/8 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4 bg-white border border-black/8 rounded-md px-2 py-0.5 text-[9px] text-gray-400 font-mono">
            app.aqarflow.com/dashboard
          </div>
        </div>

        {/* App shell */}
        <div className="flex h-[300px]">
          {/* Sidebar */}
          <div className="w-12 bg-[#0a0a0a] flex flex-col items-center py-4 gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#0f766e] flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">A</span>
            </div>
            {["▦", "⊞", "◈", "⊕", "≋"].map((icon, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] ${i === 0 ? "bg-[#0f766e]/20 text-[#0f766e]" : "text-gray-500 hover:text-gray-300"}`}
              >
                {icon}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 bg-[#f8f8f7] overflow-hidden p-3 flex flex-col gap-3">
            <div className="text-xs font-semibold text-[#0a0a0a]">Dashboard</div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2">
              <KpiChip label="Listings" value="148" up={true} />
              <KpiChip label="Active Leads" value="37" up={true} />
              <KpiChip label="Deals" value="12" up={false} />
            </div>

            {/* Listings */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-black/5">
              <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Listings</div>
              <ListingRow title="Marina Heights 4B" status="Active" price="AED 2.4M" />
              <ListingRow title="Jumeirah Villa 6" status="Pending" price="AED 8.1M" />
              <ListingRow title="Creek View Studio" status="Sold" price="AED 0.9M" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-3 -right-3 bg-[#0f766e] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
        Live
      </div>
    </div>
  );
}
