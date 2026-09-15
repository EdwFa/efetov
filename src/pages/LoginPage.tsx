import { LoginForm, QuickRoleCards } from "@/features/auth/LoginForm";
import { Toast } from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

export function LoginPage() {
  const { toast } = useToast();
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="grid w-full max-w-5xl items-stretch gap-6 lg:grid-cols-[1fr_1.2fr]">
        <LoginForm />
        <QuickRoleCards />
      </div>
      <Toast message={toast} />
    </main>
  );
}
