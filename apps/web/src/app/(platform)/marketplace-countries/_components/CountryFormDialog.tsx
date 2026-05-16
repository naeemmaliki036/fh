"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { MarketplaceCountry, MarketplaceCountryCreateRequest, MarketplaceCountryUpdateRequest } from "@/lib/types";

interface AddProps {
  mode: "add";
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MarketplaceCountryCreateRequest) => void;
  isPending: boolean;
}

interface EditProps {
  mode: "edit";
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MarketplaceCountryUpdateRequest) => void;
  isPending: boolean;
  country: MarketplaceCountry;
}

type Props = AddProps | EditProps;

export function CountryFormDialog(props: Props): React.ReactElement {
  const { mode, open, onClose, isPending } = props;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [flagEmoji, setFlagEmoji] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit") {
      const c = props.country;
      setName(c.name);
      setFlagEmoji(c.flag_emoji);
      setDisplayOrder(String(c.display_order));
      setEnabled(c.enabled);
    } else {
      setCode("");
      setName("");
      setFlagEmoji("");
      setDisplayOrder("");
      setEnabled(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  function handleSubmit(): void {
    if (mode === "add") {
      const data: MarketplaceCountryCreateRequest = {
        code: code.toUpperCase().slice(0, 2),
        name: name.trim(),
        flag_emoji: flagEmoji.trim(),
        enabled,
      };
      if (displayOrder.trim()) data.display_order = Number(displayOrder);
      (props as AddProps).onSubmit(data);
    } else {
      const data: MarketplaceCountryUpdateRequest = {
        name: name.trim(),
        flag_emoji: flagEmoji.trim(),
        enabled,
      };
      if (displayOrder.trim()) data.display_order = Number(displayOrder);
      (props as EditProps).onSubmit(data);
    }
  }

  const isValid = mode === "add" ? code.trim().length > 0 && name.trim().length > 0 : name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add country" : "Edit country"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {mode === "add" ? (
            <div className="space-y-1">
              <Label htmlFor="mc-code">Code (2 chars)</Label>
              <Input
                id="mc-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="AE"
                maxLength={2}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Code</Label>
              <p className="text-sm font-mono px-3 py-2 bg-muted rounded-md">{props.country.code}</p>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="mc-flag">Flag emoji</Label>
            <Input
              id="mc-flag"
              value={flagEmoji}
              onChange={(e) => setFlagEmoji(e.target.value)}
              placeholder=""
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="mc-name">Name</Label>
            <Input
              id="mc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="United Arab Emirates"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="mc-order">Display order (blank = end of list)</Label>
            <Input
              id="mc-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="1"
              min={1}
            />
          </div>

          <div className="flex items-center gap-3">
            <ToggleSwitch checked={enabled} onCheckedChange={setEnabled} id="mc-enabled" />
            <Label htmlFor="mc-enabled">Enabled</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !isValid}>
            {isPending ? "Saving..." : mode === "add" ? "Add" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
