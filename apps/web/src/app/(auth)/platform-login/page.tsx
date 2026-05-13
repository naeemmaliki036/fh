import { AuthShell } from "@/components/templates/AuthShell";
import { PlatformLoginForm } from "@/components/molecules/PlatformLoginForm";

export default function PlatformLoginPage(): React.ReactElement {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your platform admin account"
      brandName="AqarFlow Admin"
      brandTagline="Platform admin console — manage tenants, billing, and platform-wide settings."
      brandSublabel="Platform Administration"
      panelGradient="from-indigo-950 via-indigo-900 to-slate-950"
    >
      <PlatformLoginForm />
    </AuthShell>
  );
}
