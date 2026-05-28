import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-cyan-400/12 via-white/5 to-emerald-400/10 p-8 lg:block">
          <div className="grid-surface h-full rounded-[28px] border border-white/10 p-8">
            <div className="max-w-xl">
              <p className="text-sm uppercase tracking-[0.4em] text-cyan-200/80">BillBook</p>
              <h1 className="mt-5 text-5xl font-semibold leading-tight">
                Premium GST billing, built like a modern SaaS product.
              </h1>
              <p className="mt-6 text-base leading-7 text-muted-foreground">
                Create invoices, track payments, manage customers, and stay reporting-ready
                without the clutter of old accounting software.
              </p>
            </div>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-xl rounded-[32px] p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Welcome back</p>
            <h2 className="mt-3 text-3xl font-semibold">Sign in to your workspace</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Email and password authentication with protected routes and persistent sessions.
            </p>
          </div>
          <LoginForm />
        </Card>
      </div>
    </main>
  );
}
