"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlatformLogin } from "@/hooks/mutations/useAuthMutations";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function PlatformLoginForm(): React.ReactElement {
  const { mutate: login, isPending } = usePlatformLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues): void => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="platform-email" className="text-sm font-medium text-slate-700">
          Email
        </Label>
        <Input
          id="platform-email"
          type="email"
          autoComplete="email"
          placeholder="admin@platform.com"
          className="rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-1 focus-visible:ring-indigo-600"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="platform-password" className="text-sm font-medium text-slate-700">
          Password
        </Label>
        <Input
          id="platform-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="rounded-xl border-slate-200 bg-white shadow-none focus-visible:ring-1 focus-visible:ring-indigo-600"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in as Platform Admin
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 pt-1">
        Platform access is restricted. Contact the system administrator.
      </p>
    </form>
  );
}
