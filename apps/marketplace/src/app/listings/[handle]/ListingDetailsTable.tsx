import type { MarketplaceListingDetail } from "@fh/portal-types";

interface ListingDetailsTableProps {
  listing: MarketplaceListingDetail;
}

interface TableRow {
  label: string;
  value: string | number | null | undefined;
}

function capitalize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ListingDetailsTable({
  listing,
}: ListingDetailsTableProps): React.ReactElement | null {
  const rows: TableRow[] = [
    { label: "Type", value: capitalize(listing.property_type) },
    { label: "Purpose", value: listing.purpose === "sale" ? "For Sale" : "For Rent" },
    { label: "Reference No.", value: listing.internal_reference },
    { label: "Furnishing", value: listing.furnishing_status ? capitalize(listing.furnishing_status) : null },
    { label: "Completion", value: listing.completion_status ? capitalize(listing.completion_status) : null },
    { label: "Built Year", value: listing.build_year },
    { label: "Plot Area", value: listing.plot_area_sqft ? `${listing.plot_area_sqft.toLocaleString()} sqft` : null },
    { label: "Parking Spaces", value: listing.parking_spaces },
    { label: "Service Charge", value: listing.service_charge_per_sqft ? `${listing.currency} ${listing.service_charge_per_sqft}/sqft` : null },
    { label: "RERA Permit", value: listing.rera_permit },
    { label: "Trakheesi", value: listing.trakheesi },
    { label: "Ownership Type", value: listing.ownership_type ? capitalize(listing.ownership_type) : null },
  ];

  const activeRows = rows.filter((r) => r.value != null && r.value !== "");

  if (activeRows.length === 0) return null;

  return (
    <div>
      <h2 className="text-base font-black text-slate-900 mb-3">Property details</h2>
      <div className="rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {activeRows.map(({ label, value }, i) => (
              <tr
                key={label}
                className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                <td className="px-4 py-3 font-semibold text-slate-500 w-1/2">{label}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
