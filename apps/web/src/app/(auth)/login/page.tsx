import Link from "next/link";
import { AuthShell } from "@/components/templates/AuthShell";
import { LoginForm } from "@/components/molecules/LoginForm";

export default function LoginPage(): React.ReactElement {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <LoginForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        New company?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Register here
        </Link>
      </p>
    </AuthShell>
  );
}
