import Link from "next/link";
import { AuthShell } from "@/components/templates/AuthShell";
import { SignupForm } from "@/components/molecules/SignupForm";

export default function SignupPage(): React.ReactElement {
  return (
    <AuthShell
      title="Register your company"
      subtitle="Your account will be reviewed and activated by our team"
    >
      <SignupForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
