"use client";

import Link from "next/link";
import { type ReactElement } from "react";
import { ListingStatusBadge } from "@/components/atoms/ListingStatusBadge";
import { ListingPurposeBadge } from "@/components/atoms/ListingPurposeBadge";
import { formatDate } from "@/lib/utils/format-date";
import type { Listing } from "@/lib/types/listing";

interface ListingsTableProps {
  listings: Listing[];
}

export function ListingsTable({ listings }: ListingsTableProps): ReactElement {
  if (listings.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground border rounded-md bg-muted/20">
        No listings found.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Title</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Purpose</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Price</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tier</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {listings.map((l) => (
            <tr key={l.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5">
                <Link
                  href={`/listings/${l.id}`}
                  className="font-medium hover:underline truncate block max-w-64"
                >
                  {l.title}
                </Link>
              </td>
              <td className="px-4 py-2.5"><ListingPurposeBadge purpose={l.purpose} /></td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {l.currency} {parseFloat(l.price).toLocaleString()}
              </td>
              <td className="px-4 py-2.5"><ListingStatusBadge status={l.status} /></td>
              <td className="px-4 py-2.5 capitalize text-muted-foreground">{l.listing_tier}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{formatDate(l.created_at, "en")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
