import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/layout/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue creating content."
    >
      <SignIn />
    </AuthShell>
  );
}
