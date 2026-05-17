"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { useConsumer } from "@/lib/consumer-context";
import { useToggleFavorite } from "@/hooks/mutations/useFavoriteMutations";

interface FavoriteButtonProps {
  listingId: string;
}

function SignInDialog({
  onClose,
}: {
  onClose: () => void;
}): React.ReactElement {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-slate-100 bg-white shadow-xl p-4 space-y-3"
    >
      <p className="text-sm font-bold text-slate-900 leading-snug">
        Sign in to save favorites
      </p>
      <div className="flex flex-col gap-2">
        <Link
          href="/login"
          onClick={onClose}
          className="w-full rounded-xl bg-teal-600 py-2 text-center text-xs font-bold text-white hover:bg-teal-700 transition"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          onClick={onClose}
          className="w-full rounded-xl border border-slate-200 py-2 text-center text-xs font-bold text-slate-700 hover:border-teal-300 transition"
        >
          Create account
        </Link>
      </div>
      <button
        onClick={onClose}
        className="absolute top-2 right-3 text-slate-400 text-xs hover:text-slate-700"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

export function FavoriteButton({ listingId }: FavoriteButtonProps): React.ReactElement {
  const { token, favoriteIds } = useConsumer();
  const isFavorited = favoriteIds.has(listingId);
  const { mutate, isPending } = useToggleFavorite();
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleClick(e: React.MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      setDialogOpen((v) => !v);
      return;
    }
    mutate(listingId);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 disabled:opacity-60",
          isFavorited ? "text-rose-500" : "text-slate-400",
        )}
      >
        <Heart
          className="h-4 w-4"
          fill={isFavorited ? "currentColor" : "none"}
        />
      </button>

      {dialogOpen && (
        <SignInDialog onClose={() => setDialogOpen(false)} />
      )}
    </div>
  );
}
