import Link from "next/link";
import { redirect } from "next/navigation";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import { BusinessSwitcher } from "@/components/settings/business-switcher";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBusinessProfile, getBusinesses, getSessionUser } from "@/lib/data/queries";

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
        description="Manage your businesses, GST identity, invoice prefix, bank details, and financial year locks."
        action={
          <Button asChild variant="secondary">
            <Link href="/api/export" target="_blank">
              Export backup
            </Link>
          </Button>
        }
      />

      {/* Multi-business switcher */}
      <Card>
        <BusinessSwitcher businesses={businesses} />
      </Card>

      {/* Legacy business profile form */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Default Business Profile</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Used for invoice PDF assets (logo, signature) and financial year lock.
        </p>
        <Card>
          <BusinessProfileForm profile={profile} userId={user.id} />
        </Card>
      </div>
    </div>
  );
}
