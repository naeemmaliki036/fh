import { AuthShell } from "@/components/templates/AuthShell";
import { PlatformLoginForm } from "@/components/molecules/PlatformLoginForm";

export default function PlatformLoginPage(): React.ReactElement {
  return (
    <AuthShell
      title="Platform Administration"
      subtitle="Sign in with your platform admin credentials"
    >
      <PlatformLoginForm />
    </AuthShell>
  );
}
