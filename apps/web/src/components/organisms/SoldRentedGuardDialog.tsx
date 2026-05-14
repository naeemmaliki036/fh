"use client";

import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeals } from "@/hooks/queries/useDeals";
import type { PropertyStatus } from "@/lib/types/property";

interface SoldRentedGuardDialogProps {
  propertyId: string;
  targetStatus: Extract<PropertyStatus, "sold" | "rented"> | null;
  onClose: () => void;
  onProceed: (reasonCode: string, reasonNote: string | null) => Promise<void>;
}

const STATIC_REASON: Record<"sold" | "rented", { code: string; label: string }> = {
  sold: { code: "sale_completed", label: "Sale completed" },
  rented: { code: "rental_agreed", label: "Rental agreed" },
};

export function SoldRentedGuardDialog({
  propertyId,
  targetStatus,
  onClose,
  onProceed,
}: SoldRentedGuardDialogProps): React.ReactElement {
  const router = useRouter();
  const open = targetStatus !== null;

  const { data: dealsData, isLoading } = useDeals(
    targetStatus ? { property_id: propertyId, stage: "closed_won" } : undefined,
  );

  const hasClosedWon = (dealsData?.items.length ?? 0) > 0;

  const handleProceed = async (): Promise<void> => {
    if (!targetStatus) return;
    const { code } = STATIC_REASON[targetStatus];
    await onProceed(code, null);
    onClose();
  };

  if (!open) return <></>;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as {targetStatus === "sold" ? "Sold" : "Rented"}</DialogTitle>
          <DialogDescription>
            {isLoading
              ? "Checking for a closed-won deal…"
              : hasClosedWon
                ? "A closed-won deal exists for this property. You can proceed."
                : "No closed-won deal found for this property."}
          </DialogDescription>
        </DialogHeader>

        {!isLoading && !hasClosedWon && (
          <p className="text-sm text-muted-foreground">
            You must have a closed-won deal before marking a property as sold or rented. Create one first, then return here.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {!isLoading && !hasClosedWon && (
            <Button onClick={() => { onClose(); router.push(`/deals?property_id=${propertyId}`); }}>
              Go to Deals
            </Button>
          )}
          {!isLoading && hasClosedWon && (
            <Button onClick={handleProceed}>
              Confirm
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
