"use client";

import { useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChangeListingPrice } from "@/hooks/mutations/useListingPriceMutations";

interface ChangePriceModalProps {
  listingId: string;
  currentPrice: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePriceModal({
  listingId,
  currentPrice,
  currency,
  open,
  onOpenChange,
}: ChangePriceModalProps): ReactElement {
  const [newPrice, setNewPrice] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const { mutate: changePrice, isPending } = useChangeListingPrice(listingId);

  const handleSubmit = (): void => {
    if (!newPrice.trim() || !reasonNote.trim()) return;
    changePrice(
      { new_price: newPrice.trim(), reason_note: reasonNote.trim() },
      {
        onSuccess: () => {
          setNewPrice("");
          setReasonNote("");
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = (): void => {
    setNewPrice("");
    setReasonNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Price</DialogTitle>
          <DialogDescription>
            Current price: {currency} {parseFloat(currentPrice).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-price">New price ({currency}) *</Label>
            <Input
              id="new-price"
              type="number"
              min="0"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Enter new price"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason-note">Reason *</Label>
            <textarea
              id="reason-note"
              rows={3}
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Reason for price change..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            disabled={isPending || !newPrice.trim() || !reasonNote.trim()}
            onClick={handleSubmit}
          >
            {isPending ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
