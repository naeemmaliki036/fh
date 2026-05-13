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
import { Textarea } from "@/components/atoms/Textarea";

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
  const [error, setError] = useState<string | null>(null);
  const { mutate: changePrice, isPending } = useChangeListingPrice(listingId);

  const parsedPrice = Number(newPrice);
  const isValidPrice = newPrice.trim() !== "" && Number.isFinite(parsedPrice) && parsedPrice > 0;

  const handleSubmit = (): void => {
    if (!reasonNote.trim()) {
      setError("Reason is required");
      return;
    }
    if (!isValidPrice) {
      setError("New price must be a positive number");
      return;
    }
    if (parsedPrice === Number(currentPrice)) {
      setError("New price is the same as current price");
      return;
    }
    setError(null);
    changePrice(
      { new_price: parsedPrice.toString(), reason_note: reasonNote.trim() },
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
            <Textarea
              id="reason-note"
              rows={3}
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="Reason for price change..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {error && <p className="text-xs text-destructive px-1">{error}</p>}
          <Button
            disabled={isPending || !isValidPrice || !reasonNote.trim()}
            onClick={handleSubmit}
          >
            {isPending ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
