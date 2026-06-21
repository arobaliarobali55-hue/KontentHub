import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/layout/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start generating content that sounds like you."
    >
      <SignUp />
    </AuthShell>
  );
}
