"use client";

import { useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { InterestStatusBadge } from "@/components/atoms/InterestStatusBadge";
import { LinkCustomerDialog } from "@/components/molecules/LinkCustomerDialog";
import { Button } from "@/components/ui/button";
import { useListingInterestedCustomers } from "@/hooks/queries/useInterestedCustomers";
import {
  useLinkCustomerToListing,
  useUnlinkCustomerFromListing,
} from "@/hooks/mutations/useInterestedCustomerMutations";
import type { ListingStatus } from "@/lib/types/listing";

const EDITABLE_STATUSES = new Set<ListingStatus>(["active", "draft"]);
const MAX_INTERESTED = 10;

interface InterestedCustomersPanelProps {
  listingId: string;
  listingStatus: ListingStatus;
}

export function InterestedCustomersPanel({
  listingId,
  listingStatus,
}: InterestedCustomersPanelProps): React.ReactElement {
  const [showLink, setShowLink] = useState(false);
  const { data, isLoading } = useListingInterestedCustomers(listingId);
  const { mutate: link, isPending: linking } = useLinkCustomerToListing(listingId);
  const { mutate: unlink, isPending: unlinking } = useUnlinkCustomerFromListing(listingId);

  const isEditable = EDITABLE_STATUSES.has(listingStatus);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {total} / {MAX_INTERESTED} interested customers
          </p>
          {!isEditable && (
            <p className="text-xs text-muted-foreground mt-0.5">Read-only — listing is {listingStatus}</p>
          )}
        </div>
        {isEditable && (
          <Button size="sm" variant="outline" onClick={() => setShowLink(true)}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />Link customer
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && items.length === 0 && (
        <div className="rounded-md border bg-muted/20 py-8 text-center">
          <p className="text-sm text-muted-foreground">No interested customers yet.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Customer</th>
                <th className="px-3 py-2 text-left font-medium">Phone</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Linked</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                {isEditable && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-3 py-2.5 font-medium">{row.customer_name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.customer_phone ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{row.customer_email ?? "—"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {new Date(row.linked_at).toLocaleDateString("en-AE")}
                  </td>
                  <td className="px-3 py-2.5">
                    <InterestStatusBadge status={row.interest_status} />
                  </td>
                  {isEditable && (
                    <td className="px-3 py-2.5">
                      {row.interest_status === "interested" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={unlinking}
                          onClick={() => unlink(row.customer_id)}
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LinkCustomerDialog
        open={showLink}
        onOpenChange={setShowLink}
        isPending={linking}
        onConfirm={(customerId, notes) => {
          link({ customer_id: customerId, notes });
          setShowLink(false);
        }}
      />
    </div>
  );
}
