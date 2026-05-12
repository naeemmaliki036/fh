import { StatusBadge } from "@/components/atoms/StatusBadge";
import { RoleBadge } from "@/components/atoms/RoleBadge";
import { Button } from "@/components/ui/button";
import type { User, UserStatus } from "@/lib/types";

interface TransitionButton {
  label: string;
  targetStatus: UserStatus;
  destructive: boolean;
}

function getTransitions(user: User): TransitionButton[] {
  if (user.status === "active") {
    return [{ label: "Disable", targetStatus: "disabled", destructive: true }];
  }
  return [{ label: "Enable", targetStatus: "active", destructive: false }];
}

interface UserRowProps {
  user: User;
  canManage: boolean;
  onEdit: (user: User) => void;
  onStatusChange: (user: User, targetStatus: UserStatus) => void;
}

export function UserRow({ user, canManage, onEdit, onStatusChange }: UserRowProps): React.ReactElement {
  const transitions = getTransitions(user);

  return (
    <tr className="border-b">
      <td className="px-4 py-3 text-sm font-medium">{user.full_name}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      {canManage && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(user)}>
              Edit
            </Button>
            {transitions.map((t) => (
              <Button
                key={t.targetStatus}
                size="sm"
                variant={t.destructive ? "destructive" : "secondary"}
                onClick={() => onStatusChange(user, t.targetStatus)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </td>
      )}
    </tr>
  );
}
