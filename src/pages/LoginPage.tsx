import { LoginForm, QuickRoleCards } from "@/features/auth/LoginForm";
import { Toast } from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

export function LoginPage() {
  const { toast } = useToast();
  return (
    <main className="flex min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="m-auto grid w-full max-w-5xl items-stretch gap-6 lg:grid-cols-[1fr_1.2fr]">
        <LoginForm />
        <QuickRoleCards />
      </div>
      <Toast message={toast} />
    </main>
  );
}
