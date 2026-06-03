import Link from "next/link";
import { redirect } from "next/navigation";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import { BusinessSwitcher } from "@/components/settings/business-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBusinesses, getBusinessProfile, getSessionUser } from "@/lib/data/queries";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getBusinessProfile(user.id);
  if (!profile) redirect("/setup");
  const businesses = await getBusinesses(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Business configuration"
        description="Manage your businesses, GST identity, bank details, and financial year locks."
        action={
          <Button asChild variant="secondary">
            <Link href="/api/export" target="_blank">
              Export backup
            </Link>
          </Button>
        }
      />

      {/* Business management — view list + add new (switching is in the navbar) */}
      <Card>
        <BusinessSwitcher businesses={businesses} />
      </Card>

      {/* Legacy business profile — logo, signature, terms, financial year lock */}
      <div>
        <h2 className="mb-1 text-lg font-semibold">Invoice Assets &amp; Locks</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Logo, authorised signature, terms &amp; conditions, and financial year lock apply to all invoice PDFs.
        </p>
        <Card>
          <BusinessProfileForm profile={profile} userId={user.id} />
        </Card>
      </div>
    </div>
  );
}
