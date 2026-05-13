import { AuthShell } from "@/components/templates/AuthShell";
import { LoginForm } from "@/components/molecules/LoginForm";

export default function LoginPage(): React.ReactElement {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      brandName="AqarFlow"
      brandTagline="Run your real estate company from one place — listings, leads, deals, agents, and your public site."
      brandSublabel="Real Estate Operations"
      panelGradient="from-teal-900 via-teal-800 to-teal-950"
    >
      <LoginForm />
    </AuthShell>
  );
}
