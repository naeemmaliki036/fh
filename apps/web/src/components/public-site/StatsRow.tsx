import type { PublicTenantProfile } from "@/lib/types/public-site";
import { formatMoneyCompact } from "@/lib/utils/format-money-compact";

interface StatsRowProps {
  profile: PublicTenantProfile;
}

interface StatCell {
  value: string;
  label: string;
}

function buildStats(profile: PublicTenantProfile): StatCell[] {
  const stats = profile.stats;
  const cells: StatCell[] = [
    {
      value: stats?.listings_count != null ? `${stats.listings_count}+` : "—",
      label: "Verified listings",
    },
    {
      value: stats?.agents_count != null ? `${stats.agents_count}+` : "—",
      label: "Trusted agents",
    },
    {
      value: stats?.featured_area ?? "UAE",
      label: "Featured area",
    },
    {
      value: stats?.inventory_value_aed != null
        ? formatMoneyCompact(stats.inventory_value_aed)
        : "24/7",
      label: stats?.inventory_value_aed != null ? "Property value" : "Buyer support",
    },
  ];
  return cells;
}

export function StatsRow({ profile }: StatsRowProps): React.ReactElement {
  const cells = buildStats(profile);

  return (
    <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label}>
          <strong className="block text-2xl font-black tracking-tight">{cell.value}</strong>
          <span className="mt-1 block text-sm text-slate-500">{cell.label}</span>
        </div>
      ))}
    </div>
  );
}
