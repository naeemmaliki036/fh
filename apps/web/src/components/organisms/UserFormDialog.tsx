"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUser, useUpdateUser } from "@/hooks/mutations/useUserMutations";
import { PhoneInput } from "@/components/molecules/PhoneInput";
import { isValidPhone } from "@/lib/utils/phone";
import type { User, TenantRole } from "@/lib/types";

const ASSIGNABLE_ROLES: { value: TenantRole; label: string }[] = [
  { value: "company_admin", label: "Company Admin" },
  { value: "property_admin", label: "Property Admin" },
  { value: "listing_manager", label: "Listing Manager" },
  { value: "agent", label: "Agent" },
  { value: "finance_user", label: "Finance User" },
  { value: "read_only", label: "Read Only" },
];

const ROLE_ENUM = [
  "company_admin",
  "property_admin",
  "listing_manager",
  "agent",
  "finance_user",
  "read_only",
] as [TenantRole, ...TenantRole[]];

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  role: z.enum(ROLE_ENUM),
  phone: z.string().optional().refine((v) => !v || isValidPhone(v), "Invalid phone number"),
});

const editSchema = z.object({
  full_name: z.string().min(2),
  role: z.enum(ROLE_ENUM),
  phone: z.string().optional().refine((v) => !v || isValidPhone(v), "Invalid phone number"),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

type UserFormDialogProps =
  | { mode: "create"; onClose: () => void }
  | { mode: "edit"; user: User; onClose: () => void };

export function UserFormDialog(props: UserFormDialogProps): React.ReactElement {
  const { mutate: createUser, isPending: creating } = useCreateUser();
  const { mutate: updateUser, isPending: updating } = useUpdateUser();
  const isPending = creating || updating;

  if (props.mode === "create") {
    return (
      <CreateForm
        onClose={props.onClose}
        onSubmit={(data) => createUser(data, { onSuccess: props.onClose })}
        isPending={isPending}
      />
    );
  }
  return (
    <EditForm
      user={props.user}
      onClose={props.onClose}
      onSubmit={(data) =>
        updateUser({ id: props.user.id, ...data }, { onSuccess: props.onClose })
      }
      isPending={isPending}
    />
  );
}

interface CreateFormProps {
  onClose: () => void;
  onSubmit: (data: CreateValues) => void;
  isPending: boolean;
}

function CreateForm({ onClose, onSubmit, isPending }: CreateFormProps): React.ReactElement {
  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { phone: "" },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.phone?.message}
                />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditFormProps {
  user: User;
  onClose: () => void;
  onSubmit: (data: EditValues) => void;
  isPending: boolean;
}

function EditForm({ user, onClose, onSubmit, isPending }: EditFormProps): React.ReactElement {
  const defaultRole = ROLE_ENUM.includes(user.role as TenantRole)
    ? (user.role as z.infer<typeof editSchema>["role"])
    : "agent" as const;

  const { register, handleSubmit, control, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { full_name: user.full_name, role: defaultRole, phone: user.phone ?? "" },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={errors.phone?.message}
                />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
