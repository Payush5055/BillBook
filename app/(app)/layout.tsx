import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { PageShell } from "@/components/layout/page-shell";
import { getBusinesses, getSessionUser } from "@/lib/data/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const businesses = await getBusinesses(user.id);

  return (
    <div className="relative">
      <PageShell className="flex gap-6 pb-28 lg:pb-8">
        <AppSidebar />
        <div className="min-w-0 flex-1">
          <div className="no-print mb-6 flex justify-end">
            <UserMenu email={user.email} businesses={businesses} />
          </div>
          {children}
        </div>
      </PageShell>
      <MobileNav />
    </div>
  );
}
