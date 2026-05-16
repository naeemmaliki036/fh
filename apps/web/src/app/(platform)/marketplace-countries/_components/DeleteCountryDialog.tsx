"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { MarketplaceCountry } from "@/lib/types";

interface Props {
  country: MarketplaceCountry | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isPending: boolean;
}

export function DeleteCountryDialog({ country, onClose, onConfirm, isPending }: Props): React.ReactElement {
  return (
    <Dialog open={country !== null} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete country</DialogTitle>
          <DialogDescription>
            {country
              ? `Delete ${country.flag_emoji} ${country.name}? This won't affect existing listings, but the country will disappear from the marketplace selector.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={isPending || !country}
            onClick={() => { if (country) onConfirm(country.id); }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
