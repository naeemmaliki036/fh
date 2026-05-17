"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useConsumerMe } from "@/hooks/queries/useConsumerMe";
import { updateConsumerMe } from "@fh/api-client/src/consumer";
import { marketplaceAuthedApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { isValidPhone, sanitizePhone } from "@/lib/phone";
import { Loader2 } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-slate-600 mb-1";

export default function ProfilePage(): React.ReactElement {
  const qc = useQueryClient();
  const { data: me, isLoading } = useConsumerMe();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  useEffect(() => {
    if (me) {
      setFullName(me.full_name ?? "");
      setPhone(me.phone ?? "");
    }
  }, [me]);

  const mut = useMutation({
    mutationFn: () =>
      updateConsumerMe(marketplaceAuthedApi, {
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.consumer.me });
      toast.success("Profile updated.");
    },
    onError: () => {
      toast.error("Failed to update profile.");
    },
  });

  function validate(): boolean {
    const e: { fullName?: string; phone?: string } = {};
    if (fullName.trim().length < 2) e.fullName = "Name must be at least 2 characters";
    if (phone && !isValidPhone(phone)) e.phone = "Invalid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent): void {
    ev.preventDefault();
    if (!validate()) return;
    mut.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-10 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-black text-slate-900">Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelCls}>Email</label>
          <input value={me?.email ?? ""} disabled className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`} />
          <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <label className={labelCls}>Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className={inputCls}
          />
          {errors.fullName && <p className="text-[11px] text-red-500 mt-1">{errors.fullName}</p>}
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(sanitizePhone(e.target.value))}
            placeholder="+971 50 000 0000"
            className={inputCls}
          />
          {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
        </div>
        <button
          type="submit"
          disabled={mut.isPending}
          className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-black text-white hover:bg-teal-700 transition disabled:opacity-60"
        >
          {mut.isPending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
